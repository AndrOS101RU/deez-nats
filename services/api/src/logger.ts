import winston from 'winston';
import { config } from './config.js';

const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

export const logger = winston.createLogger({
    level: config.LOG_LEVEL,
    format: logFormat,
    defaultMeta: { service: 'api' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

// Create logs directory if it doesn't exist
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

const logsDir = 'logs';
if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
}

export default logger;
