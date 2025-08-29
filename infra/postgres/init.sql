CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.users (
  id    SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name  TEXT
);

CREATE TABLE IF NOT EXISTS app.orders (
  id       SERIAL PRIMARY KEY,
  user_id  INT NOT NULL REFERENCES app.users(id),
  total_cents INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotency cache for workers (optional)
CREATE TABLE IF NOT EXISTS app.worker_seen (
  id TEXT PRIMARY KEY,
  statement_id TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS worker_seen_created_at_idx ON app.worker_seen(created_at);