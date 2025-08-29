import { Router, Request, Response } from 'express';
import { validateRequest, messageIdSchema } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { pool } from '../db.js';
import logger from '../logger.js';
import { LOG_MESSAGES } from '../constants/logMessages.js';

const router = Router();

/**
 * @swagger
 * /status/{messageId}:
 *   get:
 *     summary: Check message status
 *     description: Check the processing status of a previously queued message
 *     tags: [Status]
 *     parameters:
 *       - $ref: '#/components/parameters/MessageId'
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StatusResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
    '/:messageId',
    validateRequest(messageIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { messageId } = req.params;

        logger.info(LOG_MESSAGES.STATUS_CHECKING, { messageId });

        try {
            const result = await pool.query(
                'SELECT result, created_at FROM app.worker_seen WHERE id = $1',
                [messageId]
            );

            if (result.rows.length === 0) {
                logger.info(LOG_MESSAGES.STATUS_NOT_FOUND, { messageId });
                return res.json({
                    status: 'pending',
                    messageId,
                    message: 'Message is still being processed or not found',
                });
            }

            const row = result.rows[0];
            logger.info(LOG_MESSAGES.STATUS_RETRIEVED, { messageId, status: 'completed' });

            res.json({
                status: 'completed',
                messageId,
                result: row.result,
                completedAt: row.created_at,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(LOG_MESSAGES.STATUS_CHECK_FAILED, { messageId, error: errorMessage });
            throw error;
        }
    })
);

export default router;
