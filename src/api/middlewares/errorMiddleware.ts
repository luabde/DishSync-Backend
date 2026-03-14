import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError';

export const errorMiddleware = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let status = 'error';
    let message = err.message || 'Error interno del servidor';

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        status = err.status;
    }

    console.error(`[Error] ${statusCode} - ${message}`);

    res.status(statusCode).json({
        status,
        message,
    });
};
