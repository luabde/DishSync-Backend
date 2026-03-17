import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/AppError";

export const checkRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { rol } = req.body.authUser;

    if (!rol) {
      return next(new AppError("No autenticado", 401));
    }

    if (!roles.includes(rol)) {
      return next(new AppError("No tienes permisos para acceder", 403));
    }

    next();
  };
};