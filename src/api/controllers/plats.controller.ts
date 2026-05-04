import { NextFunction, Request, Response} from "express"
import { PlatService } from "../../services/plats.service";

type PlatWithFileRequest = Request & {
    file?: {
        originalname: string;
        buffer: Buffer;
        mimetype: string;
        size: number;
    };
};

export class PlatController {
    static createPlatController = async (req: PlatWithFileRequest, res: Response, next: NextFunction) => {
        try {
            const plat = await PlatService.createPlat(req.body, req.file);
            res.status(201).json({ message: "Plat creado correctamente", plat });
        } catch (error) {
            next(error);
        }
    }
    static getPlatsController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const plats = await PlatService.getPlats();
            res.status(200).json({ plats });
        } catch (error) {
            next(error);
        }
    }
    static getRestaurantsMenuAvailabilityController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const restaurants = await PlatService.getRestaurantsMenuAvailability();
            res.status(200).json({ restaurants });
        } catch (error) {
            next(error);
        }
    }
    static getCategoriesController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const categories = await PlatService.getCategories();
            res.status(200).json({ categories });
        } catch (error) {
            next(error);
        }
    }
    static updatePlatAvailabilityController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rawRestaurantId = Array.isArray(req.params.restaurantId)
                ? req.params.restaurantId[0]
                : req.params.restaurantId;
            const rawPlatId = Array.isArray(req.params.platId) ? req.params.platId[0] : req.params.platId;
            const restaurantId = Number.parseInt(rawRestaurantId, 10);
            const platId = Number.parseInt(rawPlatId, 10);

            if (Number.isNaN(restaurantId) || Number.isNaN(platId)) {
                res.status(400).json({ message: "IDs de restaurant o plat invàlids" });
                return;
            }

            const updated = await PlatService.updatePlatAvailability(restaurantId, platId, req.body);
            res.status(200).json({ message: "Disponibilitat actualitzada correctament", platRestaurant: updated });
        } catch (error) {
            next(error);
        }
    }
    static createCategoryController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const category = await PlatService.createCategory(req.body);
            res.status(201).json({ message: "Categoria creada correctamente", category });
        } catch (error) {
            next(error);
        }
    }
    static updatePlatController = async (req: PlatWithFileRequest, res: Response, next: NextFunction) => {
        try {
            const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const platId = Number.parseInt(rawId, 10);

            if (Number.isNaN(platId)) {
                res.status(400).json({ message: "ID de plat invàlid" });
                return;
            }

            const plat = await PlatService.updatePlat(platId, req.body, req.file);
            res.status(200).json({ message: "Plat actualizado correctamente", plat });
        } catch (error) {
            next(error);
        }
    }
    static deletePlatController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const platId = Number.parseInt(rawId, 10);

            if (Number.isNaN(platId)) {
                res.status(400).json({ message: "ID de plat invàlid" });
                return;
            }

            const plat = await PlatService.deletePlat(platId);
            res.status(200).json({ message: "Plat eliminado correctamente", plat });
        } catch (error) {
            next(error);
        }
    }
}