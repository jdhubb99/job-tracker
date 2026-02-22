#!/bin/bash

# Docker development helper script for Job Tracker

case "$1" in
    "build")
        echo "Building Docker images..."
        docker compose build
        ;;
    "up")
        echo "Starting services..."
        docker compose up -d
        ;;
    "down")
        echo "Stopping services..."
        docker compose down
        ;;
    "logs")
        echo "Showing logs..."
        docker compose logs -f app
        ;;
    "logs-db")
        echo "Showing database logs..."
        docker compose logs -f postgres
        ;;
    "restart")
        echo "Restarting application..."
        docker compose restart app
        ;;
    "clean")
        echo "Cleaning up containers and volumes..."
        docker compose down -v
        docker system prune -f
        ;;
    "shell")
        echo "Opening shell in app container..."
        docker compose exec app sh
        ;;
    "db-shell")
        echo "Opening PostgreSQL shell..."
        docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
        ;;
    "status")
        echo "Service status:"
        docker compose ps
        ;;
    *)
        echo "Usage: $0 {build|up|down|logs|logs-db|restart|clean|shell|db-shell|status}"
        echo ""
        echo "Commands:"
        echo "  build     - Build Docker images"
        echo "  up        - Start all services"
        echo "  down      - Stop all services"
        echo "  logs      - Show application logs"
        echo "  logs-db   - Show database logs"
        echo "  restart   - Restart application"
        echo "  clean     - Clean up containers and volumes"
        echo "  shell     - Open shell in app container"
        echo "  db-shell  - Open PostgreSQL shell"
        echo "  status    - Show service status"
        exit 1
        ;;
esac
