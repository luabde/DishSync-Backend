import type { Request, Response, NextFunction } from "express";
import { UserService } from "../../services/user";

export class AuthController {
    static registerController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await UserService.createUser(req.body);
            res.status(201).json({ message: "User creado correctamente", user });
        } catch (error) {
            // Pasamos el error al middleware global de errores
            next(error);
        }
    }

}