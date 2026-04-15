import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import {checkRole} from "../middlewares/role.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { PlatController } from "../controllers/plats.controller";
import { PlatSchema } from "../../models/plats.model";

export const platsRouter = Router();

platsRouter.post("/", authMiddleware, checkRole("ADMIN"), validate(PlatSchema), PlatController.createPlatController);
platsRouter.get("/", authMiddleware, checkRole("ADMIN"), PlatController.getPlatsController);
platsRouter.put("/:id", authMiddleware, checkRole("ADMIN"), validate(PlatSchema), PlatController.updatePlatController);
platsRouter.delete("/:id", authMiddleware, checkRole("ADMIN"), PlatController.deletePlatController);
