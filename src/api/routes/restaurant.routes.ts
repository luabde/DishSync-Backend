import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import {checkRole} from "../middlewares/role.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { RestaurantSchema, UpdateRestaurantSchema } from "../../models/restaurant.model";
import {
  CreateReservationByStaffSchema,
  CreateReservationSchema,
  UpdateReservationByStaffSchema,
} from "../../models/reservation.model";
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

// ---- RUTAS CRUD RESTAURANT ----

// RUTAS GET
// Rutas de validación por query params para soportar textos libres (ej: "C/ Major, 12").
restaurantRouter.get("/validate-name", authMiddleware, checkRole("ADMIN"), RestaurantController.validateRestaurantExists);
restaurantRouter.get("/validate-address", authMiddleware, checkRole("ADMIN"), RestaurantController.validateRestaurantDirectionExists);

// Ruta pública para el mapa de "Encuéntranos" en frontend.
// No requiere auth porque se consume desde la web pública.
restaurantRouter.get("/locations", RestaurantController.getRestaurantLocations);
// Ruta interna de administración (dashboard/backoffice).
restaurantRouter.get("/", authMiddleware, checkRole("ADMIN"), RestaurantController.getRestaurants);
restaurantRouter.get("/dashboard", authMiddleware, checkRole("ADMIN"), RestaurantController.getRestaurantsDashboard);


// RUTAS DELETE
restaurantRouter.delete("/:id", authMiddleware, checkRole("ADMIN"), RestaurantController.deleteRestaurant);

// RUTAS PUT
// Ruta per actualizar la información del restaurante
restaurantRouter.put("/:id", authMiddleware, checkRole("ADMIN"), uploadRestaurantImage, parseWizardData, validate(UpdateRestaurantSchema), RestaurantController.updateRestaurant);

// RUTAS PATCH
// Acción alternativa para bloquear operativa sin borrar histórico.
// Patch sirve para actualizar parcialmente un recurso, es decir, solo se actualiza lo que se le pasa.
restaurantRouter.patch("/:id/deactivate", authMiddleware, checkRole("ADMIN"), RestaurantController.deactivateRestaurant);


// ---- RUTAS FORM RESERVAS ----
// GET turnos/horas disponibles para una fecha del restaurante.
restaurantRouter.get("/reservationsForm/:restaurantId", RestaurantController.getReservationsForm);
// POST mesas (con estado de reserva) filtradas por fecha/turno/hora/zona.
restaurantRouter.post("/reservationsForm/:restaurantId/getTaules", RestaurantController.getTaules);
// GET zonas configuradas del restaurante para el mapa/formulario.
restaurantRouter.get("/reservationsForm/:restaurantId/zones", RestaurantController.getReservationZones);
// PATCH libera una reserva concreta y la deja en estado LLIURE (staff).
restaurantRouter.patch(
  "/reservationsForm/:restaurantId/reservations/:reservationId/release",
  authMiddleware,
  checkRole("RESPONSABLE", "CAMBRER"),
  RestaurantController.releaseReservationByStaff
);
// PATCH edita una reserva desde staff (contacto, mesa, turno, fecha, hora, personas, estado, observaciones).
restaurantRouter.patch(
  "/reservationsForm/:restaurantId/reservations/:reservationId",
  authMiddleware,
  checkRole("RESPONSABLE", "CAMBRER"),
  validate(UpdateReservationByStaffSchema),
  RestaurantController.updateReservationByStaff
);
// POST crea una nueva reserva de cliente para el restaurante.
restaurantRouter.post(
  "/reservationsForm/:restaurantId/createReservation",
  validate(CreateReservationSchema),
  RestaurantController.createReservation
);
// POST crea una reserva directa desde staff (sin flujo de confirmación por email/workers).
restaurantRouter.post(
  "/reservationsForm/staff/:restaurantId/createReservation",
  authMiddleware,
  checkRole("RESPONSABLE", "CAMBRER"),
  validate(CreateReservationByStaffSchema),
  RestaurantController.createReservationByStaff
);
// GET confirma reserva pública por token (email de confirmación).
restaurantRouter.get("/reservations/confirm/:token", RestaurantController.confirmReservationByToken);
// GET cancela reserva pública por token (email de cancelación).
restaurantRouter.get("/reservations/cancel/:token", RestaurantController.cancelReservationByToken);