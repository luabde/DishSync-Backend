import { parentPort, workerData } from "worker_threads";
import { prisma } from "../loaders/prisma.loader";

type ReservationExpiryJob = {
    reservaId: number;
};

async function run() {
    const { reservaId } = workerData as ReservationExpiryJob;

    try {
        // Esperar 2 minutos antes de expirar la reserva en caso de que no se haya confirmado.
        await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 2 * 60 * 1000);
        });

        const reserva = await prisma.reserva.findUnique({
            where: { id: reservaId },
            select: { id: true, estat: true },
        });

        // Solo expira la reserva si sigue pendiente cuando vence el tiempo.
        if (reserva?.estat === "PENDENT") {
            await prisma.reserva.update({
                where: { id: reservaId },
                data: { estat: "EXPIRADA" },
            });
        }

        parentPort?.postMessage({ success: true });
    } catch (error) {
        parentPort?.postMessage({ success: false, error: String(error) });
    } finally {
        await prisma.$disconnect();
    }
}

run();
