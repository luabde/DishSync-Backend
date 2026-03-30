import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import {checkRole} from "../middlewares/role.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { RestaurantSchema } from "../../models/restaurant.model";
import { RestaurantController } from "../controllers/restaurant.controller";
import { uploadRestaurantImage } from "../middlewares/upload.middleware";

export const restaurantRouter = Router();

// Ruta per crear la informació del restaurant, només accessible per usuaris amb rol "admin"
restaurantRouter.post(
  "/",
  authMiddleware,
  checkRole("ADMIN"),
  uploadRestaurantImage,
  validate(RestaurantSchema),
  RestaurantController.createRestaurant
);

// Ruta per validar si el restaurant existeix (evita errors de duplicació)
restaurantRouter.get("/:nom/:direccio", authMiddleware, checkRole("ADMIN"), RestaurantController.validateRestaurantExists);

// Ruta per obtenir la llista de restaurants
restaurantRouter.get("/", authMiddleware, checkRole("ADMIN"), RestaurantController.getRestaurants
);