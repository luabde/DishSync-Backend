import { Request, Response, NextFunction } from "express";
import { prisma } from "../../loaders/prisma.loader";
import { RestaurantService } from "../../services/restaurant.service";

export class RestaurantController {
  static createRestaurant = async (req: Request, res: Response, next: NextFunction) => {
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
      const nomParam = req.params.nom;
      const direccioParam = req.params.direccio;
      const nom = Array.isArray(nomParam) ? nomParam[0] : nomParam;
      const direccio = Array.isArray(direccioParam) ? direccioParam[0] : direccioParam;

      const restaurant = await prisma.restaurant.findFirst({
        where: { nom, direccio },
        select: { id: true },
      });

      res.status(200).json({ exists: Boolean(restaurant) });
    } catch (error) {
      next(error);
    }
  };

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
