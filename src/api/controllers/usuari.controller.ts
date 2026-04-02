import type { Request, Response, NextFunction } from "express";
import { UserService } from "../../services/user";

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
}
