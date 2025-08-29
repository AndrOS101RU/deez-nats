import { connect, StringCodec, AckPolicy, DeliverPolicy, ConnectionOptions, JsMsg } from 'nats';
import { flushBatch } from './batching.js';
import { config } from './config.js';
import { LOG_MESSAGES } from './constants/logMessages.js';

// Connection retry logic
async function connectWithRetry(
    connectionOptions: ConnectionOptions,
    maxRetries: number = 5
): Promise<any> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(LOG_MESSAGES.WORKER_CONNECTING_NATS, { attempt, maxRetries });
            const nc = await connect(connectionOptions);
            console.log(LOG_MESSAGES.WORKER_CONNECTED_NATS);
            return nc;
        } catch (error: any) {
            lastError = error;
            console.log(LOG_MESSAGES.WORKER_CONNECTING_NATS_FAILED, {
                attempt,
                error: error.message,
            });

            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
                console.log(LOG_MESSAGES.WORKER_RETRYING, { delay });
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    throw new Error(
        LOG_MESSAGES.WORKER_CONNECTING_NATS_FAILED.replace('{error}', lastError.message)
    );
}

// Stream readiness validation
async function validateStreams(jsm: any): Promise<void> {
    const requiredStreams = ['SQL_LP', 'USER_ACTIVITY'];
    const maxRetries = config.STREAM_VALIDATION_MAX_RETRIES;
    const retryIntervalMs = config.STREAM_VALIDATION_RETRY_INTERVAL_MS;
    let retries = 0;

    console.log(LOG_MESSAGES.WORKER_STREAM_VALIDATION);

    while (retries < maxRetries) {
        try {
            // Use a more direct approach to list streams
            const streams = await jsm.streams.list();
            const streamNames: string[] = [];

            // Iterate through the streams
            for await (const stream of streams) {
                if (stream.config && stream.config.name) {
                    streamNames.push(stream.config.name);
                }
            }

            console.log(`Found streams: ${streamNames.join(', ')}`);

            const missingStreams = requiredStreams.filter((name) => !streamNames.includes(name));

            if (missingStreams.length === 0) {
                console.log(LOG_MESSAGES.WORKER_STREAMS_READY, { streams: requiredStreams });
                return;
            }

            console.log(LOG_MESSAGES.WORKER_STREAMS_WAITING, {
                streams: missingStreams.join(', '),
                retry: retries + 1,
                maxRetries,
            });
        } catch (error) {
            console.log(LOG_MESSAGES.WORKER_STREAM_VALIDATION_FAILED, {
                retry: retries + 1,
                maxRetries,
                error,
            });
        }

        retries++;
        await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
    }

    throw new Error(
        LOG_MESSAGES.WORKER_STREAM_TIMEOUT.replace('{streams}', requiredStreams.join(', '))
    );
}

