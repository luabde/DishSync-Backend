import { RestaurantDTO, UpdateRestaurantDTO } from "../models/restaurant.model";
import { prisma } from "../loaders/prisma.loader";
import { AppError } from "../utils/AppError";
import path from "path";
import { existsSync } from "fs";
import { geocodeAddress } from "../utils/geocoding.util";
import {
    CreateReservationByStaffDTO,
    CreateReservationDTO,
    UpdateReservationByStaffDTO,
} from "../models/reservation.model";
import { generateReservationToken } from "../utils/reservationToken.util";
import { EmailService } from "./email.service";
import { envConfig } from "../config/env.config";
import { Worker } from "worker_threads";
import { supabase } from "../loaders/supabase";

type EmailJob =
    | { type: "PENDING_RESERVATION"; payload: Parameters<typeof EmailService.sendPendingReservationEmail>[0] }
    | { type: "CONFIRMED_RESERVATION"; payload: Parameters<typeof EmailService.sendConfirmedReservationEmail>[0] }
    | { type: "CANCELLED_RESERVATION"; payload: Parameters<typeof EmailService.sendCancelledReservationEmail>[0] };

type ReservationExpiryJob = {
    reservaId: number;
};

export class RestaurantService {
    static enqueueEmailJob(job: EmailJob): void {
        try {
            // En build: dist/services -> dist/workers/email.worker.js
            const workerJsPath = path.resolve(__dirname, "../workers/email.worker.js");
            // En dev: arrancamos un bootstrap CJS que registra tsx y carga email.worker.ts.
            const workerBootstrapPath = path.resolve(__dirname, "../workers/email.worker.bootstrap.cjs");
            const useTsWorker = !existsSync(workerJsPath);

            const worker = new Worker(
                useTsWorker ? workerBootstrapPath : workerJsPath,
                { workerData: job }
            );

            worker.on("message", (msg: { success: boolean; error?: string }) => {
                if (!msg.success) {
                    console.error(`[EmailWorker] Error enviando email (${job.type}):`, msg.error);
                } else {
                    console.log(`[EmailWorker] Email enviado correctamente (${job.type})`);
                }
            });

            worker.on("error", (err) => {
                console.error(`[EmailWorker] Worker error (${job.type}):`, err);
            });

            worker.on("exit", (code) => {
                if (code !== 0) {
                    console.error(`[EmailWorker] Worker salió con código ${code}`);
                }
            });
        } catch (err) {
            // No bloqueamos la operación principal (crear/confirmar/cancelar reserva)
            // por un error al encolar el email.
            console.error(`[EmailWorker] No se pudo encolar el email (${job.type}):`, err);
        }
    }

    static enqueueReservationExpiryJob(job: ReservationExpiryJob): void {
        try {
            // En build: dist/services -> dist/workers/reservation-expiry.worker.js
            const workerJsPath = path.resolve(__dirname, "../workers/reservation-expiry.worker.js");
            // En dev: bootstrap CJS para poder ejecutar el worker TS con tsx.
            const workerBootstrapPath = path.resolve(__dirname, "../workers/reservation-expiry.worker.bootstrap.cjs");
            const useTsWorker = !existsSync(workerJsPath);

            const worker = new Worker(
                useTsWorker ? workerBootstrapPath : workerJsPath,
                { workerData: job }
            );

            worker.on("message", (msg: { success: boolean; error?: string }) => {
                if (!msg.success) {
                    console.error(`[ExpiryWorker] Error expirando reserva (${job.reservaId}):`, msg.error);
                } else {
                    console.log(`[ExpiryWorker] Reserva expiración procesada (${job.reservaId})`);
                }
            });

            worker.on("error", (err) => {
                console.error(`[ExpiryWorker] Worker error (${job.reservaId}):`, err);
            });

            worker.on("exit", (code) => {
                if (code !== 0) {
                    console.error(`[ExpiryWorker] Worker salió con código ${code}`);
                }
            });
        } catch (err) {
            // No bloqueamos la creación de la reserva por un error al encolar expiración.
            console.error(`[ExpiryWorker] No se pudo encolar expiración (${job.reservaId}):`, err);
        }
    }

    // ---- SERVICIOS PARA RUTAS CRUD RESTAURANT ----
    private static async saveRestaurantImage(imageFile: { originalname: string; buffer: Buffer }) {
        // Centraliza el guardado físico para reusar en create y update.
        const extension = path.extname(imageFile.originalname) || ".jpg";
        const fileName = `restaurant-${Date.now()}${extension}`;
        const filePath = `restaurants/${fileName}`;

        const { error } = await supabase.storage
        .from("dishSync-img")
        .upload(filePath, imageFile.buffer, {
            contentType: `image/${extension.replace(".", "")}`,
            upsert: true,
        });

        if (error) throw new Error(`Error pujant imatge: ${error.message}`);

        const { data } = supabase.storage
            .from("dishSync-img")
            .getPublicUrl(filePath);

        return data.publicUrl;
    }

