# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Job Tracker is a full-stack application with a Spring Boot backend and Vite + React frontend, orchestrated with Docker Compose and backed by PostgreSQL.

## Common Commands

### Backend (run from `backend/`)
```bash
./gradlew build           # Build the project
./gradlew bootRun         # Run the application (needs PostgreSQL running)
./gradlew test            # Run all tests (uses Testcontainers - requires Docker)
./gradlew test --tests "com.jhub.backend.SomeTest"  # Run a single test class
./gradlew clean build     # Clean and rebuild
```

### Frontend (run from `frontend/`)
```bash
bun install               # Install dependencies
bun run dev               # Start Vite dev server (port 3000)
bun run build             # Type-check and production build
bun run preview           # Preview production build
bun run lint              # ESLint
```

### Docker (run from project root)
```bash
./docker-dev.sh up        # Start backend + PostgreSQL
./docker-dev.sh down      # Stop all services
./docker-dev.sh build     # Rebuild images (required after code changes)
./docker-dev.sh logs      # Application logs
./docker-dev.sh db-shell  # PostgreSQL shell
./docker-dev.sh clean     # Remove containers and volumes
```

## Architecture

### Backend (`backend/`)
- **Spring Boot 3.5.6** on **Java 25**, built with **Gradle 9.1.0** (Kotlin DSL)
- Layered architecture: Controllers → Services → Repositories → Models
- Package: `com.jhub.backend` with subpackages: `controller/`, `service/`, `repository/`, `model/`, `dto/`, `config/`
- DTOs use Java Records with static factory methods
- Spring Data JPA with Hibernate for persistence
- Bean Validation (JSR-303) for input validation

### Frontend (`frontend/`)
- **Vite 7** SPA with **React 19**, **TypeScript 5.9**, **Tailwind CSS 4** (via `@tailwindcss/vite`)
- Path alias: `@/*` maps to `./src/*` (via `vite-tsconfig-paths`)
- ESLint 9 flat config with `typescript-eslint`, `react-hooks`, `react-refresh` plugins
- Dev server on port 3000 with `/api/*` proxied to Spring Boot at `localhost:8080`
- Source entry point: `src/main.tsx`

### Database
- **PostgreSQL 18** (alpine in Docker)
- Default credentials: `postgres`/`postgres`, database: `jobtracker`
- Schema managed by Hibernate DDL auto-update (no migration tool yet)

### Configuration Profiles
- **default** (`application.yml`): Local development, connects to `localhost:5432`, debug logging
- **docker** (`application-docker.yml`): Docker environment, connects to `postgres:5432`, HikariCP pool tuning, WARN logging
- **test**: Uses Testcontainers with a disposable PostgreSQL instance (`TestContainersConfig.java`)

### API Base Path
All REST endpoints are under `/api/`. Health check: `GET /api/health`, `GET /api/health/ping`. Actuator at `/actuator/health`.

## Code Conventions (Backend)

- Use constructor injection (not field injection)
- PascalCase for classes, camelCase for methods/variables, ALL_CAPS for constants
- Use `@ControllerAdvice` and `@ExceptionHandler` for exception handling
- Use Java Records for DTOs
- Write tests with JUnit 5; use `@SpringBootTest` for integration tests, `@DataJpaTest` for repository tests, `MockMvc` for controller tests
- Testcontainers manages test database lifecycle — Docker must be running to execute tests
