import express, { Request, Response, Application, NextFunction } from "express";
import cors from "cors";
import { envConfig } from "../config/env.config";
import { router } from "../api/routes/index";
import { errorMiddleware } from "../api/middlewares/errorMiddleware";
import { AppError } from "../utils/AppError";

export const expressLoader = (app: Application) => {
  // Middlewares
  app.use(cors());
  app.use(express.json());

  app.use("/api", router);

  // Manejo de rutas no encontradas
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`No se puede encontrar ${req.originalUrl} en este servidor`, 404));
  });

  // Global Error Middleware
  app.use(errorMiddleware);

  console.log("✅ Express loaded");
};