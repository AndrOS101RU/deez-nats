export const LOG_MESSAGES = {
    // Worker Service
    WORKER_STARTED: 'Worker SQL Batcher started',
    WORKER_CONNECTING_NATS: 'Attempting to connect to NATS (attempt {attempt}/{maxRetries})...',
    WORKER_CONNECTED_NATS: 'Connected to NATS servers',
    WORKER_CONNECTING_NATS_FAILED: 'Connection attempt {attempt} failed: {error}',
    WORKER_CONSUMER_CREATED: 'Consumer created/retrieved successfully',
    WORKER_CONSUMER_EXISTS: 'Consumer already exists, using existing consumer',
    WORKER_CONSUMER_ERROR: 'Error creating consumer',
    WORKER_SETUP_CONSUMER: 'Setting up consumer for {subject} with key {key}',
    WORKER_ROUTING_MESSAGE: 'Routing message from {subject} to {key} batch',
    WORKER_PROCESSING_BATCH: 'Starting batch processing for {key} with {count} messages',
    WORKER_BATCH_COMPLETE: 'Batch processing for {key} fully complete!',
    WORKER_SHUTDOWN: 'Shutting down...',
    WORKER_STREAM_VALIDATION: 'Validating required streams...',
    WORKER_STREAMS_READY: 'All required streams are ready: {streams}',
    WORKER_STREAMS_WAITING: 'Waiting for streams: {streams}. Retry {retry}/{maxRetries}',
    WORKER_STREAMS_WAITING_NOTE: 'Streams list not yet available',
    WORKER_STREAM_VALIDATION_FAILED:
        'Stream validation attempt {retry}/{maxRetries} failed: {error}',
    WORKER_STREAM_TIMEOUT: 'Timeout waiting for required streams: {streams}',
    WORKER_JETSTREAM_MANAGER_CREATION:
        'Attempting to create JetStream manager (attempt {attempt}/{maxAttempts})...',
    WORKER_JETSTREAM_MANAGER_CREATION_FAILED:
        'JetStream manager creation attempt {attempt}/{maxAttempts} failed: {error}',
    WORKER_RETRYING: 'Retrying in {delay}ms...',
    WORKER_JETSTREAM_MANAGER_CREATED: 'Successfully created JetStream manager',

    // Database Operations
    DB_CONNECTION_TEST: 'Testing database connection...',
    DB_CONNECTION_SUCCESS: 'Database connection successful',
    DB_CLIENT_RELEASED: 'Database client released',
    DB_QUERY_EXECUTING: 'Executing query: {query} with params: {params}',
    DB_QUERY_RESULT: 'Query returned {count} rows: {rows}',

    // User Operations
    USER_LOOKUP: 'Processing userById batch...',
    USER_LOOKUP_IDS: 'Looking up users with IDs: {ids}',
    USER_CREATE_TEST: 'Creating test user with ID {id}...',
    USER_CREATED: 'Created test user {id}',
    USER_PROCESSING_COMPLETE: 'userById processing complete. Results: {results}',
    USER_CREATE_PROCESSING: 'Processing createUser batch...',
    USER_CREATE_PROCESSING_COMPLETE: 'createUser processing complete. Results: {results}',

    // Orders Operations
    ORDERS_LOOKUP: 'Processing ordersByUser batch...',
    ORDERS_LOOKUP_IDS: 'Looking up orders for user IDs: {ids}',
    ORDERS_CREATE_TEST: 'Creating test orders for users: {ids}',
    ORDERS_CREATED: 'Created test order for user {id}',
    ORDERS_PROCESSING_COMPLETE: 'ordersByUser processing complete. Results: {results}',

    // Activity Operations
    ACTIVITY_PROCESSING: 'Processing logUserActivity batch...',
    ACTIVITY_PROCESSING_COMPLETE: 'logUserActivity processing complete. Results: {results}',

    // Batch Processing
    BATCH_PARSED: 'Parsed {count} requests: {requests}',
    BATCH_LOGGING: 'Logging batch results to worker_seen table...',
    BATCH_LOGGED: 'Logged result for {id}',
    BATCH_FINAL_RESULTS: 'Final batch results for {key}: {results}',
    BATCH_ACKNOWLEDGING: 'Acknowledging {count} messages...',
    BATCH_ACK_SUCCESS: 'Message {index} acknowledged successfully',
    BATCH_ACK_FAILED: 'Failed to acknowledge message {index}: {error}',
    BATCH_TIMING: 'Batch processing for {key} completed in {time}ms',

    // Errors
    BATCH_PROCESSING_ERROR: 'Error processing batch for {key}: {error}',
    BATCH_STACK_TRACE: 'Stack trace: {stack}',
    UNKNOWN_STATEMENT: 'Unknown statementId {key}',
} as const;

export const ERROR_MESSAGES = {
    // Consumer Errors
    CONSUMER_ALREADY_EXISTS: 'JETSTREAM_CONSUMER_NAME_ALREADY_IN_USE',
    CONSUMER_CREATION_FAILED: 'Error creating consumer',

    // Database Errors
    DB_CONNECTION_FAILED: 'Database connection failed',
    DB_QUERY_FAILED: 'Database query failed',
    DB_CLIENT_RELEASE_FAILED: 'Failed to release database client',

    // Processing Errors
    UNKNOWN_STATEMENT_ID: 'Unknown statementId {id}',
    BATCH_PROCESSING_FAILED: 'Batch processing failed',
    MESSAGE_ACKNOWLEDGMENT_FAILED: 'Message acknowledgment failed',

    // NATS Errors
    NATS_CONNECTION_FAILED: 'NATS connection failed',
    NATS_TIMEOUT: 'NATS operation timeout',
} as const;

export const SUCCESS_MESSAGES = {
    // Batch Processing
    BATCH_PROCESSING_SUCCESS: 'Batch processing completed successfully',
    MESSAGE_ACKNOWLEDGMENT_SUCCESS: 'Message acknowledged successfully',

    // Database Operations
    DB_OPERATION_SUCCESS: 'Database operation completed successfully',
    DB_CONNECTION_SUCCESS: 'Database connection established',

    // Consumer Operations
    CONSUMER_OPERATION_SUCCESS: 'Consumer operation completed successfully',
} as const;
