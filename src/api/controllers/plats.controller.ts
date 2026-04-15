import { NextFunction, Request, Response} from "express"
import { PlatService } from "../../services/plats.service";

export class PlatController {
    static createPlatController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const plat = await PlatService.createPlat(req.body);
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
    static updatePlatController = async (req: Request, res: Response, next: NextFunction) => {}
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