import { Request, Response, NextFunction } from "express";
import { prisma } from "../../loaders/prisma.loader";
import { RestaurantService } from "../../services/restaurant.service";
import { envConfig } from "../../config/env.config";
import { AppError } from "../../utils/AppError";

type RestaurantWithFileRequest = Request & {
  file?: {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
    size: number;
  };
};

export class RestaurantController {

  // ---- RUTAS CRUD RESTAURANT ----
  static createRestaurant = async (req: RestaurantWithFileRequest, res: Response, next: NextFunction) => {
    try {
      const restaurant = await RestaurantService.createRestaurant(req.body, req.file);

      res.status(201).json({
        message: "Restaurante creado correctamente",
        restaurant,
      });
    } catch (error) {
      next(error);
    }
  };

  static validateRestaurantExists = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const nomParam = req.query.nom;
      const nom = Array.isArray(nomParam) ? nomParam[0] : nomParam;
      if (!nom) return res.status(200).json({ exists: false });

      const restaurant = await prisma.restaurant.findFirst({
        where: { nom: { equals: String(nom).trim(), mode: "insensitive" } },
        select: { id: true },
      });

      res.status(200).json({ exists: Boolean(restaurant) });
    } catch (error) {
      next(error);
    }
  };

  static validateRestaurantDirectionExists = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const direccioParam = req.query.direccio;
      const direccio = Array.isArray(direccioParam) ? direccioParam[0] : direccioParam;
      if (!direccio) return res.status(200).json({ exists: false });
      const restaurant = await prisma.restaurant.findFirst({
        where: { direccio: { equals: String(direccio).trim(), mode: "insensitive" } },
        select: { id: true },
      });
      res.status(200).json({ exists: Boolean(restaurant) });
    } catch (error) {
      next(error);
    }
  }

  // Solo esta ruta usa RestaurantService (GET /restaurants)
  static getRestaurants = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurants = await RestaurantService.getRestaurants();
      res.status(200).json(restaurants);
    } catch (error) {
      next(error);
    }
  };

  // Endpoint público para "Encuéntranos":
  // devuelve restaurantes activos con lat/lng listos para pintarlos en Leaflet.
  static getRestaurantLocations = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const locations = await RestaurantService.getRestaurantLocations();
      res.status(200).json(locations);
    } catch (error) {
      next(error);
    }
  };

  static getRestaurantsDashboard = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurants = await RestaurantService.getRestaurantsDashboard();
      res.status(200).json(restaurants);
    } catch (error) {
      next(error);
    }
  };

  static deleteRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const restaurant = await RestaurantService.deleteRestaurant(Number(id));
      res.status(200).json({ message: "Restaurante eliminado correctamente", restaurant });
    } catch (error) {
      next(error);
    }
  };

  static updateRestaurant = async (req: RestaurantWithFileRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      // IMPORTANTE:
      // En update aceptamos multipart/form-data y por eso pasamos también req.file.
      // Si llega imagen nueva, el service la guarda y actualiza `url`.
      const restaurant = await RestaurantService.updateRestaurant(Number(id), req.body, req.file);
      res.status(200).json({ message: "Restaurante actualizado correctamente", restaurant });
    } catch (error) {
      next(error);
    }
  };
  
  static deactivateRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cambia el estado a inactivo sin eliminar registros relacionados.
      const { id } = req.params;
      const restaurant = await RestaurantService.deactivateRestaurant(Number(id));
      res.status(200).json({ message: "Restaurante desactivado correctamente", restaurant });
    } catch (error) {
      next(error);
    }
  };


  // ---- RUTAS FORM RESERVAS ----
  static getReservationsForm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.params;
      const reservations = await RestaurantService.getReservationsForm(Number(restaurantId));
      res.status(200).json(reservations);
    } catch (error) {
      next(error);
    }
  };

  static getTaules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.params;
      // Flujo esperado: POST con body { data, torn, hora, zona }.
      const data = req.body;
      const taules = await RestaurantService.getTaules(Number(restaurantId), data);
      res.status(200).json(taules);
    } catch (error) {
      next(error);
    }
  };

  static getReservationZones = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.params;
      const zones = await RestaurantService.getReservationZones(Number(restaurantId));
      res.status(200).json(zones);
    } catch (error) {
      next(error);
    }
  };

  static createReservation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.params;
      const reservation = await RestaurantService.createReservation(Number(restaurantId), req.body);
      res.status(201).json(reservation);
    } catch (error) {
      next(error);
    }
  };

  static confirmReservationByToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenParam = req.params.token;
      const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
      await RestaurantService.confirmReservationByToken(token);
      res.redirect(`${envConfig.frontend.baseUrl}/reservar/confirmada`);
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 410) {
        return res.redirect(`${envConfig.frontend.baseUrl}/reservar/expirada`);
      }
      if (
        error instanceof AppError &&
        error.statusCode === 400 &&
        error.message.toLowerCase().includes("cancelada")
      ) {
        return res.redirect(`${envConfig.frontend.baseUrl}/reservar/cancelada`);
      }
      next(error);
    }
  };

  static cancelReservationByToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenParam = req.params.token;
      const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
      await RestaurantService.cancelReservationByToken(token);
      res.redirect(`${envConfig.frontend.baseUrl}/reservar/cancelada`);
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 410) {
        return res.redirect(`${envConfig.frontend.baseUrl}/reservar/expirada`);
      }
      next(error);
    }
  };
}
