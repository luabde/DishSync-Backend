import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";
import { UsuariController } from "../controllers/usuari.controller";
import { validate } from "../middlewares/validate.middleware";
import { ContacteClientSchema } from "../../models/contacte.model";

export const usuariRouter = Router();

// Formulario de contacto público (sin autenticación).
usuariRouter.post("/contactes", validate(ContacteClientSchema), UsuariController.createContactForm);

// Catálogo de usuarios para asignarlos al nuevo restaurante en el wizard.
usuariRouter.get("/", authMiddleware, checkRole("ADMIN"), UsuariController.getUsersForAssignment);

usuariRouter.get("/allUsers", authMiddleware, checkRole("ADMIN"), UsuariController.getAllUsers);
usuariRouter.get("/contactes", authMiddleware, checkRole("ADMIN"), UsuariController.getAllContactForms);
usuariRouter.patch("/contactes/:contactId/read", authMiddleware, checkRole("ADMIN"), UsuariController.markContactAsRead);
// Rutas de validación de unicidad usadas por frontend antes de guardar.
usuariRouter.get("/validate-email", authMiddleware, checkRole("ADMIN"), UsuariController.validateEmailExists);
usuariRouter.get("/validate-username", authMiddleware, checkRole("ADMIN"), UsuariController.validateUsernameExists);

// Edición inline del usuario desde la tabla de gestión.
usuariRouter.put("/:userId", authMiddleware, checkRole("ADMIN"), UsuariController.modifyUser);

usuariRouter.delete("/:userId", authMiddleware, checkRole("ADMIN"), UsuariController.deleteUser);