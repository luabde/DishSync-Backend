/*
  Warnings:

  - The values [NO_PRESENTAT] on the enum `EstatReserva` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstatReserva_new" AS ENUM ('PENDENT', 'RESERVADA', 'OCUPADA', 'LLIURE', 'CANCELADA', 'EXPIRADA');
ALTER TABLE "public"."RESERVES" ALTER COLUMN "estat" DROP DEFAULT;
ALTER TABLE "RESERVES" ALTER COLUMN "estat" TYPE "EstatReserva_new" USING ("estat"::text::"EstatReserva_new");
ALTER TYPE "EstatReserva" RENAME TO "EstatReserva_old";
ALTER TYPE "EstatReserva_new" RENAME TO "EstatReserva";
DROP TYPE "public"."EstatReserva_old";
ALTER TABLE "RESERVES" ALTER COLUMN "estat" SET DEFAULT 'PENDENT';
COMMIT;
