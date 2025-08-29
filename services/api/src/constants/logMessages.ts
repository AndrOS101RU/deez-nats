export const LOG_MESSAGES = {
    // API Server
    SERVER_START: 'Starting API server',
    SERVER_STARTED: 'API server started successfully',
    SERVER_SHUTDOWN: 'Received {signal}, starting graceful shutdown',
    SERVER_HTTP_CLOSED: 'HTTP server closed',
    SERVER_NATS_DRAINED: 'NATS connection drained',
    SERVER_FORCED_SHUTDOWN: 'Forced shutdown after timeout',

    // NATS
    NATS_CONNECTING: 'Connecting to NATS servers',
    NATS_CONNECTED: 'Successfully connected to NATS',
    NATS_CONNECTION_CLOSED: 'NATS connection closed with error',
    NATS_CONNECTION_GRACEFUL: 'NATS connection closed gracefully',
    NATS_CONNECTION_FAILED: 'Failed to connect to NATS',

    // Health Checks
    HEALTH_CHECK_START: 'Health check completed',
    HEALTH_NATS_CHECK_FAILED: 'NATS health check failed',
    HEALTH_DB_CHECK_FAILED: 'Database health check failed',
    READINESS_CHECK_FAILED: 'Readiness check failed',
    HEALTH_CHECK_COMPLETED: 'Health check completed',

    // API Endpoints
    REQUEST_INCOMING: 'Incoming request',
    USER_REQUEST_PROCESSING: 'Processing user request',
    USER_REQUEST_QUEUED: 'User request queued successfully',
    USER_REQUEST_FAILED: 'Failed to queue user request',
    USER_ACTIVITY_PROCESSING: 'Processing user activity',
    USER_ACTIVITY_QUEUED: 'User activity queued successfully',
    USER_ACTIVITY_FAILED: 'Failed to queue user activity',
    USER_ORDERS_PROCESSING: 'Processing user orders request',
    USER_ORDERS_QUEUED: 'User orders request queued successfully',
    USER_ORDERS_FAILED: 'Failed to queue user orders request',
    USER_CREATE_PROCESSING: 'Processing user creation request',
    USER_CREATE_QUEUED: 'User creation request queued successfully',
    USER_CREATE_FAILED: 'Failed to queue user creation request',

    // Status Endpoint
    STATUS_CHECKING: 'Checking message status',
    STATUS_NOT_FOUND: 'Message not found',
    STATUS_RETRIEVED: 'Message status retrieved',
    STATUS_CHECK_FAILED: 'Failed to check message status',

    // Direct Database Endpoints
    USER_DATA_REQUEST: 'Direct user data request',
    USER_NOT_FOUND: 'User not found',
    USER_DATA_RETRIEVED: 'User data retrieved successfully',
    USER_DATA_RETRIEVAL_FAILED: 'Failed to retrieve user data',
    USER_ORDERS_DATA_REQUEST: 'Direct user orders data request',
    USER_ORDERS_DATA_RETRIEVED: 'User orders data retrieved successfully',
    USER_ORDERS_DATA_RETRIEVAL_FAILED: 'Failed to retrieve user orders data',
    USERS_LIST_REQUEST: 'Users list request',
    USERS_LIST_RETRIEVED: 'Users list retrieved successfully',
    USERS_LIST_RETRIEVAL_FAILED: 'Failed to retrieve users list',
    USER_CREATE_REQUEST: 'User creation request',
    USER_CREATED_SUCCESSFULLY: 'User created successfully',
    USER_CREATION_FAILED: 'Failed to create user',
    USER_EMAIL_EXISTS: 'User with email already exists',
    ORDERS_LIST_REQUEST: 'Orders list request',
    ORDERS_LIST_RETRIEVED: 'Orders list retrieved successfully',
    ORDERS_LIST_RETRIEVAL_FAILED: 'Failed to retrieve orders list',

    // Validation
    VALIDATION_FAILED: 'Validation failed',
    BODY_VALIDATION_FAILED: 'Body validation failed',

    // Rate Limiting
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',

    // Error Handling
    UNHANDLED_ERROR: 'Unhandled error',
    ROUTE_NOT_FOUND: 'Route not found',
} as const;

export const ERROR_MESSAGES = {
    // API Errors
    FAILED_TO_START: 'Failed to start API server',
    VALIDATION_FAILED: 'Validation failed',
    INVALID_REQUEST_BODY: 'Invalid request body',
    ROUTE_NOT_FOUND: 'Route not found',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    TOO_MANY_REQUESTS: 'Too Many Requests',

    // NATS Errors
    NATS_CONNECTION_FAILED: 'Failed to connect to NATS',
    NATS_HEALTH_CHECK_FAILED: 'NATS health check failed',
    NATS_READINESS_CHECK_FAILED: 'NATS readiness check failed',

    // Database Errors
    DATABASE_HEALTH_CHECK_FAILED: 'Database health check failed',
    DATABASE_CONNECTION_FAILED: 'Database connection failed',

    // Message Processing
    MESSAGE_STATUS_CHECK_FAILED: 'Failed to check message status',
    USER_REQUEST_FAILED: 'Failed to queue user request',
    USER_ACTIVITY_FAILED: 'Failed to queue user activity',
    USER_ORDERS_FAILED: 'Failed to queue user orders request',
} as const;

export const SUCCESS_MESSAGES = {
    // API Responses
    REQUEST_QUEUED: 'Request queued for processing',
    ACTIVITY_LOGGED: 'Activity logged successfully',
    ORDERS_REQUEST_QUEUED: 'Orders request queued for processing',
    USER_CREATED: 'User created successfully',
    MESSAGE_PROCESSING: 'Message is still being processed or not found',
    STATUS_COMPLETED: 'completed',
    STATUS_PENDING: 'pending',
} as const;
