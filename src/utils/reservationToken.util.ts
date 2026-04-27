import crypto from "crypto";

/**
 * Genera un token seguro para enlaces de confirmación/cancelación de reservas.
 */
export const generateReservationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