    private static async removeLocalRestaurantImage(imageUrl?: string | null) {
        // Solo eliminamos imágenes locales gestionadas por la app.
        // Esto evita borrar URLs externas o rutas no controladas.
        if (!imageUrl || !imageUrl.includes("/restaurants/")) return;

        const filePath = "restaurants/" + imageUrl.split("/restaurants/")[1];

        await supabase.storage
            .from("dishSync-img")
            .remove([filePath]);
    }

    /**
     * Ejemplo base de alta de restaurante con imagen en local (entorno dev):
     * - Si llega fichero, se guarda en /public/restaurants
     * - Se genera una URL pública y se persiste en el campo `url`
     */
    static async createRestaurant(data: RestaurantDTO, imageFile?: { originalname: string; buffer: Buffer }) {
        let imageUrl = data.url;
        const { wizardData, ...restaurantData } = data as RestaurantDTO & {
            wizardData?: {
                shifts?: { id: string; name: string; times: string[] }[];
                zones?: { id: string; name: string }[];
                selectedUsers?: { id: number }[];
                tablesByZone?: Record<string, { id: string; tableTypeId: number; x: number; y: number }[]>;
            };
        };
        // Geocodificamos la dirección para persistir coordenadas y poder pintarla en el mapa.
        const geocodedLocation = await geocodeAddress(restaurantData.direccio);

        if (imageFile) {
            // URL accesible desde frontend gracias a express.static
            imageUrl = await this.saveRestaurantImage(imageFile);
        }

        // Inserta todo de forma secuencial (sin transacción)
        const restaurant = await prisma.restaurant.create({
            data: {
                ...restaurantData,
                // Si no hay coordenadas, se guarda null y el restaurante no se mostrará en /locations.
                lat: geocodedLocation?.lat,
                lng: geocodedLocation?.lng,
                url: imageUrl,
            },
        });

        // Vincula el restaurante recién creado con todos los platos existentes.
        // `disponibilitat` queda en `true` por defecto según el modelo Prisma.
        const plats = await prisma.plat.findMany({
            select: { id: true },
        });

        if (plats.length > 0) {
            await prisma.platRestaurant.createMany({
                data: plats.map((plat) => ({
                    id_restaurant: restaurant.id,
                    id_plat: plat.id,
                })),
            });
        }

        // 1) TORNS + HORARIS_TORNS
        const shifts = wizardData?.shifts ?? [];
        for (const shift of shifts) {
            const times = [...(shift.times ?? [])].sort();
            const horaInici = times[0] ?? "00:00";
            const horaFi = times[times.length - 1] ?? "00:00";

            const torn = await prisma.torn.create({
                data: {
                    id_restaurant: restaurant.id,
                    nom: shift.name,
                    hora_inici: horaInici,
                    hora_fi: horaFi,
                },
            });

            if (times.length > 0) {
                await prisma.horarisTorn.createMany({
                    data: times.map((hora) => ({
                        id_torn: torn.id,
                        hora,
                    })),
                });
            }
        }

        // 2) ZONES (con capacidad máxima calculada por las mesas de cada zona)
        const tablesByZone = wizardData?.tablesByZone ?? {};
        const allTables = Object.values(tablesByZone).flat();
        const uniqueTableTypeIds = [...new Set(allTables.map((table) => table.tableTypeId))];

        // Catálogo de tipos de mesa para obtener cuántas personas aporta cada una.
        const taulesCatalog = uniqueTableTypeIds.length > 0
            ? await prisma.taula.findMany({
                where: { id: { in: uniqueTableTypeIds } },
                select: { id: true, num_persones: true },
            })
            : [];
        const personesByTypeId = new Map<number, number>(
            taulesCatalog.map((taula) => [taula.id, taula.num_persones])
        );

        const zones = wizardData?.zones ?? [];
        const zoneIdMap = new Map<string, number>(); // frontend zoneId -> db zoneId
        for (const zone of zones) {
            const tablesInZone = tablesByZone[zone.id] ?? [];
            const capacitatMax = tablesInZone.reduce(
                (total, table) => total + (personesByTypeId.get(table.tableTypeId) ?? 0),
                0
            );

            const dbZone = await prisma.zona.create({
                data: {
                    id_restaurant: restaurant.id,
                    nom: zone.name,
                    capacitat_max: capacitatMax,
                },
            });
            zoneIdMap.set(zone.id, dbZone.id);
        }

        // 3) TAULES_RESTAURANT (mapa de mesas por zona)
        for (const [frontendZoneId, tables] of Object.entries(tablesByZone)) {
            const dbZoneId = zoneIdMap.get(frontendZoneId);
            if (!dbZoneId) continue;

            await prisma.taulaRestaurant.createMany({
                data: tables.map((table, index) => ({
                    id_zona: dbZoneId,
                    id_restaurant: restaurant.id,
                    id_taula: table.tableTypeId,
                    fila: table.y,      // y en frontend equivale a fila
                    columna: table.x,   // x en frontend equivale a columna
                    num_taula: Number(table.id?.replace("T", "")) || index + 1,
                })),
            });
        }

        // 4) ASIGNACIÓN DE USUARIOS AL RESTAURANTE RECIÉN CREADO
        const selectedUsers = wizardData?.selectedUsers ?? [];
        if (selectedUsers.length > 0) {
            await prisma.usuari.updateMany({
                where: {
                    id: { in: selectedUsers.map((u) => u.id) },
                },
                data: {
                    id_restaurant: restaurant.id,
                },
            });
        }

        return restaurant;
    }

