.PHONY: up down logs nats streams psql swagger

up:
	docker compose up --build -d
	docker compose logs -f --no-color --tail=100 api worker-sql-batcher

down:
	docker compose down -v

logs:
	docker compose logs -f --no-color

psql:
	docker compose exec -it postgres psql -U app -d app

streams:
	docker compose exec nats-init sh -lc "/create_streams.sh"

swagger:
	@echo "Swagger Documentation URLs:"
	@echo "	Interactive UI: http://localhost:3000/api-docs"
	@echo "	OpenAPI Spec:  http://localhost:3000/api-docs.json"
	@echo ""
	@echo "To test the documentation:"