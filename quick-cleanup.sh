#!/bin/bash

# Deez NATS - Quick Cleanup Script
# Fast cleanup without confirmation prompts

set -e

echo "🧹 Quick cleanup starting..."

# Stop and remove everything
echo "Stopping containers..."
docker-compose down -v --remove-orphans 2>/dev/null || true

echo "Removing all containers..."
docker rm -f $(docker ps -aq) 2>/dev/null || true

echo "Removing all images..."
docker rmi -f $(docker images -q) 2>/dev/null || true

echo "Removing all volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || true

echo "Cleaning Docker system..."
docker system prune -af

echo "Removing project artifacts..."
rm -rf services/*/dist services/*/node_modules services/*/logs infra/nats/nats-data 2>/dev/null || true

echo "✅ Quick cleanup completed!"
echo "To start fresh: make up"
