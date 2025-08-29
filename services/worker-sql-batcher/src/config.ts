import { z } from 'zod';

const configSchema = z.object({
    NATS_URL: z.string().min(1),
    NATS_CLUSTER_NAME: z.string().default('js-cluster'),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    BATCH_MAX: z.coerce.number().min(1).max(1000).default(256),
    BATCH_WINDOW_MS: z.coerce.number().min(1).max(60000).default(15),
    STREAM_VALIDATION_MAX_RETRIES: z.coerce.number().min(1).max(300).default(60),
    STREAM_VALIDATION_RETRY_INTERVAL_MS: z.coerce.number().min(1000).max(30000).default(5000),
    NATS_CONNECTION_TIMEOUT_MS: z.coerce.number().min(5000).max(120000).default(30000),
    NATS_PING_INTERVAL_MS: z.coerce.number().min(10000).max(60000).default(20000),
});

export const config = configSchema.parse(process.env);

export type Config = z.infer<typeof configSchema>;
