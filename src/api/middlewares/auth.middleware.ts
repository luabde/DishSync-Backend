import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/AppError";
import { envConfig } from "../../config/env.config";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.access_token;
    
    if (!token) {
        console.warn("[AUTH][MIDDLEWARE] no access_token");
        return next(new AppError("No autenticado", 401));
    }

  try {
    const decoded = jwt.verify(token, envConfig.jwt.jwtSecret);
    req.body = req.body ?? {};
    req.body.authUser = decoded;
    console.log("[AUTH][MIDDLEWARE] token ok", {
      userId: (decoded as { userId?: number }).userId,
    });
    next();
  } catch {
    return next(new AppError("Token inválido o expirado", 401));
  }
};