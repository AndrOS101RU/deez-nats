import { Request, Response, NextFunction } from 'express';
import logger from '../logger.js';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export class OperationalError extends Error implements AppError {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export function errorHandler(error: AppError, req: Request, res: Response, next: NextFunction) {
    // Log the error
    logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });

    // If it's an operational error, return the status code
    if (error.isOperational) {
        return res.status(error.statusCode || 500).json({
            error: error.message,
            statusCode: error.statusCode || 500,
        });
    }

    // For unexpected errors, don't expose internal details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(500).json({
        error: isDevelopment ? error.message : 'Internal server error',
        ...(isDevelopment && { stack: error.stack }),
    });
}

export function notFoundHandler(req: Request, res: Response) {
    logger.warn('Route not found', {
        path: req.path,
        method: req.method,
        ip: req.ip,
    });

    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method,
    });
}

export function asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
