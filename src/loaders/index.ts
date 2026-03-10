import { Application } from "express";
import { expressLoader } from "./express";
import { prisma } from "./prisma.loader";

export const initLoaders = async (app: Application) => {
  await prisma.$connect();
  console.log("✅ Database connected");

  // Load Express configuration
  expressLoader(app);
};