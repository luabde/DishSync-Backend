import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError';
import { Prisma } from '../../../generated/prisma/client';

const PRISMA_ERROR_MESSAGES: Record<string, string> = {
  P2002: "Ya existe un registro con ese valor único",
  P2025: "El registro relacionado no existe",
  P2003: "Referencia a un campo que no existe",
  P2011: "Campo obligatorio está vacío",
};

export const errorMiddleware = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const message = PRISMA_ERROR_MESSAGES[err.message] || "Error de base de datos";
    return res.status(400).json({ status: "fail", message });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      status: "fail",
      message: "Datos inválidos o campos obligatorios faltantes"
    });
  }

  // Error genérico — equivale a tu throw new AppError("Error interno...", 500)
  console.error(err);
  return res.status(500).json({
    status: "error",
    message: err instanceof Error ? err.message : "Error interno del servidor"
  });
};