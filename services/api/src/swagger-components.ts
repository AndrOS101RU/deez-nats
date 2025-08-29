/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 description: Field name
 *               message:
 *                 type: string
 *                 description: Validation message
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Success status
 *         messageId:
 *           type: string
 *           description: Unique message identifier
 *         message:
 *           type: string
 *           description: Success message
 *         statusUrl:
 *           type: string
 *           description: URL to check processing status
 *         note:
 *           type: string
 *           description: Additional information
 *     HealthCheck:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, unhealthy, degraded]
 *           description: Overall health status
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Health check timestamp
 *         uptime:
 *           type: number
 *           description: Server uptime in seconds
 *         version:
 *           type: string
 *           description: API version
 *         environment:
 *           type: string
 *           description: Environment name
 *         checks:
 *           type: object
 *           properties:
 *             nats:
 *               type: string
 *               enum: [connected, error, unknown]
 *               description: NATS connection status
 *             database:
 *               type: string
 *               enum: [connected, disconnected, error]
 *               description: Database connection status
 *     StatusResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, completed]
 *           description: Processing status
 *         messageId:
 *           type: string
 *           description: Message identifier
 *         result:
 *           type: object
 *           description: Processing result (when completed)
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Completion timestamp
 *         message:
 *           type: string
 *           description: Status message
 *     UserActivity:
 *       type: object
 *       required:
 *         - activity
 *       properties:
 *         activity:
 *           type: string
 *           minLength: 1
 *           maxLength: 1000
 *           description: User activity description
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Activity timestamp (optional, defaults to current time)
 *     UserCreate:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           minLength: 1
 *           maxLength: 255
 *           description: User email address (must be unique)
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           description: User name (optional)
 *     UserCreateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Success status
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: User ID
 *             email:
 *               type: string
 *               description: User email
 *             name:
 *               type: string
 *               description: User name
 *         message:
 *           type: string
 *           description: Success message
 *     UserDataResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Success status
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: User ID
 *             email:
 *               type: string
 *               description: User email
 *             name:
 *               type: string
 *               description: User name
 *         message:
 *           type: string
 *           description: Success message
 *     UserOrdersResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Success status
 *         data:
 *           type: object
 *           properties:
 *             userId:
 *               type: integer
 *               description: User ID
 *             orders:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Order ID
 *                   user_id:
 *                     type: integer
 *                     description: User ID
 *                   total_cents:
 *                     type: integer
 *                     description: Order total in cents
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     description: Order creation timestamp
 *             count:
 *               type: integer
 *               description: Number of orders
 *         message:
 *           type: string
 *           description: Success message
 *     UsersListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Success status
 *         data:
 *           type: object
 *           properties:
 *             users:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: User ID
 *                   email:
 *                     type: string
 *                   name:
 *                     type: string
 *             count:
 *               type: integer
 *               description: Number of users
 *         message:
 *           type: string
 *           description: Success message
 *     OrdersListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Success status
 *         data:
 *           type: object
 *           properties:
 *             orders:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Order ID
 *                   user_id:
 *                     type: integer
 *                     description: User ID
 *                   total_cents:
 *                     type: integer
 *                     description: Order total in cents
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     description: Order creation timestamp
 *                   user_email:
 *                     type: string
 *                     description: User email
 *                   user_name:
 *                     type: string
 *                     description: User name
 *             count:
 *               type: integer
 *               description: Number of orders
 *         message:
 *           type: string
 *           description: Success message
 *   parameters:
 *     UserId:
 *       name: id
 *       in: path
 *       required: true
 *       description: User ID (1-999999)
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 999999
 *     MessageId:
 *       name: messageId
 *       in: path
 *       required: true
 *       description: Message identifier
 *       schema:
 *         type: string
 *         minLength: 1
 *         maxLength: 100
 *   responses:
 *     ValidationError:
 *       description: Validation error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     InternalServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Health check and readiness endpoints
 *   - name: Status
 *     description: Message processing status endpoints
 *   - name: Users
 *     description: User management and activity endpoints
 *   - name: Orders
 *     description: Order management endpoints
 */

// This file is intentionally empty - it only contains JSDoc comments for Swagger
