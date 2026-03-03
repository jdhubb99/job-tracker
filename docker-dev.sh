#!/bin/bash

# Docker development helper script for Job Tracker

COMPOSE_FILES=(-f docker-compose.yml)
DEBUG_COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.debug.yml)

case "$1" in
    "build")
        echo "Building Docker images..."
        docker compose "${COMPOSE_FILES[@]}" build
        ;;
    "up")
        echo "Starting services..."
        docker compose "${COMPOSE_FILES[@]}" up -d
        ;;
    "debug-up")
        echo "Starting services in debug mode (JVM will wait for debugger on port 5005)..."
        docker compose "${DEBUG_COMPOSE_FILES[@]}" up -d --build
        ;;
    "down")
        echo "Stopping services..."
        docker compose "${COMPOSE_FILES[@]}" down
        docker compose "${DEBUG_COMPOSE_FILES[@]}" down >/dev/null 2>&1 || true
        ;;
    "logs")
        echo "Showing logs..."
        docker compose "${COMPOSE_FILES[@]}" logs -f app
        ;;
    "logs-debug")
        echo "Showing logs (debug mode)..."
        docker compose "${DEBUG_COMPOSE_FILES[@]}" logs -f app
        ;;
    "logs-db")
        echo "Showing database logs..."
        docker compose "${COMPOSE_FILES[@]}" logs -f postgres
        ;;
    "restart")
        echo "Restarting application..."
        docker compose "${COMPOSE_FILES[@]}" restart app
        ;;
    "debug-restart")
        echo "Restarting application in debug mode..."
        docker compose "${DEBUG_COMPOSE_FILES[@]}" restart app
        ;;
    "clean")
        echo "Cleaning up containers and volumes..."
        docker compose "${COMPOSE_FILES[@]}" down -v
        docker compose "${DEBUG_COMPOSE_FILES[@]}" down -v >/dev/null 2>&1 || true
        docker system prune -f
        ;;
    "shell")
        echo "Opening shell in app container..."
        docker compose "${COMPOSE_FILES[@]}" exec app sh
        ;;
    "db-shell")
        echo "Opening PostgreSQL shell..."
        docker compose "${COMPOSE_FILES[@]}" exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
        ;;
    "status")
        echo "Service status:"
        docker compose "${COMPOSE_FILES[@]}" ps
        ;;
    *)
        echo "Usage: $0 {build|up|debug-up|down|logs|logs-debug|logs-db|restart|debug-restart|clean|shell|db-shell|status}"
        echo ""
        echo "Commands:"
        echo "  build     - Build Docker images"
        echo "  up        - Start all services"
        echo "  debug-up  - Start services with JDWP enabled (waits for debugger on :5005)"
        echo "  down      - Stop all services"
        echo "  logs      - Show application logs"
        echo "  logs-debug - Show application logs (debug mode)"
        echo "  logs-db   - Show database logs"
        echo "  restart   - Restart application"
        echo "  debug-restart - Restart application in debug mode"
        echo "  clean     - Clean up containers and volumes"
        echo "  shell     - Open shell in app container"
        echo "  db-shell  - Open PostgreSQL shell"
        echo "  status    - Show service status"
        exit 1
        ;;
esac
