import { Router, Request, Response } from "express";
import { authRouter } from "./auth";
import { restaurantRouter } from "./restaurant.routes";
import { taulesRouter } from "./taules.routes";
import { usuariRouter } from "./usuari.routes";
import { platsRouter } from "./plats.routes";

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
router.use("/usuaris", usuariRouter);
router.use("/plats", platsRouter);