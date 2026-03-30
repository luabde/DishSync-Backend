import express, { Request, Response, Application, NextFunction } from "express";
import cors from "cors";
import { envConfig } from "../config/env.config";
import { router } from "../api/routes/index";
import { errorMiddleware } from "../api/middlewares/errorMiddleware";
import { AppError } from "../utils/AppError";
import cookieparser from "cookie-parser";
import path from "path";

export const expressLoader = (app: Application) => {
  // Middlewares
  app.use(cors({
    origin: envConfig.cors.origin,
    credentials: true
  }));
  // Permitimos payloads JSON más grandes porque en el alta de restaurante
  // se puede enviar la imagen serializada en base64 dentro del body.
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));
  app.use(cookieparser());
  
  // Sirve archivos estáticos locales para desarrollo (ej: imágenes de restaurantes).
  app.use("/public", express.static(path.join(process.cwd(), "public")));

  app.use("/api", router);

  // Manejo de rutas no encontradas
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`No se puede encontrar ${req.originalUrl} en este servidor`, 404));
  });

  // Global Error Middleware
  app.use(errorMiddleware);

  console.log("✅ Express loaded");
};