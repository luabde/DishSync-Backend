/**
 * Bootstrap del worker de email para entorno de desarrollo.
 *
 * ¿Por qué existe?
 * - Worker Threads de Node arranca un archivo JS/CJS "normal".
 * - En dev nuestro worker real está en TypeScript (`email.worker.ts`).
 * - Este bootstrap registra primero `tsx` para que Node pueda ejecutar `.ts`
 *   dentro del worker sin necesidad de compilar previamente a `dist`.
 *
 * ¿Cuándo se usa?
 * - Se usa solo en desarrollo, desde `RestaurantService.enqueueEmailJob`,
 *   cuando todavía no existe `dist/workers/email.worker.js`.
 * - En producción/build NO se usa: allí se ejecuta directamente el worker JS compilado.
 */
require("tsx/cjs");
require("./email.worker.ts");
