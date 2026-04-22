import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import {checkRole} from "../middlewares/role.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { RestaurantSchema, UpdateRestaurantSchema } from "../../models/restaurant.model";
import { RestaurantController } from "../controllers/restaurant.controller";
import { uploadRestaurantImage } from "../middlewares/upload.middleware";

export const restaurantRouter = Router();

// En multipart/form-data, wizardData llega como string.
// Lo parseamos antes de validate() para que Zod lo reciba como objeto.
const parseWizardData = (req: any, _res: any, next: any) => {
  if (typeof req.body?.wizardData === "string") {
    try {
      req.body.wizardData = JSON.parse(req.body.wizardData);
    } catch {
      req.body.wizardData = undefined;
    }
  }
  next();
};

// Ruta per crear la informació del restaurant, només accessible per usuaris amb rol "admin"
restaurantRouter.post(
  "/",
  authMiddleware,
  checkRole("ADMIN"),
  uploadRestaurantImage,
  parseWizardData,
  validate(RestaurantSchema),
  RestaurantController.createRestaurant
);

// Rutas de validación por query params para soportar textos libres (ej: "C/ Major, 12").
restaurantRouter.get("/validate-name", authMiddleware, checkRole("ADMIN"), RestaurantController.validateRestaurantExists);
restaurantRouter.get("/validate-address", authMiddleware, checkRole("ADMIN"), RestaurantController.validateRestaurantDirectionExists);

// Ruta pública para el mapa de "Encuéntranos" en frontend.
// No requiere auth porque se consume desde la web pública.
restaurantRouter.get("/locations", RestaurantController.getRestaurantLocations);
// Ruta interna de administración (dashboard/backoffice).
restaurantRouter.get("/", authMiddleware, checkRole("ADMIN"), RestaurantController.getRestaurants);
restaurantRouter.get("/dashboard", authMiddleware, checkRole("ADMIN"), RestaurantController.getRestaurantsDashboard);

restaurantRouter.delete("/:id", authMiddleware, checkRole("ADMIN"), RestaurantController.deleteRestaurant);

// Ruta per actualizar la información del restaurante
restaurantRouter.put("/:id", authMiddleware, checkRole("ADMIN"), uploadRestaurantImage, parseWizardData, validate(UpdateRestaurantSchema), RestaurantController.updateRestaurant);

// Acción alternativa para bloquear operativa sin borrar histórico.
// Patch sirve para actualizar parcialmente un recurso, es decir, solo se actualiza lo que se le pasa.
restaurantRouter.patch("/:id/deactivate", authMiddleware, checkRole("ADMIN"), RestaurantController.deactivateRestaurant);