import { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Metodo para validar que los datos son correctos a traves del zod
export const validate = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }

    req.body = result.data;
    next();
  };
};