async function main() {
    const servers = config.NATS_URL.split(',');
    console.log(LOG_MESSAGES.WORKER_STARTED, { servers: servers.join(', ') });

    const connectionOptions: ConnectionOptions = {
        servers,
        reconnect: true,
        maxReconnectAttempts: -1,
        reconnectTimeWait: 1000,
        timeout: config.NATS_CONNECTION_TIMEOUT_MS,
        pingInterval: config.NATS_PING_INTERVAL_MS,
        maxPingOut: 3,
    };

    // Connect with retry logic
    const nc = await connectWithRetry(connectionOptions);

    // Wait a moment for the connection to stabilize
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Retry JetStream manager creation
    let jsm: any;
    let retries = 0;
    const maxJsmRetries = 10;

    while (retries < maxJsmRetries) {
        try {
            console.log(LOG_MESSAGES.WORKER_JETSTREAM_MANAGER_CREATION, {
                attempt: retries + 1,
                maxAttempts: maxJsmRetries,
            });
            jsm = await nc.jetstreamManager();
            console.log(LOG_MESSAGES.WORKER_JETSTREAM_MANAGER_CREATED);
            break;
        } catch (error: any) {
            retries++;
            console.log(LOG_MESSAGES.WORKER_JETSTREAM_MANAGER_CREATION_FAILED, {
                attempt: retries,
                maxAttempts: maxJsmRetries,
                error: error.message,
            });

            if (retries >= maxJsmRetries) {
                throw new Error(
                    LOG_MESSAGES.WORKER_JETSTREAM_MANAGER_CREATION_FAILED.replace(
                        '{error}',
                        error.message
                    )
                );
            }

            // Wait before retrying
            const delay = Math.min(2000 * retries, 10000); // Progressive delay, max 10s
            console.log(LOG_MESSAGES.WORKER_RETRYING, { delay });
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    const js = nc.jetstream();
    const sc = StringCodec();

    // Validate that required streams are ready before proceeding
    await validateStreams(jsm);

    // Define consumer configuration
    const consumerConfig = {
        durable_name: 'sql-batcher-consumer',
        ack_policy: AckPolicy.Explicit,
        max_deliver: 3,
        filter_subject: 'sql.lp.v1.>',
        deliver_policy: DeliverPolicy.All,
        deliver_group: 'sql-batcher',
        max_ack_pending: config.BATCH_MAX * 2,
    };

    try {
        // Create or retrieve the consumer
        await jsm.consumers.add('SQL_LP', consumerConfig);
        console.log(LOG_MESSAGES.WORKER_CONSUMER_CREATED);
    } catch (error: any) {
        if (error.code === 'JETSTREAM_CONSUMER_NAME_ALREADY_IN_USE') {
            console.log(LOG_MESSAGES.WORKER_CONSUMER_EXISTS);
        } else {
            console.error(LOG_MESSAGES.WORKER_CONSUMER_ERROR, { error });
            throw error;
        }
    }

    // Subscribe to different statement types using the modern consume() API
    const subscriptions = [
        { subject: 'sql.lp.v1.userById', key: 'userById' },
        { subject: 'sql.lp.v1.ordersByUser', key: 'ordersByUser' },
        { subject: 'sql.lp.v1.createUser', key: 'createUser' },
        { subject: 'user.activity', key: 'logUserActivity' },
    ];

    // Create separate batches for each subscription type
    const batches = new Map<string, JsMsg[]>();
    const batchTimeouts = new Map<string, NodeJS.Timeout | null>();

    // Initialize batches
    for (const { key } of subscriptions) {
        batches.set(key, []);
        batchTimeouts.set(key, null);
    }

    const processBatch = async (key: string) => {
        const batch = batches.get(key);
        if (batch && batch.length > 0) {
            console.log(LOG_MESSAGES.WORKER_PROCESSING_BATCH, { key, count: batch.length });
            await flushBatch(key, batch, sc);
            batches.set(key, []);
        }
        if (batchTimeouts.get(key)) {
            clearTimeout(batchTimeouts.get(key)!);
            batchTimeouts.set(key, null);
        }
    };

    for (const { subject, key } of subscriptions) {
        console.log(LOG_MESSAGES.WORKER_SETUP_CONSUMER, { subject, key });

        // Use the consume() API with the consumer
        const consumer = await js.consumers.get('SQL_LP', consumerConfig.durable_name);

        (async () => {
            // Use the consume() API for message processing
            await consumer.consume({
                max_messages: config.BATCH_MAX,
                callback: async (msg: JsMsg) => {
                    // Route message to the correct batch based on subject
                    const messageSubject = msg.subject;
                    let targetKey = key;

                    // Find the correct key for this message subject
                    for (const sub of subscriptions) {
                        if (messageSubject === sub.subject) {
                            targetKey = sub.key;
                            break;
                        }
                    }

                    console.log(LOG_MESSAGES.WORKER_ROUTING_MESSAGE, {
                        subject: messageSubject,
                        targetKey,
                    });

                    const batch = batches.get(targetKey);
                    if (batch) {
                        batch.push(msg);

                        // Process batch if it reaches max size
                        if (batch.length >= config.BATCH_MAX) {
                            await processBatch(targetKey);
                        } else if (batchTimeouts.get(targetKey) === null) {
                            // Set timeout for batch window
                            const timeout = setTimeout(
                                () => processBatch(targetKey),
                                config.BATCH_WINDOW_MS
                            );
                            batchTimeouts.set(targetKey, timeout);
                        }
                    }
                },
            });
        })().catch(console.error);
    }

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log(LOG_MESSAGES.WORKER_SHUTDOWN);
        await nc.drain();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log(LOG_MESSAGES.WORKER_SHUTDOWN);
        await nc.drain();
        process.exit(0);
    });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
