import type { Request, Response, NextFunction } from "express";
import { UserService } from "../../services/user";

export class UsuariController {
  // Catálogo de usuarios sin restaurante asignado (wizard de alta de restaurante).
  static getUsersForAssignment = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await UserService.getUsersForAssignment();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  };

  // Listado completo con relación de restaurante para gestión en dashboard.
  static getAllUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  };

  // Listado de mensajes de contacto para gestión en frontend.
  static getAllContactForms = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const contactForms = await UserService.getAllContactForms();
      res.status(200).json(contactForms);
    } catch (error) {
      next(error);
    }
  };

  // Modificación de usuario desde la edición inline de la tabla.
  static modifyUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number.parseInt(req.params.userId as string, 10);
      const data = req.body;
      const user = await UserService.modifyUser(userId, data);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };

  // Baja de usuario desde panel de gestión.
  static deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try{
      const userId = Number.parseInt(req.params.userId as string, 10);
      await UserService.deleteUser(userId);
      res.status(200).json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
      next(error);
    }
  }

  // Verificación de duplicado de email para formularios.
  static validateEmailExists = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const emailParam = req.query.email;
      const email = Array.isArray(emailParam) ? emailParam[0] : emailParam;
      if (!email) return res.status(200).json({ exists: false });

      const exists = await UserService.validateEmailExists(String(email));
      res.status(200).json({ exists });
    } catch (error) {
      next(error);
    }
  };

  // Verificación de duplicado de nombre de usuario para formularios.
  static validateUsernameExists = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usernameParam = req.query.username;
      const username = Array.isArray(usernameParam) ? usernameParam[0] : usernameParam;
      if (!username) return res.status(200).json({ exists: false });

      const exists = await UserService.validateUsernameExists(String(username));
      res.status(200).json({ exists });
    } catch (error) {
      next(error);
    }
  };
}
