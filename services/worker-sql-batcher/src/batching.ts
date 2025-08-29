import type { JsMsg } from 'nats';
import { StringCodec } from 'nats';
import { pool } from './db.js';
import type { Req } from './types.js';
import { config } from './config.js';
import { LOG_MESSAGES } from './constants/logMessages.js';

// These are now configured via environment variables
export const BATCH_MAX = config.BATCH_MAX;
export const BATCH_WINDOW_MS = config.BATCH_WINDOW_MS;

export async function flushBatch(key: string, batch: JsMsg[], sc: ReturnType<typeof StringCodec>) {
    const started = Date.now();
    console.log(LOG_MESSAGES.WORKER_PROCESSING_BATCH, { key, count: batch.length });

    const reqs: Req[] = batch.map((m) => JSON.parse(sc.decode(m.data)));
    console.log(LOG_MESSAGES.BATCH_PARSED, {
        count: reqs.length,
        requests: reqs.map((r) => ({ id: r.id, statementId: r.statementId })),
    });

    let resById: Record<string, any> = {};
    let error: string | null = null;

    try {
        // Test database connection first
        console.log(LOG_MESSAGES.DB_CONNECTION_TEST);
        const client = await pool.connect();
        console.log(LOG_MESSAGES.DB_CONNECTION_SUCCESS);

        try {
            if (key === 'userById') {
                console.log(LOG_MESSAGES.USER_LOOKUP);
                const ids = reqs.map((r) => r.params.id);
                console.log(LOG_MESSAGES.USER_LOOKUP_IDS, { ids });

                const query = `SELECT id, email, name FROM app.users WHERE id = ANY($1::int[])`;
                console.log(LOG_MESSAGES.DB_QUERY_EXECUTING, { query, params: [ids] });

                const { rows } = await client.query(query, [ids]);
                console.log(LOG_MESSAGES.DB_QUERY_RESULT, { count: rows.length, rows });

                // If users don't exist, create them for testing
                for (const id of ids) {
                    if (!rows.find((r) => r.id === id)) {
                        console.log(LOG_MESSAGES.USER_CREATE_TEST, { id });
                        const insertQuery = `INSERT INTO app.users (id, email, name) VALUES ($1, $2, $3) ON CONFLICT ON CONSTRAINT users_pkey DO NOTHING`;
                        await client.query(insertQuery, [
                            id,
                            `user${id}@example.com`,
                            `Test User ${id}`,
                        ]);
                        console.log(LOG_MESSAGES.USER_CREATED, { id });
                    }
                }

                // Now fetch the users (including newly created ones)
                const { rows: finalRows } = await client.query(query, [ids]);
                console.log(LOG_MESSAGES.DB_QUERY_RESULT, {
                    count: finalRows.length,
                    rows: finalRows,
                });

                const map = new Map<number, any>();
                for (const row of finalRows) map.set(row.id, row);
                for (const r of reqs) resById[r.id] = map.get(r.params.id) ?? null;

                console.log(LOG_MESSAGES.USER_PROCESSING_COMPLETE, { results: resById });
            } else if (key === 'ordersByUser') {
                console.log(LOG_MESSAGES.ORDERS_LOOKUP);
                const uids = reqs.map((r) => r.params.userId);
                console.log(LOG_MESSAGES.ORDERS_LOOKUP_IDS, { ids: uids });

                const query = `SELECT * FROM app.orders WHERE user_id = ANY($1::int[])`;
                console.log(LOG_MESSAGES.DB_QUERY_EXECUTING, { query, params: [uids] });

                const { rows } = await client.query(query, [uids]);
                console.log(LOG_MESSAGES.DB_QUERY_RESULT, { count: rows.length, rows });

                // If no orders exist, create some test orders
                if (rows.length === 0) {
                    console.log(LOG_MESSAGES.ORDERS_CREATE_TEST, { ids: uids });
                    for (const uid of uids) {
                        const insertQuery = `INSERT INTO app.orders (user_id, total_cents) VALUES ($1, $2)`;
                        await client.query(insertQuery, [
                            uid,
                            Math.floor(Math.random() * 1000) + 100,
                        ]);
                        console.log(LOG_MESSAGES.ORDERS_CREATED, { id: uid });
                    }

                    // Fetch the newly created orders
                    const { rows: finalRows } = await client.query(query, [uids]);
                    console.log(LOG_MESSAGES.DB_QUERY_RESULT, {
                        count: finalRows.length,
                        rows: finalRows,
                    });
                    rows.push(...finalRows);
                }

                const grouped = new Map<number, any[]>();
                for (const row of rows) {
                    if (!grouped.has(row.user_id)) grouped.set(row.user_id, []);
                    grouped.get(row.user_id)!.push(row);
                }
                for (const r of reqs) resById[r.id] = grouped.get(r.params.userId) ?? [];

                console.log(LOG_MESSAGES.ORDERS_PROCESSING_COMPLETE, { results: resById });
            } else if (key === 'logUserActivity') {
                console.log(LOG_MESSAGES.ACTIVITY_PROCESSING);
                // For activity logging, we don't need to return data, just acknowledge success
                for (const r of reqs) {
                    resById[r.id] = { success: true, message: 'Activity logged' };
                }
                console.log(LOG_MESSAGES.ACTIVITY_PROCESSING_COMPLETE, { results: resById });
            } else if (key === 'createUser') {
                console.log(LOG_MESSAGES.USER_CREATE_PROCESSING);
                for (const r of reqs) {
                    const { email, name } = r.params;

                    try {
                        // Check if user already exists
                        const existingUser = await client.query(
                            'SELECT id FROM app.users WHERE email = $1',
                            [email]
                        );

                        if (existingUser.rows.length > 0) {
                            resById[r.id] = {
                                success: false,
                                message: 'User with this email already exists',
                                email: email,
                            };
                        } else {
                            // Create new user
                            const result = await client.query(
                                'INSERT INTO app.users (email, name) VALUES ($1, $2) RETURNING id, email, name',
                                [email, name]
                            );

                            const user = result.rows[0];
                            resById[r.id] = {
                                success: true,
                                data: user,
                                message: 'User created successfully',
                            };
                        }
                    } catch (error: any) {
                        resById[r.id] = {
                            success: false,
                            message: 'Failed to create user',
                            error: error.message,
                        };
                    }
                }
                console.log(LOG_MESSAGES.USER_CREATE_PROCESSING_COMPLETE, { results: resById });
            } else {
                throw new Error(LOG_MESSAGES.UNKNOWN_STATEMENT);
            }

            // Log the processing results to worker_seen table
            console.log(LOG_MESSAGES.BATCH_LOGGING);
            for (const req of reqs) {
                const logQuery = `INSERT INTO app.worker_seen (id, statement_id, result) VALUES ($1, $2, $3)`;
                await client.query(logQuery, [req.id, req.id, JSON.stringify(resById[req.id])]);
                console.log(LOG_MESSAGES.BATCH_LOGGED, { id: req.id });
            }

            // Log the final results
            console.log(LOG_MESSAGES.BATCH_FINAL_RESULTS, { key, results: resById });
        } finally {
            client.release();
            console.log(LOG_MESSAGES.DB_CLIENT_RELEASED);
        }
    } catch (e: any) {
        error = e?.message ?? String(e);
        console.error(LOG_MESSAGES.BATCH_PROCESSING_ERROR, { key, error });
        console.error(LOG_MESSAGES.BATCH_STACK_TRACE, { stack: e?.stack });

        // Log the stack trace if available
        if (e?.stack) {
            console.error(LOG_MESSAGES.BATCH_STACK_TRACE, { stack: e.stack });
        }
    }

    const elapsed = Date.now() - started;
    console.log(LOG_MESSAGES.BATCH_TIMING, { key, time: elapsed });

    // For JetStream messages, we just acknowledge them
    // The response data is stored in resById for potential future use
    console.log(LOG_MESSAGES.BATCH_ACKNOWLEDGING, { count: batch.length });
    for (let i = 0; i < batch.length; i++) {
        const msg = batch[i];
        try {
            await msg.ack();
            console.log(LOG_MESSAGES.BATCH_ACK_SUCCESS, { index: i + 1 });
        } catch (ackError) {
            console.error(LOG_MESSAGES.BATCH_ACK_FAILED, { index: i + 1, error: ackError });
        }
    }

    console.log(LOG_MESSAGES.WORKER_BATCH_COMPLETE, { key });
}