    static async getRestaurants() {
        const restaurants = await prisma.restaurant.findMany();
        return restaurants;
    }

    static async getRestaurantLocations() {
        // Endpoint público consumido por ClientHome:
        // - Cards: todos los restaurantes activos (con dirección e imagen).
        // - Mapa: frontend filtra los que tienen coordenadas válidas.
        return prisma.restaurant.findMany({
            where: {
                estat: "ACTIU",
            },
            select: {
                id: true,
                nom: true,
                direccio: true,
                descripcio: true,
                horaris: true,
                url: true,
                lat: true,
                lng: true,
                estat: true,
            },
            orderBy: {
                nom: "asc",
            },
        });
    }

    static async getRestaurantsDashboard() {
        try{
            // Obtener numero de restaurantes activos (global)
            const restaurantsActivos = await prisma.restaurant.count({
                where: {
                    estat: "ACTIU",
                },
            });
    
            // Obtener numero de restarurantes inactivos (global)
            const restaurantsInactivos = await prisma.restaurant.count({
                where: {
                    estat: "INACTIU",
                },
            });
    
            // Obtener numero de usuarios (staff) (global)
            const usuarios = await prisma.usuari.count();
    
            // Obtener numero de reservas (hoy) (global)
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
    
            const mañana = new Date(hoy);
            mañana.setDate(hoy.getDate() + 1);
    
            const reservasHoy = await prisma.reserva.count({
                where: {
                    data: {
                        gte: hoy, // Grather than or equal --> Mayor o igual que hoy
                        lt: mañana, // Less than --> Menor que mañana
                        // La combinacion de ambas hace una funcion similar al BETWEEN en SQL
                    },
                },
            });
    
            // Obtener numero de reservas semana (global)
            const finSemana = new Date(hoy);
            finSemana.setDate(finSemana.getDate() + 7);

            const reservasSemana = await prisma.reserva.count({
                where:{
                    data: {
                        gte: hoy,
                        lt: finSemana,
                    }
                }
            });


            /*
                De cada restaurante, obtenemos:
                - Numero de mesas
                - Numero de usuarios asignados
                - Numero de reservas (hoy)
                - Zonas
                - Platos disponibles
                - Platos no disponibles
            */
           const restaurants = await prisma.restaurant.findMany({
            select: {
                id: true,
                nom: true,
                direccio: true,
                url: true,
                estat: true,
                _count: {
                    select: {
                        taules_restaurant: true,
                        usuaris: true,
                        zones: true,
                    },
                },
            },
           });

           const restaurantsDashboard = await Promise.all(
            restaurants.map(async restaurant => {
                const reservasHoy = await prisma.reserva.count({
                    where: {
                        id_restaurant: restaurant.id,
                        data: {
                            gte: hoy,
                            lt: mañana,
                        },
                    },
                });
                const platsDisp = await prisma.platRestaurant.count({
                    where: {
                        id_restaurant: restaurant.id,
                        disponibilitat: true,
                      },
                });

                const platsNoDisp = await prisma.platRestaurant.count({
                    where: {
                        id_restaurant: restaurant.id,
                        disponibilitat: false,
                    },
                });

                return{
                    id: restaurant.id,
                    nom: restaurant.nom,
                    direccio: restaurant.direccio,
                    url: restaurant.url,
                    estat: restaurant.estat,
                    taules: restaurant._count.taules_restaurant,
                    usuaris: restaurant._count.usuaris,
                    reservesHoy: reservasHoy,
                    zones: restaurant._count.zones,
                    platsDisp: platsDisp,
                    platsNoDisp: platsNoDisp,
                }
           }));

           return {
            restaurantsActivos,
            restaurantsInactivos,
            usuarios,
            reservasHoy,
            reservasSemana,
            restaurantsDashboard,
          };

        }catch(error){
            throw new AppError("Error al obtener el dashboard", 500);
        }

        
    }

    static async deleteRestaurant(id: number) {
        // Normaliza a inicio de día para considerar "hoy y futuro" de forma estable.
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reservas = await prisma.reserva.aggregate({
            where: {
                id_restaurant: id,
                data: {
                    gte: today,
                },
            },
            _max: {
                data: true,
            },
        });

        if (reservas._max.data) {
            // Se informa de la última reserva futura para que el usuario sepa cuándo podrá borrar.
            const ultimaReserva = reservas._max.data.toLocaleDateString("ca-ES");
            throw new AppError(
                `Aquest restaurant te reserves futures. Ultima reserva = ${ultimaReserva}. A partir d'aquesta data podras eliminar el restaurant. Mentrestant pots desactivar-lo`,
                400
            );
        }

        // Cuando no tenga reservas futuras, se puede eliminar el restaurante
        return await prisma.restaurant.delete({
            where: { id },
        });
    }

