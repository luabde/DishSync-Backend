import { PrismaClient } from "../../generated/prisma/client"; 
import { PrismaPg } from "@prisma/adapter-pg"; 
import dotenv from "dotenv";

dotenv.config();

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida en las variables de entorno");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

// Cunado es desarrollo al usar el watch como se recarga constantemente, 
// usar este if permite que no se creen múltiples instancias de PrismaClient, lo que puede causar problemas de rendimiento y conexiones abiertas. 
// En producción, esto no es un problema porque el código no se recarga constantemente.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}