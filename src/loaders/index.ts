import { prisma } from "./prisma.loader";

export const initLoaders = async () => {
  await prisma.$connect();
  console.log("✅ Database connected");
};