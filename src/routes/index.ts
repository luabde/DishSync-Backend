import { Router, Request, Response } from "express";

export const router = Router();

router.get("/rutaPrueba", (req: Request, res: Response) => {
  res.json({
    message: "Servidor DishSync funcionando 🚀",
    nodeEnv: process.env.NODE_ENV,
  });
});
