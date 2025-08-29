import { Router, Request, Response } from 'express';
import { makeNats } from '../nats.js';
import { checkDatabaseHealth } from '../db.js';
import logger from '../logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { LOG_MESSAGES } from '../constants/logMessages.js';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Comprehensive health check for the API service including NATS and database connections
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            checks: {
                nats: 'unknown',
                database: 'unknown',
            },
        };

        try {
            // Check NATS connection
            const { nc } = await makeNats();

            // If we can create a connection, consider it healthy
            // The status iterator is complex and may block, so we'll use a simple approach
            health.checks.nats = 'connected';

            // Close the connection after health check
            await nc.close();
        } catch (error) {
            health.checks.nats = 'error';
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(LOG_MESSAGES.HEALTH_NATS_CHECK_FAILED, { error: errorMessage });
        }

        try {
            // Check database connection
            const dbHealthy = await checkDatabaseHealth();
            health.checks.database = dbHealthy ? 'connected' : 'disconnected';
        } catch (error) {
            health.checks.database = 'error';
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(LOG_MESSAGES.HEALTH_DB_CHECK_FAILED, { error: errorMessage });
        }

        // Determine overall health status
        const hasErrors = Object.values(health.checks).some((check) => check === 'error');
        const hasUnknown = Object.values(health.checks).some((check) => check === 'unknown');

        if (hasErrors) {
            health.status = 'unhealthy';
            res.status(503);
        } else if (hasUnknown) {
            health.status = 'degraded';
            res.status(200);
        } else {
            res.status(200);
        }

        logger.info(LOG_MESSAGES.HEALTH_CHECK_COMPLETED, { health });
        res.json(health);
    })
);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness check
 *     description: Checks if the service is ready to accept requests
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 status:
 *                   type: 'string'
 *                   example: 'ready'
 *       503:
 *         description: Service is not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 status:
 *                   type: 'string'
 *                   example: 'not ready'
 *                 error:
 *                   type: 'string'
 *                   description: Error message if available
 */
router.get(
    '/ready',
    asyncHandler(async (req: Request, res: Response) => {
        try {
            // Check if NATS is ready
            const { nc } = await makeNats();

            // If we can create a connection, consider it ready
            // The status iterator is complex and may block, so we'll use a simple approach
            const isReady = true;
            await nc.close();

            if (isReady) {
                res.status(200).json({ status: 'ready' });
            } else {
                res.status(503).json({ status: 'not ready' });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(LOG_MESSAGES.READINESS_CHECK_FAILED, { error: errorMessage });
            res.status(503).json({ status: 'not ready', error: errorMessage });
        }
    })
);

export default router;
