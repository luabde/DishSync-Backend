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

    static loginController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await UserService.login(req.body.email, req.body.password);

            res.cookie("access_token", data.token, { 
                httpOnly: true, // Cookie solo accesible por el servidor
                secure: process.env.NODE_ENV === "production", // La cookie solo se enviará por HTTPS en producción
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // En producción, permitir cross-site cookies (para dominio de frontend separado)
                maxAge: 60 * 60 * 1000 // 1 hora
            });

            res.cookie("refresh_token", data.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
            });

            res.status(200).json({ message: "Login exitoso", user: data.user });
        } catch (error) {
            // Pasamos el error al middleware global de errores
            next(error);
        }
    }

    static refreshController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const refreshToken = req.cookies.refresh_token;
            const data = await UserService.refresh(refreshToken);

            // Setear nuevo access token
            res.cookie("access_token", data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 60 * 60 * 1000
            });

            res.status(200).json({ message: "Token renovado correctamente" });
        } catch (error) {
            next(error);
        }
    }

    static logoutController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Eliminar refresh token de la BD
            const { userId } = req.body.authUser;
            await UserService.logout(userId);

            // Eliminar cookies
            res.clearCookie("access_token");
            res.clearCookie("refresh_token");

            res.status(200).json({ message: "Logout exitoso" });
        } catch (error) {
            next(error);
        }
    }

    static meController = async (req: Request, res: Response) => {
        res.status(200).json({ user: req.body.authUser });
    }

}