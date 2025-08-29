#!/usr/bin/env sh
set -e

echo "Waiting for NATS streams to be created..."

until nats --server "$NATS_URL" str ls | grep -q "SQL_LP"; do
    echo "Waiting for SQL_LP stream..."
    sleep 2
done

until nats --server "$NATS_URL" str ls | grep -q "USER_ACTIVITY"; do
    echo "Waiting for USER_ACTIVITY stream..."
    sleep 2
done

echo "All required streams are available!"
