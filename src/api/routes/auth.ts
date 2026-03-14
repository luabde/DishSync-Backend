import { Router, Request, Response } from "express";
import { validate } from "../middlewares/validate.middleware";
import { UserSchema } from "../../models/user";
import { AuthController } from "../controllers/auth";

export const authRouter = Router();

authRouter.post("/login", ()=>{});

authRouter.post("/register", validate(UserSchema), AuthController.registerController);

authRouter.post("/logout", ()=>{});

authRouter.get("/protected", ()=>{});