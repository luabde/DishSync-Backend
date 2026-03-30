import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";
import { TaulesController } from "../controllers/taules.controller";

export const taulesRouter = Router();

// Catálogo de tipos de mesa (mobiliari) para el flujo de creación
taulesRouter.get("/", authMiddleware, checkRole("ADMIN"), TaulesController.getTableTypes);