    static async updateRestaurant(
        id: number,
        data: UpdateRestaurantDTO,
        imageFile?: { originalname: string; buffer: Buffer }
    ) {
        // 1) Validamos que el restaurante exista.
        const restaurant = await prisma.restaurant.findUnique({
            where: { id },
        });

        if (!restaurant) {
            throw new AppError("Restaurante no encontrado", 404);
        }

        // Protección adicional: si alguien manda `horaris` manualmente,
        // no lo usamos en update.
        const { horaris: _ignoredHoraris, ...safeData } = data as UpdateRestaurantDTO & { horaris?: string };
        // Solo recalculamos coordenadas si cambia la dirección.
        // Si la dirección no cambia, conservamos lat/lng actuales para evitar llamadas innecesarias.
        const hasAddressChanged = safeData.direccio.trim() !== restaurant.direccio.trim();
        const geocodedLocation = hasAddressChanged ? await geocodeAddress(safeData.direccio) : null;

        // 2) Base de la URL final:
        // - Si llega `data.url`, la respetamos.
        // - Si no llega, mantenemos la que ya tenía en DB.
        let nextUrl = safeData.url ?? restaurant.url ?? "";

        if (imageFile) {
            // 3) Caso "imagen nueva":
            // guardamos la nueva, eliminamos la anterior local y persistimos la nueva URL.
            nextUrl = await this.saveRestaurantImage(imageFile);
            await this.removeLocalRestaurantImage(restaurant.url);
        } else if (!safeData.url && restaurant.url) {
            // 4) Caso "eliminar imagen":
            // si `url` viene vacía y no hay archivo nuevo, eliminamos la imagen actual.
            await this.removeLocalRestaurantImage(restaurant.url);
            nextUrl = "";
        }

        // 5) Actualizamos el restaurante con el resto de campos + URL final calculada.
        return await prisma.restaurant.update({
            where: { id },
            data: {
                ...safeData,
                lat: hasAddressChanged ? geocodedLocation?.lat ?? null : restaurant.lat,
                lng: hasAddressChanged ? geocodedLocation?.lng ?? null : restaurant.lng,
                url: nextUrl,
            },
        });
    }

    static async deactivateRestaurant(id: number) {
        // Alternativa al borrado cuando negocio bloquea por reservas futuras.
        return await prisma.restaurant.update({
            where: { id },
            data: { estat: "INACTIU" },
        });
    }

    // ---- SERVICIOS PARA RUTAS FORM RESERVAS ----
    static async getReservationsForm(restaurantId: number, selectedDate?: string) {
        // Devuelve los horarios de los turnos de un restaurante para una fecha específica
        try{
            const turnos = await prisma.torn.findMany({
                where: { id_restaurant: restaurantId },
                select: { id: true, nom: true },
                orderBy: { id: "asc" },
            });

            const horaris_torns: Array<{ id: number; nom: string; hores: string[] }> = [];
            // Hora actual del servidor en minutos desde las 00:00.
            // Se usa para comparar fácilmente con cada slot "HH:mm".
            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();

            // La fecha llega desde frontend como YYYY-MM-DD (query `data`).
            // Si es válida y coincide con hoy, ocultamos horas ya pasadas.
            const requestedDate = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;
            const shouldFilterPastHours =
                requestedDate !== null &&
                !Number.isNaN(requestedDate.getTime()) &&
                requestedDate.getFullYear() === now.getFullYear() &&
                requestedDate.getMonth() === now.getMonth() &&
                requestedDate.getDate() === now.getDate();

            for (const turno of turnos) {
                const horas = await prisma.horarisTorn.findMany({
                    where: { id_torn: turno.id },
                    select: { hora: true },
                    orderBy: { hora: "asc" },
                });

                // - Si la fecha seleccionada es hoy, devolvemos solo horas >= hora actual.
                // - Si no es hoy, devolvemos todos los horarios del turno.
                const hores = shouldFilterPastHours
                    ? horas
                        .map((hora) => hora.hora)
                        .filter((hora) => {
                            const [hoursPart, minutesPart] = hora.split(":");
                            const hours = Number.parseInt(hoursPart ?? "", 10);
                            const minutes = Number.parseInt(minutesPart ?? "", 10);
                            if (Number.isNaN(hours) || Number.isNaN(minutes)) return false;
                            return hours * 60 + minutes >= nowMinutes;
                        })
                    : horas.map((hora) => hora.hora);

                horaris_torns.push({
                    id: turno.id,
                    nom: turno.nom,
                    hores,
                });
            }

            // Si para "hoy" un turno se queda sin horas válidas, no lo mostramos.
            return horaris_torns.filter((turno) => turno.hores.length > 0);
        }catch(error){
            throw new AppError("Error al obtener los horarios de los turnos", 500);
        }
    }

