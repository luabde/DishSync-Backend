import { Router, Request, Response } from "express";
import { validate } from "../middlewares/validate.middleware";
import { UserSchema, LoginSchema } from "../../models/user";
import { AuthController } from "../controllers/auth";
import { authMiddleware } from "../middlewares/auth.middleware";


export const authRouter = Router();

authRouter.post("/login", validate(LoginSchema), AuthController.loginController);
authRouter.post("/register", validate(UserSchema), AuthController.registerController);
authRouter.post("/logout", authMiddleware, AuthController.logoutController);
authRouter.post("/refresh", AuthController.refreshController);
authRouter.get("/me", authMiddleware, AuthController.meController);