import { RestaurantDTO } from "../models/restaurant.model";
import { prisma } from "../loaders/prisma.loader";
import { AppError } from "../utils/AppError";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

export class RestaurantService {
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
            const extension = path.extname(imageFile.originalname) || ".jpg";
            const fileName = `restaurant-${Date.now()}${extension}`;
            const publicDir = path.join(process.cwd(), "public", "restaurants");
            const filePath = path.join(publicDir, fileName);

            // Crea carpeta si no existe y guarda el binario
            await mkdir(publicDir, { recursive: true });
            await writeFile(filePath, imageFile.buffer);

            // URL accesible desde frontend gracias a express.static
            imageUrl = `/public/restaurants/${fileName}`;
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

    static async deactivateRestaurant(id: number) {
        // Alternativa al borrado cuando negocio bloquea por reservas futuras.
        return await prisma.restaurant.update({
            where: { id },
            data: { estat: "INACTIU" },
        });
    }

}