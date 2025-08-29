import express from 'express';
import { ulid } from 'ulidx';
import { makeNats } from './nats.js';
import { config } from './config.js';
import logger from './logger.js';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler.js';
import { validateRequest, validateBody } from './middleware/validation.js';
import { userParamsSchema, userActivitySchema, userCreateSchema } from './middleware/validation.js';
import { rateLimit } from './middleware/rateLimit.js';
import healthRoutes from './routes/health.js';
import statusRoutes from './routes/status.js';
import { LOG_MESSAGES, SUCCESS_MESSAGES, ERROR_MESSAGES } from './constants/logMessages.js';
import { setupSwagger } from './swagger.js';
import { pool } from './db.js';

async function main() {
    logger.info(LOG_MESSAGES.SERVER_START, {
        port: config.PORT,
        environment: config.NODE_ENV,
    });

    const { nc, js, sc } = await makeNats();
    const app = express();

    // Middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Request logging
    app.use((req, res, next) => {
        logger.info(LOG_MESSAGES.REQUEST_INCOMING, {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        next();
    });

    // Setup Swagger documentation
    setupSwagger(app);

    // Routes
    app.use('/health', healthRoutes);
    app.use('/status', statusRoutes);

    /**
     * @swagger
     * /user/{id}/data:
     *   get:
     *     summary: Get user information directly
     *     description: Retrieves user information directly from the database without queuing
     *     tags: [Users]
     *     parameters:
     *       - $ref: '#/components/parameters/UserId'
     *     responses:
     *       200:
     *         description: User data retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserDataResponse'
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       404:
     *         description: User not found
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.get(
        '/user/:id/data',
        rateLimit('user'),
        validateRequest(userParamsSchema),
        asyncHandler(async (req: express.Request, res: express.Response) => {
            const { id } = req.params;

            logger.info(LOG_MESSAGES.USER_DATA_REQUEST, { userId: id });

            try {
                const result = await pool.query(
                    'SELECT id, email, name FROM app.users WHERE id = $1',
                    [id]
                );

                if (result.rows.length === 0) {
                    logger.info(LOG_MESSAGES.USER_NOT_FOUND, { userId: id });
                    return res.status(404).json({
                        success: false,
                        message: 'User not found',
                        userId: id,
                    });
                }

                const user = result.rows[0];
                logger.info(LOG_MESSAGES.USER_DATA_RETRIEVED, { userId: id });

                res.json({
                    success: true,
                    data: user,
                    message: 'User data retrieved successfully',
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(LOG_MESSAGES.USER_DATA_RETRIEVAL_FAILED, {
                    userId: id,
                    error: errorMessage,
                });
                throw error;
            }
        })
    );

    /**
     * @swagger
     * /user/{id}/orders/data:
     *   get:
     *     summary: Get user orders directly
     *     description: Retrieves orders for a specific user directly from the database without queuing
     *     tags: [Users]
     *     parameters:
     *       - $ref: '#/components/parameters/UserId'
     *     responses:
     *       200:
     *         description: User orders retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserOrdersResponse'
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.get(
        '/user/:id/orders/data',
        rateLimit('user'),
        validateRequest(userParamsSchema),
        asyncHandler(async (req: express.Request, res: express.Response) => {
            const { id } = req.params;

            logger.info(LOG_MESSAGES.USER_ORDERS_DATA_REQUEST, { userId: id });

            try {
                const result = await pool.query(
                    'SELECT id, user_id, total_cents, created_at FROM app.orders WHERE user_id = $1 ORDER BY created_at DESC',
                    [id]
                );

                const orders = result.rows;
                logger.info(LOG_MESSAGES.USER_ORDERS_DATA_RETRIEVED, {
                    userId: id,
                    orderCount: orders.length,
                });

                res.json({
                    success: true,
                    data: {
                        userId: parseInt(id),
                        orders: orders,
                        count: orders.length,
                    },
                    message: 'User orders retrieved successfully',
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(LOG_MESSAGES.USER_ORDERS_DATA_RETRIEVAL_FAILED, {
                    userId: id,
                    error: errorMessage,
                });
                throw error;
            }
        })
    );

    /**
     * @swagger
     * /users:
     *   get:
     *     summary: Get all users
     *     description: Retrieves all users from the database
     *     tags: [Users]
     *     responses:
     *       200:
     *         description: Users retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UsersListResponse'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.get(
        '/users',
        rateLimit('user'),
        asyncHandler(async (req: express.Request, res: express.Response) => {
            logger.info(LOG_MESSAGES.USERS_LIST_REQUEST);

            try {
                const result = await pool.query(
                    'SELECT id, email, name FROM app.users ORDER BY id'
                );

                const users = result.rows;
                logger.info(LOG_MESSAGES.USERS_LIST_RETRIEVED, { userCount: users.length });

                res.json({
                    success: true,
                    data: {
                        users: users,
                        count: users.length,
                    },
                    message: 'Users retrieved successfully',
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(LOG_MESSAGES.USERS_LIST_RETRIEVAL_FAILED, { error: errorMessage });
                throw error;
            }
        })
    );

    /**
     * @swagger
     * /users/data:
     *   post:
     *     summary: Create a new user directly
     *     description: Creates a new user directly in the database without queuing
     *     tags: [Users]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UserCreate'
     *     responses:
     *       201:
     *         description: User created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserCreateResponse'
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       409:
     *         description: User with email already exists
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.post(
        '/users/data',
        rateLimit('user'),
        validateBody(userCreateSchema),
        asyncHandler(async (req: express.Request, res: express.Response) => {
            const { email, name } = req.body;

            logger.info(LOG_MESSAGES.USER_CREATE_REQUEST, { email, name });

            try {
                // Check if user already exists
                const existingUser = await pool.query('SELECT id FROM app.users WHERE email = $1', [
                    email,
                ]);

                if (existingUser.rows.length > 0) {
                    logger.info(LOG_MESSAGES.USER_EMAIL_EXISTS, { email });
                    return res.status(409).json({
                        success: false,
                        message: 'User with this email already exists',
                        email: email,
                    });
                }

                // Create new user
                const result = await pool.query(
                    'INSERT INTO app.users (email, name) VALUES ($1, $2) RETURNING id, email, name',
                    [email, name]
                );

                const user = result.rows[0];
                logger.info(LOG_MESSAGES.USER_CREATED_SUCCESSFULLY, { userId: user.id, email });

                res.status(201).json({
                    success: true,
                    data: user,
                    message: SUCCESS_MESSAGES.USER_CREATED,
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(LOG_MESSAGES.USER_CREATION_FAILED, { error: errorMessage, email });
                throw error;
            }
        })
    );

    /**
     * @swagger
     * /orders:
     *   get:
     *     summary: Get all orders
     *     description: Retrieves all orders from the database
     *     tags: [Orders]
     *     responses:
     *       200:
     *         description: Orders retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/OrdersListResponse'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.get(
        '/orders',
        rateLimit('user'),
        asyncHandler(async (req: express.Request, res: express.Response) => {
            logger.info(LOG_MESSAGES.ORDERS_LIST_REQUEST);

            try {
                const result = await pool.query(
                    'SELECT o.id, o.user_id, o.total_cents, o.created_at, u.email as user_email, u.name as user_name FROM app.orders o JOIN app.users u ON o.user_id = u.id ORDER BY o.created_at DESC'
                );

                const orders = result.rows;
                logger.info(LOG_MESSAGES.ORDERS_LIST_RETRIEVED, { orderCount: orders.length });

                res.json({
                    success: true,
                    data: {
                        orders: orders,
                        count: orders.length,
                    },
                    message: 'Orders retrieved successfully',
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(LOG_MESSAGES.ORDERS_LIST_RETRIEVAL_FAILED, { error: errorMessage });
                throw error;
            }
        })
    );

    /**
     * @swagger
     * /user/{id}:
     *   get:
     *     summary: Get user information
     *     description: Retrieves user information by ID and queues the request for processing
     *     tags: [Users]
     *     parameters:
     *       - $ref: '#/components/parameters/UserId'
     *     responses:
     *       200:
     *         description: Request queued successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       429:
     *         description: Rate limit exceeded
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.get(
        '/user/:id',
        rateLimit('user'),
        validateRequest(userParamsSchema),
        asyncHandler(async (req: express.Request, res: express.Response) => {
            const { id } = req.params;
            const msgId = ulid();

            logger.info(LOG_MESSAGES.USER_REQUEST_PROCESSING, { userId: id, messageId: msgId });

            const payload = {
                id: msgId,
                statementId: 'userById',
                params: { id },
            };

            try {
                await js.publish('sql.lp.v1.userById', sc.encode(JSON.stringify(payload)));

                logger.info(LOG_MESSAGES.USER_REQUEST_QUEUED, { userId: id, messageId: msgId });

                res.json({
                    success: true,
                    messageId: msgId,
                    message: SUCCESS_MESSAGES.REQUEST_QUEUED,
                    statusUrl: `/status/${msgId}`,
                    note: 'Use the statusUrl to check processing status',
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(LOG_MESSAGES.USER_REQUEST_FAILED, {
                    userId: id,
                    messageId: msgId,
                    error: errorMessage,
                });
                throw error;
            }
        })
    );

    /**
     * @swagger
     * /user/{id}/activity:
     *   post:
     *     summary: Log user activity
     *     description: Logs a user activity and queues it for processing
     *     tags: [Users]
     *     parameters:
     *       - $ref: '#/components/parameters/UserId'
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UserActivity'
     *     responses:
     *       200:
     *         description: Activity logged successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       429:
     *         description: Rate limit exceeded
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.post(
        '/user/:id/activity',
        rateLimit('user'),
        validateRequest(userParamsSchema),
        validateBody(userActivitySchema),
        asyncHandler(async (req: express.Request, res: express.Response) => {
            const { id } = req.params;
            const { activity, timestamp } = req.body;
            const msgId = ulid();

            logger.info(LOG_MESSAGES.USER_ACTIVITY_PROCESSING, {
                userId: id,
                messageId: msgId,
                activity,
            });

            const payload = {
                id: msgId,
                statementId: 'logUserActivity',
                params: {
                    userId: id,
                    activity,
                    timestamp: timestamp || new Date().toISOString(),
                },
            };

            try {
                await js.publish('user.activity', sc.encode(JSON.stringify(payload)));

                logger.info(LOG_MESSAGES.USER_ACTIVITY_QUEUED, { userId: id, messageId: msgId });

                res.json({
                    success: true,
                    messageId: msgId,
                    message: SUCCESS_MESSAGES.ACTIVITY_LOGGED,
                    statusUrl: `/status/${msgId}`,
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(LOG_MESSAGES.USER_ACTIVITY_FAILED, {
                    userId: id,
                    messageId: msgId,
                    error: errorMessage,
                });
                throw error;
            }
        })
    );

    /**
     * @swagger
     * /user/{id}/orders:
     *   get:
     *     summary: Get user orders
     *     description: Retrieves orders for a specific user and queues the request for processing
     *     tags: [Users]
     *     parameters:
     *       - $ref: '#/components/parameters/UserId'
     *     responses:
     *       200:
     *         description: Request queued successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       429:
     *         description: Rate limit exceeded
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.get(
        '/user/:id/orders',
        rateLimit('user'),
        validateRequest(userParamsSchema),
        asyncHandler(async (req: express.Request, res: express.Response) => {
            const { id } = req.params;
            const msgId = ulid();

            logger.info(LOG_MESSAGES.USER_ORDERS_PROCESSING, { userId: id, messageId: msgId });

            const payload = {
                id: msgId,
                statementId: 'ordersByUser',
                params: { userId: id },
            };

            try {
                await js.publish('sql.lp.v1.ordersByUser', sc.encode(JSON.stringify(payload)));

                logger.info(LOG_MESSAGES.USER_ORDERS_QUEUED, {
                    userId: id,
                    messageId: msgId,
                });

                res.json({
                    success: true,
                    messageId: msgId,
                    message: SUCCESS_MESSAGES.ORDERS_REQUEST_QUEUED,
                    statusUrl: `/status/${msgId}`,
                    note: 'Use the statusUrl to check processing status',
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(LOG_MESSAGES.USER_ORDERS_FAILED, {
                    userId: id,
                    messageId: msgId,
                    error: errorMessage,
                });
                throw error;
            }
        })
    );

    /**
     * @swagger
     * /users:
     *   post:
     *     summary: Create a new user
     *     description: Creates a new user in the database
     *     tags: [Users]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UserCreate'
     *     responses:
     *       201:
     *         description: User created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.post(
        '/users',
        rateLimit('user'),
        validateBody(userCreateSchema),
        asyncHandler(async (req: express.Request, res: express.Response) => {
            const { email, name } = req.body;
            const msgId = ulid();

            logger.info(LOG_MESSAGES.USER_CREATE_PROCESSING, {
                messageId: msgId,
                email,
                name,
            });

            const payload = {
                id: msgId,
                statementId: 'createUser',
                params: { email, name },
            };

            try {
                await js.publish('sql.lp.v1.createUser', sc.encode(JSON.stringify(payload)));

                logger.info(LOG_MESSAGES.USER_CREATE_QUEUED, { messageId: msgId });

                res.status(201).json({
                    success: true,
                    messageId: msgId,
                    message: SUCCESS_MESSAGES.USER_CREATED,
                    statusUrl: `/status/${msgId}`,
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(LOG_MESSAGES.USER_CREATE_FAILED, {
                    messageId: msgId,
                    error: errorMessage,
                });
                throw error;
            }
        })
    );

    // Error handling middleware
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Graceful shutdown
    const server = app.listen(config.PORT, () => {
        logger.info(LOG_MESSAGES.SERVER_STARTED, {
            port: config.PORT,
            environment: config.NODE_ENV,
        });
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
        logger.info(LOG_MESSAGES.SERVER_SHUTDOWN, { signal });

        server.close(async () => {
            logger.info(LOG_MESSAGES.SERVER_HTTP_CLOSED);

            try {
                await nc.drain();
                logger.info(LOG_MESSAGES.SERVER_NATS_DRAINED);
                process.exit(0);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, { error: errorMessage });
                process.exit(1);
            }
        });

        // Force shutdown after timeout
        setTimeout(() => {
            logger.error(LOG_MESSAGES.SERVER_FORCED_SHUTDOWN);
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

main().catch((error) => {
    logger.error(ERROR_MESSAGES.FAILED_TO_START, { error: error.message, stack: error.stack });
    process.exit(1);
});
