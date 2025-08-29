import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import logger from '../logger.js';
import { ERROR_MESSAGES, LOG_MESSAGES } from '../constants/logMessages.js';

// Common validation schemas
export const userParamsSchema = z.object({
    id: z.coerce.number().int().positive().max(999999),
});

export const userActivitySchema = z.object({
    activity: z.string().min(1).max(1000),
    timestamp: z.string().datetime().optional(),
});

export const userCreateSchema = z.object({
    email: z.string().email().min(1).max(255),
    name: z.string().min(1).max(255).optional(),
});

export const messageIdSchema = z.object({
    messageId: z.string().min(1).max(100),
});

// Generic validation middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatedData = schema.parse(req.params);
            req.params = validatedData as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                logger.warn(LOG_MESSAGES.VALIDATION_FAILED, {
                    path: req.path,
                    errors: error.errors,
                    params: req.params,
                });
                return res.status(400).json({
                    error: ERROR_MESSAGES.VALIDATION_FAILED,
                    details: error.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
            }
            next(error);
        }
    };
}

// Body validation middleware
export function validateBody<T>(schema: z.ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                logger.warn(LOG_MESSAGES.VALIDATION_FAILED, {
                    path: req.path,
                    errors: error.errors,
                    body: req.body,
                });
                return res.status(400).json({
                    error: ERROR_MESSAGES.INVALID_REQUEST_BODY,
                    details: error.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
            }
            next(error);
        }
    };
}
