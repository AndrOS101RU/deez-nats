import { z } from 'zod';

const configSchema = z.object({
    NATS_URL: z.string().min(1),
    NATS_CLUSTER_NAME: z.string().default('js-cluster'),
    PORT: z.coerce.number().min(1).max(65535).default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    JWT_SECRET: z.string().min(32).default('dev-secret-key-change-in-production'),
    API_KEY: z.string().optional(),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    REQUEST_TIMEOUT_MS: z.coerce.number().min(1000).max(30000).default(5000),
    NATS_TIMEOUT_MS: z.coerce.number().min(1000).max(10000).default(2000),
});

export const config = configSchema.parse(process.env);

export type Config = z.infer<typeof configSchema>;
