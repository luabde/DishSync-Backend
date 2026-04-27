/**
 * Bootstrap del worker de expiración de reservas para entorno de desarrollo.
 *
 * Registra `tsx` para que Worker Threads pueda ejecutar el archivo TS
 * (`reservation-expiry.worker.ts`) sin compilar previamente a `dist`.
 * En producción no se usa: se ejecuta el worker JS compilado.
 */
require("tsx/cjs");
require("./reservation-expiry.worker.ts");