    static async getTaules(restaurantId: number, data: any) {
        try{
            const reservationDate = new Date(`${data.data}T00:00:00`);
            if (Number.isNaN(reservationDate.getTime())) {
                throw new AppError("Fecha de reserva inválida", 400);
            }

            let zona_seleccionada_id: number | null = null;

            if(data.zona === null) {
                // Si no llega zona, tomamos solo la primera zona del restaurante.
                const zona_seleccionada = await prisma.zona.findFirst({
                    where: { id_restaurant: restaurantId },
                    orderBy: { id: "asc" },
                });
                zona_seleccionada_id = zona_seleccionada?.id ?? null;
            }else{
                zona_seleccionada_id = Number(data.zona);
            }

            if (!zona_seleccionada_id) return [];

            /**
             * Devuelve TODAS las mesas físicas de la zona seleccionada (TAULES_RESTAURANT + TAULES),
             * y hace LEFT JOIN con RESERVES para el turno, hora y la fecha indicados.
             *
             * Interpretación de resultado:
             * - num_persones_reserva/estat_reserva = null -> mesa sin reserva activa ese día/turno.
             * - estat_reserva en PENDENT/RESERVADA/OCUPADA -> mesa con reserva activa
             *   (útil para pintar estado por colores en frontend).
             */
            const totes_taules = await prisma.$queryRaw<
                Array<{
                    id: number;
                    num_persones_taula: number;
                    min_persones_reserva: number;
                    fila: number;
                    columna: number;
                    span_fila: number;
                    span_columna: number;
                    id_reserva: number | null;
                    num_persones_reserva: number | null;
                    estat_reserva: string | null;
                    nom_client: string | null;
                    cognoms_client: string | null;
                }>
            >`
                SELECT
                    tr.id,
                    t.num_persones AS num_persones_taula,
                    t.min_persones_reserva,
                    tr.fila,
                    tr.columna,
                    t.span_fila,
                    t.span_columna,
                    r.id AS id_reserva,
                    r.num_persones AS num_persones_reserva,
                    r.estat AS estat_reserva,
                    c.nom AS nom_client,
                    c.cognoms AS cognoms_client
                FROM "TAULES_RESTAURANT" tr
                JOIN "TAULES" t
                    ON t.id = tr.id_taula
                JOIN "TORNS" torn
                    ON torn.id_restaurant = ${restaurantId}
                    AND torn.id = ${Number(data.id_torn)}
                LEFT JOIN "RESERVES" r
                    ON r.id_taula_restaurant = tr.id
                    AND r.id_torn = torn.id
                    AND r.hora = ${data.hora}
                    AND r.data = ${reservationDate}
                    AND r.estat IN ('PENDENT', 'RESERVADA', 'OCUPADA')
                LEFT JOIN "CLIENTS" c
                    ON c.id = r.id_client
                WHERE tr.id_restaurant = ${restaurantId}
                  AND tr.id_zona = ${zona_seleccionada_id}
            `;

            return totes_taules;
        }catch(error){
            throw new AppError("Error al obtener las mesas", 500);
        }
    }

    static async releaseReservationByStaff(restaurantId: number, reservationId: number) {
        try {
            const reserva = await prisma.reserva.findFirst({
                where: {
                    id: reservationId,
                    id_restaurant: restaurantId,
                },
                select: {
                    id: true,
                    estat: true,
                },
            });

            if (!reserva) {
                throw new AppError("Reserva no encontrada para este restaurante", 404);
            }

            if (!["PENDENT", "RESERVADA", "OCUPADA"].includes(reserva.estat)) {
                throw new AppError("La reserva ya no está activa", 400);
            }

            return await prisma.reserva.update({
                where: { id: reservationId },
                // En liberación manual desde sala, el estado de negocio es LLIURE.
                data: { estat: "LLIURE" },
            });
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("Error al liberar la reserva", 500);
        }
    }

