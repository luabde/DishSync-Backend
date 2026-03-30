import { Router, Request, Response } from "express";
import { authRouter } from "./auth";
import { restaurantRouter } from "./restaurant.routes";
import { taulesRouter } from "./taules.routes";

export const router = Router();

router.get("/rutaPrueba", (req: Request, res: Response) => {
  res.json({
    message: "Servidor DishSync funcionando",
    nodeEnv: process.env.NODE_ENV,
  });
});

router.use("/auth", authRouter);
router.use("/restaurants", restaurantRouter);
router.use("/taules", taulesRouter);