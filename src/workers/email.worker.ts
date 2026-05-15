import { workerData, parentPort } from "worker_threads";
import { EmailService } from "../services/email.service";
import dotenv from "dotenv";
dotenv.config();

type EmailJob =
    | { type: "PENDING_RESERVATION"; payload: Parameters<typeof EmailService.sendPendingReservationEmail>[0] }
    | { type: "CONFIRMED_RESERVATION"; payload: Parameters<typeof EmailService.sendConfirmedReservationEmail>[0] }
    | { type: "CANCELLED_RESERVATION"; payload: Parameters<typeof EmailService.sendCancelledReservationEmail>[0] };

async function run() {
    console.log("[EmailWorker] Iniciando worker");
    console.log("[EmailWorker] MAIL_HOST:", process.env.MAIL_HOST);
    console.log("[EmailWorker] MAIL_PORT:", process.env.MAIL_PORT);
    console.log("[EmailWorker] MAIL_USER:", process.env.MAIL_USER);
    console.log("[EmailWorker] MAIL_PASS:", process.env.MAIL_PASS ? "****" : "VACÍO");
    const { type, payload } = workerData as EmailJob;

    try {
        switch (type) {
            case "PENDING_RESERVATION":
                await EmailService.sendPendingReservationEmail(payload);
                break;
            case "CONFIRMED_RESERVATION":
                await EmailService.sendConfirmedReservationEmail(payload);
                break;
            case "CANCELLED_RESERVATION":
                await EmailService.sendCancelledReservationEmail(payload);
                break;
            default:
                throw new Error(`Tipo de job desconocido: ${String(type)}`);
        }
        parentPort?.postMessage({ success: true });
    } catch (error) {
        parentPort?.postMessage({ success: false, error: String(error) });
    }
}

run();