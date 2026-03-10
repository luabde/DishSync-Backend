/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EstatGeneral" AS ENUM ('ACTIU', 'INACTIU');

-- CreateEnum
CREATE TYPE "EstatReserva" AS ENUM ('PENDENT', 'RESERVADA', 'OCUPADA', 'LLIURE', 'CANCELADA', 'NO_PRESENTAT');

-- CreateEnum
CREATE TYPE "RolUsuari" AS ENUM ('ADMIN', 'CAMBRER', 'RESPONSABLE');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "RESTAURANTS" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "direccio" TEXT NOT NULL,
    "horaris" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "url" TEXT,
    "descripcio" TEXT,
    "estat" "EstatGeneral" NOT NULL DEFAULT 'ACTIU',

    CONSTRAINT "RESTAURANTS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "USUARIS" (
    "id" SERIAL NOT NULL,
    "id_restaurant" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "cognoms" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "RolUsuari" NOT NULL DEFAULT 'CAMBRER',
    "estat" "EstatGeneral" NOT NULL DEFAULT 'ACTIU',

    CONSTRAINT "USUARIS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TAULES" (
    "id" SERIAL NOT NULL,
    "num_persones" INTEGER NOT NULL,
    "span_fila" INTEGER NOT NULL,
    "span_columna" INTEGER NOT NULL,
    "min_persones_reserva" INTEGER NOT NULL,

    CONSTRAINT "TAULES_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TAULES_RESTAURANT" (
    "id" SERIAL NOT NULL,
    "id_zona" INTEGER NOT NULL,
    "id_restaurant" INTEGER NOT NULL,
    "id_taula" INTEGER NOT NULL,
    "fila" INTEGER NOT NULL,
    "columna" INTEGER NOT NULL,
    "num_taula" INTEGER NOT NULL,

    CONSTRAINT "TAULES_RESTAURANT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZONES" (
    "id" SERIAL NOT NULL,
    "id_restaurant" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "capacitat_max" INTEGER,

    CONSTRAINT "ZONES_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RESERVES" (
    "id" SERIAL NOT NULL,
    "id_taula_restaurant" INTEGER NOT NULL,
    "id_restaurant" INTEGER NOT NULL,
    "id_client" INTEGER NOT NULL,
    "id_torn" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "hora" TEXT NOT NULL,
    "num_persones" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "data_expiracio" TIMESTAMP(3) NOT NULL,
    "estat" "EstatReserva" NOT NULL DEFAULT 'PENDENT',
    "observacions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RESERVES_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CLIENTS" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "cognoms" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,

    CONSTRAINT "CLIENTS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TORNS" (
    "id" SERIAL NOT NULL,
    "id_restaurant" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "hora_inici" TEXT NOT NULL,
    "hora_fi" TEXT NOT NULL,

    CONSTRAINT "TORNS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HORARIS_TORNS" (
    "id" SERIAL NOT NULL,
    "id_torn" INTEGER NOT NULL,
    "hora" TEXT NOT NULL,
    "dia_setmana" INTEGER,

    CONSTRAINT "HORARIS_TORNS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PLAT_RESTAURANT" (
    "id" SERIAL NOT NULL,
    "id_restaurant" INTEGER NOT NULL,
    "id_plat" INTEGER NOT NULL,
    "disponibilitat" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PLAT_RESTAURANT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PLATS" (
    "id" SERIAL NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "descripcio" TEXT,
    "preu" DECIMAL(10,2) NOT NULL,
    "url" TEXT,

    CONSTRAINT "PLATS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CATEGORIES" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "descripcio" TEXT,

    CONSTRAINT "CATEGORIES_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CONTACTE_CLIENTS" (
    "id" SERIAL NOT NULL,
    "id_client" INTEGER NOT NULL,
    "missatge" TEXT NOT NULL,
    "estat" TEXT NOT NULL DEFAULT 'Pendent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CONTACTE_CLIENTS_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "USUARIS_email_key" ON "USUARIS"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RESERVES_token_key" ON "RESERVES"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CLIENTS_email_key" ON "CLIENTS"("email");

-- AddForeignKey
ALTER TABLE "USUARIS" ADD CONSTRAINT "USUARIS_id_restaurant_fkey" FOREIGN KEY ("id_restaurant") REFERENCES "RESTAURANTS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TAULES_RESTAURANT" ADD CONSTRAINT "TAULES_RESTAURANT_id_zona_fkey" FOREIGN KEY ("id_zona") REFERENCES "ZONES"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TAULES_RESTAURANT" ADD CONSTRAINT "TAULES_RESTAURANT_id_restaurant_fkey" FOREIGN KEY ("id_restaurant") REFERENCES "RESTAURANTS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TAULES_RESTAURANT" ADD CONSTRAINT "TAULES_RESTAURANT_id_taula_fkey" FOREIGN KEY ("id_taula") REFERENCES "TAULES"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZONES" ADD CONSTRAINT "ZONES_id_restaurant_fkey" FOREIGN KEY ("id_restaurant") REFERENCES "RESTAURANTS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVES" ADD CONSTRAINT "RESERVES_id_taula_restaurant_fkey" FOREIGN KEY ("id_taula_restaurant") REFERENCES "TAULES_RESTAURANT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVES" ADD CONSTRAINT "RESERVES_id_restaurant_fkey" FOREIGN KEY ("id_restaurant") REFERENCES "RESTAURANTS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVES" ADD CONSTRAINT "RESERVES_id_client_fkey" FOREIGN KEY ("id_client") REFERENCES "CLIENTS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVES" ADD CONSTRAINT "RESERVES_id_torn_fkey" FOREIGN KEY ("id_torn") REFERENCES "TORNS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TORNS" ADD CONSTRAINT "TORNS_id_restaurant_fkey" FOREIGN KEY ("id_restaurant") REFERENCES "RESTAURANTS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HORARIS_TORNS" ADD CONSTRAINT "HORARIS_TORNS_id_torn_fkey" FOREIGN KEY ("id_torn") REFERENCES "TORNS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PLAT_RESTAURANT" ADD CONSTRAINT "PLAT_RESTAURANT_id_restaurant_fkey" FOREIGN KEY ("id_restaurant") REFERENCES "RESTAURANTS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PLAT_RESTAURANT" ADD CONSTRAINT "PLAT_RESTAURANT_id_plat_fkey" FOREIGN KEY ("id_plat") REFERENCES "PLATS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PLATS" ADD CONSTRAINT "PLATS_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "CATEGORIES"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CONTACTE_CLIENTS" ADD CONSTRAINT "CONTACTE_CLIENTS_id_client_fkey" FOREIGN KEY ("id_client") REFERENCES "CLIENTS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
