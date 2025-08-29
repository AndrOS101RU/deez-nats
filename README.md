# Deez NATS - Microservices with NATS JetStream

A template microservices architecture using NATS JetStream for message queuing and PostgreSQL for data persistence with batched SQL processing, written in TypeScript and ran on Docker.

## Features

-   **NATS JetStream Cluster**: High-availability message queuing with fault tolerance
-   **TypeScript API**: Fully typed REST API with comprehensive validation
-   **Batch Processing**: Efficient SQL batching for high-throughput operations
-   **Health Monitoring**: Built-in health checks and status endpoints
-   **Rate Limiting**: Protection against API abuse
-   **Structured Logging**: Winston-based logging with file rotation
-   **API Documentation**: Interactive Swagger/OpenAPI documentation

## Prerequisites

-   **Docker**: Version 20.10+ with Docker Compose
-   **Node.js**: Version 18+ (for local development)
-   **Memory**: At least 4GB RAM available for Docker containers
-   **Ports**: 3000 (API), 4222 (NATS), 5432 (PostgreSQL) must be available

## Setup

### 1. Clone and Setup

```bash
git clone <repository-url>
cd deez-nats
cp env.example .env
```

### 2. Start Services

```bash
make up
```

### 3. Verify Setup

```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
```

## Testing

### Swagger UI Testing (Recommended)

1. **Open Swagger UI**: http://localhost:3000/api-docs
2. **Click on any endpoint** (e.g., `GET /user/{id}`)
3. **Click "Try it out"**
4. **Fill in parameters** and request body
5. **Click "Execute"** to test

### Command Line Testing

```bash
# Seed test data
docker compose exec postgres psql -U app -d app -c "INSERT INTO app.users (email,name) VALUES ('test@example.com','Test User') ON CONFLICT DO NOTHING;"

# Test endpoints
curl http://localhost:3000/user/1
curl -X POST http://localhost:3000/user/1/activity -H "Content-Type: application/json" -d '{"activity": "login"}'
curl http://localhost:3000/status/{messageId}"
```

## Cleanup/Uninstall

### Quick Cleanup

```bash
# Stop all services
make down

# Quick cleanup without prompts
./quick-cleanup.sh
```

### Complete Cleanup

```bash
# Interactive cleanup with confirmation (recommended)
./cleanup.sh
```

**What gets cleaned:**

-   All Docker containers, images, and volumes
-   Build cache and artifacts
-   Database data and NATS streams
-   Logs and node_modules

## Configuration

### Environment Variables

| Variable       | Description                  | Default                 |
| -------------- | ---------------------------- | ----------------------- |
| `NATS_URL`     | NATS server URLs             | `nats://localhost:4222` |
| `DATABASE_URL` | PostgreSQL connection string | Required                |
| `PORT`         | API server port              | `3000`                  |
| `LOG_LEVEL`    | Logging level                | `info`                  |

## Monitoring

### Health Endpoints

-   `GET /health` - Overall system health
-   `GET /health/ready` - Readiness check
-   `GET /status/:messageId` - Message processing status

### Logs

```bash
# View all logs
make logs

# View specific service logs
docker compose logs -f api
docker compose logs -f worker-sql-batcher
```

## Development

### Local Development

```bash
cd services/api
yarn install
yarn dev
```

### Building

```bash
yarn build
yarn start
```

## Commands Reference

```bash
make up          # Start all services
make down        # Stop all services
make logs        # View all logs
make psql        # Connect to PostgreSQL
make streams     # Create NATS streams
make swagger     # Show Swagger URLs
make test-swagger # Test Swagger documentation
```

## License

MIT License
