import express, { Request, Response, Application } from "express";
import cors from "cors";
import { envConfig } from "../config/env.config";
import { router } from "../routes/index";

export const expressLoader = (app: Application) => {
  // Middlewares
  app.use(cors());
  app.use(express.json());

  app.use("/api", router);

  console.log("✅ Express loaded");
};