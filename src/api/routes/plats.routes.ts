import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import {checkRole} from "../middlewares/role.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { PlatController } from "../controllers/plats.controller";
import { CategoriaSchema, PlatSchema, UpdatePlatSchema } from "../../models/plats.model";
import { uploadDishImage } from "../middlewares/upload.middleware";

export const platsRouter = Router();

platsRouter.post("/", authMiddleware, checkRole("ADMIN"), uploadDishImage, validate(PlatSchema), PlatController.createPlatController);
platsRouter.get("/", PlatController.getPlatsController);
platsRouter.get("/restaurants-menu", PlatController.getRestaurantsMenuAvailabilityController);
platsRouter.get("/categories", PlatController.getCategoriesController);
platsRouter.post("/categories", authMiddleware, checkRole("ADMIN"), validate(CategoriaSchema), PlatController.createCategoryController);
platsRouter.put("/:id", authMiddleware, checkRole("ADMIN"), uploadDishImage, validate(UpdatePlatSchema), PlatController.updatePlatController);
platsRouter.delete("/:id", authMiddleware, checkRole("ADMIN"), PlatController.deletePlatController);
