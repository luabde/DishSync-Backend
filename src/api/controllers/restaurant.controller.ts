import { Request, Response, NextFunction } from "express";
import { prisma } from "../../loaders/prisma.loader";
import { RestaurantService } from "../../services/restaurant.service";

type CreateRestaurantRequest = Request & {
  file?: {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
    size: number;
  };
};

export class RestaurantController {
  static createRestaurant = async (req: CreateRestaurantRequest, res: Response, next: NextFunction) => {
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
}