    static async updateReservationByStaff(
        restaurantId: number,
        reservationId: number,
        data: UpdateReservationByStaffDTO
    ) {
        try {
            const reservationDate = new Date(`${data.data}T00:00:00`);
            if (Number.isNaN(reservationDate.getTime())) {
                throw new AppError("Fecha de reserva inválida", 400);
            }

            // Agrupamos validaciones principales en una solo array de objetos.
            const [reserva, taulaRestaurant, torn] = await prisma.$transaction([
                prisma.reserva.findFirst({
                    where: {
                        id: reservationId,
                        id_restaurant: restaurantId,
                    },
                    select: {
                        id: true,
                        id_client: true,
                    },
                }),
                prisma.taulaRestaurant.findFirst({
                    where: {
                        id: data.id_taula_restaurant,
                        id_restaurant: restaurantId,
                    },
                    select: {
                        id: true,
                        tipusTaula: {
                            select: {
                                min_persones_reserva: true,
                                num_persones: true,
                            },
                        },
                    },
                }),
                prisma.torn.findFirst({
                    where: {
                        id: data.id_torn,
                        id_restaurant: restaurantId,
                    },
                    select: { id: true },
                }),
            ]);

            if (!reserva) {
                throw new AppError("Reserva no encontrada para este restaurante", 404);
            }
            if (!taulaRestaurant) {
                throw new AppError("Mesa no válida para este restaurante", 400);
            }
            if (!torn) {
                throw new AppError("Turno no válido", 400);
            }

            // Ahora se valida que el numero de personas, este entre el minimo y el maximo permitido de la mesa seleccionada
            if (
                data.num_persones < taulaRestaurant.tipusTaula.min_persones_reserva ||
                data.num_persones > taulaRestaurant.tipusTaula.num_persones
            ) {
                throw new AppError(
                    `El número de personas debe estar entre ${taulaRestaurant.tipusTaula.min_persones_reserva} y ${taulaRestaurant.tipusTaula.num_persones}`,
                    400
                );
            }

            // Solo comprobamos conflictos si la reserva se quedará en estado activo.
            if (["PENDENT", "RESERVADA", "OCUPADA"].includes(data.estat)) {
                const conflictingReservation = await prisma.reserva.findFirst({
                    where: {
                        id: { not: reservationId },
                        id_taula_restaurant: data.id_taula_restaurant,
                        id_torn: data.id_torn,
                        hora: data.hora,
                        data: reservationDate,
                        estat: { in: ["PENDENT", "RESERVADA", "OCUPADA"] },
                    },
                    select: { id: true },
                });

                if (conflictingReservation) {
                    throw new AppError("La mesa ya está ocupada para esa fecha y hora", 409);
                }
            }

            const fullName = data.nom_contacte?.trim();
            const [nomContacte = "", ...cognomsParts] = fullName ? fullName.split(/\s+/) : [];
            const cognomsContacte = cognomsParts.join(" ");

            return await prisma.$transaction(async (tx) => {
                if (fullName) {
                    await tx.client.update({
                        where: { id: reserva.id_client },
                        data: {
                            nom: nomContacte || fullName,
                            cognoms: cognomsContacte || "-",
                        },
                    });
                }

                return tx.reserva.update({
                    where: { id: reservationId },
                    data: {
                        id_taula_restaurant: data.id_taula_restaurant,
                        id_torn: data.id_torn,
                        data: reservationDate,
                        hora: data.hora,
                        num_persones: data.num_persones,
                        estat: data.estat,
                        observacions: data.observacions?.trim() || null,
                    },
                });
            });
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("Error al actualizar la reserva", 500);
        }
    }

    static async getReservationZones(restaurantId: number) {
        try {
            return await prisma.zona.findMany({
                where: { id_restaurant: restaurantId },
                select: { id: true, nom: true },
                orderBy: { id: "asc" },
            });
        } catch (error) {
            throw new AppError("Error al obtener las zonas del restaurante", 500);
        }
    }

