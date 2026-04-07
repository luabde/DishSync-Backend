import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";
import { UsuariController } from "../controllers/usuari.controller";

export const usuariRouter = Router();

// Catálogo de usuarios para asignarlos al nuevo restaurante en el wizard.
usuariRouter.get("/", authMiddleware, checkRole("ADMIN"), UsuariController.getUsersForAssignment);

usuariRouter.get("/allUsers", authMiddleware, checkRole("ADMIN"), UsuariController.getAllUsers);
usuariRouter.get("/validate-email", authMiddleware, checkRole("ADMIN"), UsuariController.validateEmailExists);
usuariRouter.get("/validate-username", authMiddleware, checkRole("ADMIN"), UsuariController.validateUsernameExists);

usuariRouter.put("/:userId", authMiddleware, checkRole("ADMIN"), UsuariController.modifyUser);

usuariRouter.delete("/:userId", authMiddleware, checkRole("ADMIN"), UsuariController.deleteUser);