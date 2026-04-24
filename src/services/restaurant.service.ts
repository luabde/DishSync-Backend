import { RestaurantDTO, UpdateRestaurantDTO } from "../models/restaurant.model";
import { prisma } from "../loaders/prisma.loader";
import { AppError } from "../utils/AppError";
import path from "path";
import { mkdir, unlink, writeFile } from "fs/promises";
import { geocodeAddress } from "../utils/geocoding.util";

export class RestaurantService {

    // ---- SERVICIOS PARA RUTAS CRUD RESTAURANT ----
    private static async saveRestaurantImage(imageFile: { originalname: string; buffer: Buffer }) {
        // Centraliza el guardado físico para reusar en create y update.
        const extension = path.extname(imageFile.originalname) || ".jpg";
        const fileName = `restaurant-${Date.now()}${extension}`;
        const publicDir = path.join(process.cwd(), "public", "restaurants");
        const filePath = path.join(publicDir, fileName);

        await mkdir(publicDir, { recursive: true });
        await writeFile(filePath, imageFile.buffer);

        return `/public/restaurants/${fileName}`;
    }

    private static async removeLocalRestaurantImage(imageUrl?: string | null) {
        // Solo eliminamos imágenes locales gestionadas por la app.
        // Esto evita borrar URLs externas o rutas no controladas.
        if (!imageUrl || !imageUrl.startsWith("/public/restaurants/")) return;

        const relativePath = imageUrl.replace(/^\/+/, "");
        const imagePath = path.join(process.cwd(), relativePath);

        try {
            await unlink(imagePath);
        } catch {
            // Si no existe o no se puede borrar, no bloqueamos el update.
            // Prioridad: permitir que la actualización de datos continue.
        }
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
        // Endpoint consumido por frontend (Leaflet): solo restaurantes activos geolocalizados.
        return prisma.restaurant.findMany({
            where: {
                lat: { not: null },
                lng: { not: null },
                estat: "ACTIU",
            },
            select: {
                id: true,
                nom: true,
                direccio: true,
                lat: true,
                lng: true,
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
    static async getReservationsForm(restaurantId: number) {
        try{
            // Objeto por nombre de turno -> lista de horas.
            const horaris_torns: Record<string, string[]> = {};

            const turnos = await prisma.torn.findMany({
                where: { id_restaurant: restaurantId },
            });

            for (const turno of turnos) {
                if(!horaris_torns[turno.nom]) {
                    horaris_torns[turno.nom] = [];
                }

                const horas = await prisma.horarisTorn.findMany({
                    where: { id_torn: turno.id },
                });

                horaris_torns[turno.nom] = horas.map((hora) => hora.hora);
            }

            return horaris_torns;
        }catch(error){
            throw new AppError("Error al obtener los horarios de los turnos", 500);
        }
    }

    static async getTaules(restaurantId: number, data: any) {
        try{
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
                    num_persones_reserva: number | null;
                    estat_reserva: string | null;
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
                    r.num_persones AS num_persones_reserva,
                    r.estat AS estat_reserva
                FROM "TAULES_RESTAURANT" tr
                JOIN "TAULES" t
                    ON t.id = tr.id_taula
                JOIN "TORNS" torn
                    ON torn.id_restaurant = ${restaurantId}
                    AND torn.nom = ${data.torn}
                LEFT JOIN "RESERVES" r
                    ON r.id_taula_restaurant = tr.id
                    AND r.id_torn = torn.id
                    AND r.hora = ${data.hora}
                    AND CAST(r.data AS DATE) = CAST(${data.data} AS DATE)
                    AND r.estat IN ('PENDENT', 'RESERVADA', 'OCUPADA')
                WHERE tr.id_restaurant = ${restaurantId}
                  AND tr.id_zona = ${zona_seleccionada_id}
            `;

            return totes_taules;
        }catch(error){
            throw new AppError("Error al obtener las mesas", 500);
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

}