    static async createReservation(restaurantId: number, data: CreateReservationDTO) {
        try {
            const restaurant = await prisma.restaurant.findUnique({
                where: { id: restaurantId },
                select: { id: true, nom: true, estat: true },
            });

            if (!restaurant || restaurant.estat !== "ACTIU") {
                throw new AppError("Restaurante no disponible para reservas", 404);
            }

            const torn = await prisma.torn.findFirst({
                where: { id_restaurant: restaurantId, id: data.id_torn },
                select: { id: true, nom: true },
            });
            if (!torn) throw new AppError("Turno no válido", 400);

            const taulaRestaurant = await prisma.taulaRestaurant.findFirst({
                where: { id: data.id_taula_restaurant, id_restaurant: restaurantId },
                select: { id: true },
            });
            if (!taulaRestaurant) throw new AppError("Mesa no válida para este restaurante", 400);

            const reservationDate = new Date(`${data.data}T00:00:00`);
            if (Number.isNaN(reservationDate.getTime())) {
                throw new AppError("Fecha de reserva inválida", 400);
            }

            const now = new Date();
            const expirationDate = new Date(now.getTime() + 2 * 60 * 1000);
            const conflictingReservation = await prisma.reserva.findFirst({
                where: {
                    id_taula_restaurant: data.id_taula_restaurant,
                    id_torn: torn.id,
                    hora: data.hora,
                    data: reservationDate,
                    OR: [
                        { estat: "RESERVADA" },
                        { estat: "OCUPADA" },
                        { estat: "PENDENT" },
                    ],
                },
                select: { id: true },
            });
            if (conflictingReservation) {
                throw new AppError("La mesa ya no está disponible para esa fecha y hora", 409);
            }

            const normalizedEmail = data.email.trim().toLowerCase();
            const [nom, ...cognomsParts] = data.nom.trim().split(/\s+/);
            const inferredCognoms = data.cognoms?.trim() || cognomsParts.join(" ");

            const token = generateReservationToken();

            const result = await prisma.$transaction(async (tx) => {
                const client = await tx.client.upsert({
                    where: { email: normalizedEmail },
                    update: {
                        nom: nom || data.nom.trim(),
                        cognoms: inferredCognoms || "-",
                        telefon: data.telefon.trim(),
                    },
                    create: {
                        nom: nom || data.nom.trim(),
                        cognoms: inferredCognoms || "-",
                        email: normalizedEmail,
                        telefon: data.telefon.trim(),
                    },
                });

                const reserva = await tx.reserva.create({
                    data: {
                        id_taula_restaurant: data.id_taula_restaurant,
                        id_restaurant: restaurantId,
                        id_client: client.id,
                        id_torn: torn.id,
                        data: reservationDate,
                        hora: data.hora,
                        observacions: data.observacions?.trim() || null,
                        num_persones: data.num_persones,
                        token,
                        // Ventana de confirmación de 2 minutos.
                        data_expiracio: expirationDate,
                        estat: "PENDENT",
                    },
                });

                return { reserva, client };
            });

            const confirmUrl = `${envConfig.api.baseUrl}/restaurants/reservations/confirm/${token}`;

            this.enqueueEmailJob({
                type: "PENDING_RESERVATION",
                payload: {
                    to: result.client.email,
                    clientName: `${result.client.nom} ${result.client.cognoms}`.trim(),
                    restaurantName: restaurant.nom,
                    date: data.data,
                    time: data.hora,
                    people: data.num_persones,
                    confirmUrl,
                },
            });

            // Llamar al worker que se encarga de expirar la reserva si no se confirma en 2 minutos.
            this.enqueueReservationExpiryJob({
                reservaId: result.reserva.id,
            });

            return {
                message: "Reserva creada en estado pendiente. Revisa tu email para confirmarla.",
                reservaId: result.reserva.id,
                token,
                data_expiracio: result.reserva.data_expiracio,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("Error al crear la reserva", 500);
        }
    }

    static async createReservationByStaff(restaurantId: number, data: CreateReservationByStaffDTO) {
        try {
            // 1) Validamos que el restaurante exista y esté activo.
            const restaurant = await prisma.restaurant.findUnique({
                where: { id: restaurantId },
                select: { id: true, estat: true },
            });

            if (!restaurant || restaurant.estat !== "ACTIU") {
                throw new AppError("Restaurante no disponible para reservas", 404);
            }

            // 2) Validamos que el turno pertenezca a ese restaurante.
            const torn = await prisma.torn.findFirst({
                where: { id_restaurant: restaurantId, id: data.id_torn },
                select: { id: true },
            });
            if (!torn) throw new AppError("Turno no válido", 400);

            // 3) Validamos que la mesa exista en ese restaurante y obtenemos aforo mínimo/máximo.
            const taulaRestaurant = await prisma.taulaRestaurant.findFirst({
                where: { id: data.id_taula_restaurant, id_restaurant: restaurantId },
                select: {
                    id: true,
                    tipusTaula: {
                        select: {
                            min_persones_reserva: true,
                            num_persones: true,
                        },
                    },
                },
            });
            if (!taulaRestaurant) throw new AppError("Mesa no válida para este restaurante", 400);

            // 4) Regla de negocio: número de personas dentro del rango permitido por la mesa.
            if (
                data.num_persones < taulaRestaurant.tipusTaula.min_persones_reserva ||
                data.num_persones > taulaRestaurant.tipusTaula.num_persones
            ) {
                throw new AppError(
                    `El número de personas debe estar entre ${taulaRestaurant.tipusTaula.min_persones_reserva} y ${taulaRestaurant.tipusTaula.num_persones}`,
                    400
                );
            }

            // 5) Parseamos la fecha recibida (yyyy-mm-dd) para comparar/guardar en BD.
            const reservationDate = new Date(`${data.data}T00:00:00`);
            if (Number.isNaN(reservationDate.getTime())) {
                throw new AppError("Fecha de reserva inválida", 400);
            }

            // 6) Evitamos doble reserva en la misma mesa+turno+hora+fecha.
            const conflictingReservation = await prisma.reserva.findFirst({
                where: {
                    id_taula_restaurant: data.id_taula_restaurant,
                    id_torn: torn.id,
                    hora: data.hora,
                    data: reservationDate,
                    OR: [{ estat: "RESERVADA" }, { estat: "OCUPADA" }, { estat: "PENDENT" }],
                },
                select: { id: true },
            });
            if (conflictingReservation) {
                throw new AppError("La mesa ya no está disponible para esa fecha y hora", 409);
            }

            // 7) Normalizamos datos del contacto.
            //    - email es opcional en flujo staff
            //    - inferimos apellidos desde "nom" si no llegan separados
            const normalizedEmail = data.email?.trim().toLowerCase() || null;
            const [nom, ...cognomsParts] = data.nom.trim().split(/\s+/);
            const inferredCognoms = data.cognoms?.trim() || cognomsParts.join(" ");
            const token = generateReservationToken();

            const result = await prisma.$transaction(async (tx) => {
                // Si no hay email, generamos uno técnico para satisfacer la restricción UNIQUE/NOT NULL
                // del modelo Client sin bloquear la creación de la reserva en sala.
                const generatedEmail =
                    normalizedEmail ??
                    `staff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@no-email.local`;

                // Con email real: reutilizamos o actualizamos cliente por email.
                // Sin email: creamos un cliente nuevo con email técnico.
                const client = normalizedEmail
                    ? await tx.client.upsert({
                          where: { email: normalizedEmail },
                          update: {
                              nom: nom || data.nom.trim(),
                              cognoms: inferredCognoms || "-",
                              telefon: data.telefon.trim(),
                          },
                          create: {
                              nom: nom || data.nom.trim(),
                              cognoms: inferredCognoms || "-",
                              email: normalizedEmail,
                              telefon: data.telefon.trim(),
                          },
                      })
                    : await tx.client.create({
                          data: {
                              nom: nom || data.nom.trim(),
                              cognoms: inferredCognoms || "-",
                              email: generatedEmail,
                              telefon: data.telefon.trim(),
                          },
                      });

                // 8) Creamos reserva directa de staff:
                //    - sin workers
                //    - sin correos de confirmación/cancelación
                //    - estado final lo decide el staff (RESERVADA u OCUPADA)
                const reserva = await tx.reserva.create({
                    data: {
                        id_taula_restaurant: data.id_taula_restaurant,
                        id_restaurant: restaurantId,
                        id_client: client.id,
                        id_torn: torn.id,
                        data: reservationDate,
                        hora: data.hora,
                        observacions: data.observacions?.trim() || null,
                        num_persones: data.num_persones,
                        token,
                        data_expiracio: new Date(),
                        estat: data.estat,
                    },
                });

                return { reserva };
            });

            // 9) Respuesta simple para UI de staff.
            return {
                message: "Reserva creada correctamente desde staff",
                reservaId: result.reserva.id,
                estat: result.reserva.estat,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("Error al crear la reserva desde staff", 500);
        }
    }

    static async confirmReservationByToken(token: string) {
        try {
            const reserva = await prisma.reserva.findUnique({
                where: { token },
                include: {
                    client: true,
                    restaurant: true,
                },
            });
            if (!reserva) throw new AppError("Reserva no encontrada", 404);

            if (reserva.estat === "CANCELADA") {
                throw new AppError("La reserva ya está cancelada", 400);
            }

            if (reserva.estat === "EXPIRADA") {
                throw new AppError("La reserva ya está expirada", 410);
            }

            if (reserva.estat === "RESERVADA") {
                return { message: "La reserva ya estaba confirmada" };
            }

            if (reserva.data_expiracio <= new Date()) {
                await prisma.reserva.update({
                    where: { id: reserva.id },
                    data: { estat: "EXPIRADA" },
                });
                throw new AppError("La reserva ha expirado", 410);
            }

            const updatedReserva = await prisma.reserva.update({
                where: { id: reserva.id },
                data: { estat: "RESERVADA" },
            });

            const cancelUrl = `${envConfig.api.baseUrl}/restaurants/reservations/cancel/${token}`;
            this.enqueueEmailJob({
                type: "CONFIRMED_RESERVATION",
                payload: {
                    to: reserva.client.email,
                    clientName: `${reserva.client.nom} ${reserva.client.cognoms}`.trim(),
                    restaurantName: reserva.restaurant.nom,
                    date: reserva.data.toISOString().slice(0, 10),
                    time: reserva.hora,
                    people: reserva.num_persones,
                    cancelUrl,
                },
            });

            return { message: "Reserva confirmada correctamente", reserva: updatedReserva };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("Error al confirmar la reserva", 500);
        }
    }

    static async cancelReservationByToken(token: string) {
        try {
            const reserva = await prisma.reserva.findUnique({
                where: { token },
                include: {
                    client: true,
                    restaurant: true,
                },
            });
            if (!reserva) throw new AppError("Reserva no encontrada", 404);

            if (reserva.estat === "CANCELADA") {
                return { message: "La reserva ya estaba cancelada" };
            }

            if (reserva.estat === "EXPIRADA") {
                throw new AppError("La reserva ya está expirada", 410);
            }

            const updatedReserva = await prisma.reserva.update({
                where: { id: reserva.id },
                data: { estat: "CANCELADA" },
            });

            this.enqueueEmailJob({
                type: "CANCELLED_RESERVATION",
                payload: {
                    to: reserva.client.email,
                    clientName: `${reserva.client.nom} ${reserva.client.cognoms}`.trim(),
                    restaurantName: reserva.restaurant.nom,
                    date: reserva.data.toISOString().slice(0, 10),
                    time: reserva.hora,
                },
            });

            return { message: "Reserva cancelada correctamente", reserva: updatedReserva };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("Error al cancelar la reserva", 500);
        }
    }

}