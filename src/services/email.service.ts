import nodemailer from "nodemailer";
import { envConfig } from "../config/env.config";

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

const baseEmailStyles = `
  body { margin:0; padding:0; background:#f9f7f2; font-family:Montserrat, Arial, sans-serif; color:#4a0e0e; }
  .wrapper { max-width:680px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; }
  .header { background:#4a0e0e; color:#f9f7f2; text-align:center; padding:26px 24px; }
  .brand { font-family:'Playfair Display', Georgia, serif; font-size:42px; font-weight:700; margin:0; }
  .content { padding:28px 32px; color:#4a0e0e; }
  .title { font-family:'Playfair Display', Georgia, serif; font-size:30px; font-weight:700; margin:0 0 14px 0; }
  .text { font-size:15px; line-height:1.6; color:#5d4037; margin:0 0 12px 0; }
  .info { background:#fafafa; border:1px solid rgba(74,14,14,0.08); border-radius:8px; padding:14px 16px; margin:18px 0; }
  .info p { margin:4px 0; font-size:14px; color:#4a0e0e; }
  .actions { display:flex; gap:10px; margin-top:20px; flex-wrap:wrap; }
  .btn { display:inline-block; padding:12px 18px; border-radius:6px; text-decoration:none; font-size:13px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
  .btn-primary { background:#4a0e0e; color:#fff; }
  .btn-outline { border:2px solid #4a0e0e; color:#4a0e0e; background:#fff; }
  a, a:link, a:visited, a:hover, a:active { color:inherit; text-decoration:none; }
  .footer { background:#4a0e0e; color:#f9f7f2; text-align:center; padding:18px 20px; font-size:12px; opacity:0.9; }
`;

// En clientes de correo (especialmente Gmail/Outlook), el color de enlaces puede forzarse a azul.
// Por eso aplicamos estilos inline "fuertes" además de las clases CSS.
const buttonInlineStyles = {
  primary:
    "display:inline-block;padding:12px 18px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:#4a0e0e;color:#ffffff !important;-webkit-text-fill-color:#ffffff;border:2px solid #4a0e0e;",
  outline:
    "display:inline-block;padding:12px 18px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:#ffffff;color:#4a0e0e !important;-webkit-text-fill-color:#4a0e0e;border:2px solid #4a0e0e;",
};

const wrapEmail = (content: string) => `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${baseEmailStyles}</style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <p class="brand">El Castell</p>
      </div>
      <div class="content">${content}</div>
      <div class="footer">© El Castell · Confirmación de reservas</div>
    </div>
  </body>
</html>
`;

export class EmailService {
  private static createTransporter() {
    if (!envConfig.mail.host || !envConfig.mail.user || !envConfig.mail.pass) {
      throw new Error("Configuración SMTP incompleta");
    }

    return nodemailer.createTransport({
      host: envConfig.mail.host,
      port: envConfig.mail.port,
      secure: envConfig.mail.secure,
      auth: {
        user: envConfig.mail.user,
        pass: envConfig.mail.pass,
      },
    });
  }

  static async sendEmail({ to, subject, html }: EmailOptions) {
    const transporter = this.createTransporter();

    const info = await transporter.sendMail({
      from: envConfig.mail.from,
      to,
      subject,
      html,
    });

    // Diagnóstico de entrega SMTP (útil en desarrollo cuando "no llega el correo").
    console.log("[EmailService] SMTP result", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  }

  static async sendPendingReservationEmail(payload: {
    to: string;
    clientName: string;
    restaurantName: string;
    date: string;
    time: string;
    people: number;
    confirmUrl: string;
  }) {
    const html = wrapEmail(`
      <h1 class="title">Confirma tu reserva</h1>
      <p class="text">Hola <strong>${payload.clientName}</strong>, hemos recibido tu solicitud de reserva.</p>
      <div class="info">
        <p><strong>Restaurante:</strong> ${payload.restaurantName}</p>
        <p><strong>Fecha:</strong> ${payload.date}</p>
        <p><strong>Hora:</strong> ${payload.time}</p>
        <p><strong>Personas:</strong> ${payload.people}</p>
      </div>
      <p class="text">Para completar la reserva, confirma en menos de 2 minutos.</p>
      <div class="actions">
        <a class="btn btn-primary" style="${buttonInlineStyles.primary}" href="${payload.confirmUrl}">Confirmar reserva</a>
      </div>
    `);

    await this.sendEmail({
      to: payload.to,
      subject: "Confirma tu reserva en El Castell",
      html,
    });
  }

  static async sendConfirmedReservationEmail(payload: {
    to: string;
    clientName: string;
    restaurantName: string;
    date: string;
    time: string;
    people: number;
    cancelUrl: string;
  }) {
    const html = wrapEmail(`
      <h1 class="title">Reserva confirmada</h1>
      <p class="text">Gracias <strong>${payload.clientName}</strong>, tu reserva está confirmada.</p>
      <div class="info">
        <p><strong>Restaurante:</strong> ${payload.restaurantName}</p>
        <p><strong>Fecha:</strong> ${payload.date}</p>
        <p><strong>Hora:</strong> ${payload.time}</p>
        <p><strong>Personas:</strong> ${payload.people}</p>
      </div>
      <div class="actions">
        <a class="btn btn-outline" style="${buttonInlineStyles.outline}" href="${payload.cancelUrl}">Cancelar reserva</a>
      </div>
    `);

    await this.sendEmail({
      to: payload.to,
      subject: "Tu reserva está confirmada",
      html,
    });
  }

  static async sendCancelledReservationEmail(payload: {
    to: string;
    clientName: string;
    restaurantName: string;
    date: string;
    time: string;
  }) {
    const html = wrapEmail(`
      <h1 class="title">Reserva cancelada</h1>
      <p class="text">Hola <strong>${payload.clientName}</strong>, tu reserva ha sido cancelada correctamente.</p>
      <div class="info">
        <p><strong>Restaurante:</strong> ${payload.restaurantName}</p>
        <p><strong>Fecha:</strong> ${payload.date}</p>
        <p><strong>Hora:</strong> ${payload.time}</p>
      </div>
    `);

    await this.sendEmail({
      to: payload.to,
      subject: "Reserva cancelada",
      html,
    });
  }
}

