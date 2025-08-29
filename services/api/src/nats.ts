import { connect, StringCodec, createInbox, ConnectionOptions } from 'nats';
import { config } from './config.js';
import logger from './logger.js';
import { LOG_MESSAGES } from './constants/logMessages.js';

export async function makeNats() {
    const sc = StringCodec();
    const servers = config.NATS_URL.split(',');

    logger.info(LOG_MESSAGES.NATS_CONNECTING, { servers });

    const connectionOptions: ConnectionOptions = {
        servers,
        reconnect: true,
        maxReconnectAttempts: -1,
        reconnectTimeWait: 1000,
        timeout: config.NATS_TIMEOUT_MS,
        pingInterval: 20000,
        maxPingOut: 3,
    };

    try {
        const nc = await connect(connectionOptions);
        const js = nc.jetstream();

        // NATS connection events
        nc.closed().then((err) => {
            if (err) {
                logger.error(LOG_MESSAGES.NATS_CONNECTION_CLOSED, { error: err.message });
            } else {
                logger.info(LOG_MESSAGES.NATS_CONNECTION_CLOSED);
            }
        });

        logger.info(LOG_MESSAGES.NATS_CONNECTED, {
            status: nc.status,
            servers: servers.length,
        });

        return { nc, js, sc, createInbox };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(LOG_MESSAGES.NATS_CONNECTION_FAILED, { error: errorMessage, servers });
        throw error;
    }
}
