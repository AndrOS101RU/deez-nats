#!/usr/bin/env sh
set -e
: "${NATS_URL:=nats://n1:4222}"

echo "Creating SQL_LP stream..."
nats --server "$NATS_URL" str add SQL_LP \
  --subjects "sql.lp.v1.>" \
  --retention work \
  --storage file \
  --max-msgs=100000 --max-bytes=1073741824 --discard old --dupe-window 2m --replicas 3 --defaults || true

echo "Creating USER_ACTIVITY stream..."
nats --server "$NATS_URL" str add USER_ACTIVITY \
  --subjects "user.activity" \
  --retention work \
  --storage file \
  --max-msgs=1000000 --max-bytes=1073741824 --discard old --dupe-window 2m --replicas 3 --defaults || true

echo "Streams created successfully!"