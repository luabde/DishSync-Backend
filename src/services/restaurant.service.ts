import { RestaurantDTO, UpdateRestaurantDTO } from "../models/restaurant.model";
import { prisma } from "../loaders/prisma.loader";
import { AppError } from "../utils/AppError";
import path from "path";
import { mkdir, unlink, writeFile } from "fs/promises";

export class RestaurantService {
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

        if (imageFile) {
            // URL accesible desde frontend gracias a express.static
            imageUrl = await this.saveRestaurantImage(imageFile);
        }

        // Inserta todo de forma secuencial (sin transacción)
        const restaurant = await prisma.restaurant.create({
            data: {
                ...restaurantData,
                url: imageUrl,
            },
        });

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

}