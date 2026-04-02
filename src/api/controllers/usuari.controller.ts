import type { Request, Response, NextFunction } from "express";
import { UserService } from "../../services/user";
import { AppError } from "../../utils/AppError";

export class UsuariController {
  static getUsersForAssignment = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await UserService.getUsersForAssignment();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  };

  static getAllUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  };

  static modifyUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawUserId = Array.isArray(req.params.userId)
        ? req.params.userId[0]
        : req.params.userId;
      const userId = Number.parseInt(rawUserId, 10);
      if (Number.isNaN(userId)) {
        throw new AppError("userId inválido", 400);
      }
      const data = req.body;
      const user = await UserService.modifyUser(userId, data);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };
}
