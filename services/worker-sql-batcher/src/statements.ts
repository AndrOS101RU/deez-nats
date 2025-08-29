import { z } from 'zod';

export const schemas = {
    userById: z.object({ id: z.number().int().positive() }),
    ordersByUser: z.object({ userId: z.number().int().positive() }),
    logUserActivity: z.object({
        userId: z.number().int().positive(),
        activity: z.any(),
        timestamp: z.string(),
    }),
    createUser: z.object({
        email: z.string().email(),
        name: z.string().optional(),
    }),
} as const;

export type StatementId = keyof typeof schemas;
