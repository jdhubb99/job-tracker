# Job Tracker

A full-stack job tracking application built with Spring Boot backend and modern frontend technologies.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Backend Architecture](#backend-architecture)
- [API Documentation](#api-documentation)
- [Docker Setup](#docker-setup)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# Clone and start with Docker
cd jobtracker
cp .env.example .env
./docker-dev.sh up

# Access the application
# Backend API: http://localhost:8080
# Database: localhost:5432
```

## Prerequisites

### Required Software

- **Java 25+** (for backend development)
- **Docker & Docker Compose** (recommended for full stack)
- **Git**

### Optional (for local development)

- **PostgreSQL 18+** (if not using Docker)
- **Node.js 22+** and **Bun** (for frontend development)

## Development Setup

### Option 1: Docker (Recommended)

The easiest way to get started is using Docker Compose, which will set up both the backend and database services.

```bash
# Clone repository
cd jobtracker
cp .env.example .env

# Start all services (backend + PostgreSQL)
./docker-dev.sh up

# View logs
./docker-dev.sh logs

# Stop services
./docker-dev.sh down
```

### Option 2: Local Development

#### 1. Database Setup

```bash
# Start PostgreSQL (example with local installation)
sudo systemctl start postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE jobtracker;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE jobtracker TO postgres;
\q
```

#### 2. Backend Development
```bash
cd backend

# Build the project
./gradlew build

# Run the application
./gradlew bootRun

# Or run with specific profile
./gradlew bootRun --args='--spring.profiles.active=dev'
```

#### 3. Environment Variables (Required)
```bash
# Copy baseline values, then edit for your environment
cp ../.env.example ../.env

# Or export directly in your shell:
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=jobtracker
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export JWT_SECRET=replace-with-a-32-byte-minimum-secret
export JWT_EXPIRATION=PT24H
export CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
bun install

# Start Vite dev server (port 3000, proxies /api to backend)
bun run dev

# Production build (type-checks then builds to dist/)
bun run build
```

## Backend Architecture

### Technology Stack
- **Framework**: Spring Boot 4.x
- **Language**: Java 25
- **Build Tool**: Gradle with Kotlin DSL
- **Database**: PostgreSQL 18
- **ORM**: Spring Data JPA with Hibernate (`ddl-auto: validate`)
- **Migrations**: Flyway SQL migrations (`backend/src/main/resources/db/migration`)
- **Testing**: JUnit 5, Spring Boot Test, Testcontainers

### Architecture Patterns

#### 1. Layered Architecture
```
┌─────────────────┐
│   Controllers   │ ← REST API Layer
├─────────────────┤
│    Services     │ ← Business Logic Layer
├─────────────────┤
│  Repositories   │ ← Data Access Layer
├─────────────────┤
│    Models       │ ← Domain Entities
└─────────────────┘
```

#### 2. Domain-Driven Design Elements

**Entities**
- `User`: User account and profile information
- `JobApplication`: Job application tracking with status management
- `Note`: Application-specific notes and follow-up tracking

**Services**
- Business logic encapsulation
- Transaction management
- Data validation and transformation

### Current Project Structure

```text
backend/src/main/java/com/jhub/backend/
├── config/              # Configuration classes
├── controller/          # REST controllers
├── dto/                 # Data transfer objects
├── model/               # JPA entities
│   └── enums/          # Domain enums
├── repository/          # Data access layer
└── service/             # Business logic layer
```

### Service Layer Design

The `JobApplicationService` demonstrates clean architecture principles:

- **CRUD Operations**: Full create, read, update, delete functionality
- **User Ownership Validation**: Ensures users can only access their own data
- **DTO Mapping**: Clean separation between entities and API contracts
- **Error Handling**: Consistent exception handling with meaningful messages

#### Key Service Methods

- `getAllApplicationsForUser(UUID userId)`
- `getApplicationsByStatus(UUID userId, JobApplicationStatus status)`
- `getApplicationById(UUID userId, UUID applicationId)`
- `createApplication(UUID userId, JobApplicationCreateRequest request)`
- `updateApplication(UUID userId, UUID applicationId, JobApplicationUpdateRequest request)`
- `deleteApplication(UUID userId, UUID applicationId)`

### Data Access Patterns

**Repositories** (`@Repository`)
- Data access abstraction
- Spring Data JPA repositories
- Custom query methods

**Models** (`@Entity`)
- JPA entities for database mapping
- Bean validation annotations
- Relationship mappings

**DTOs** (Data Transfer Objects)
- Immutable data structures using Java Records
- API request/response models
- Data transformation layer

### Configuration Management

#### Profiles
- **default**: Local development configuration
- **docker**: Containerized environment configuration
- **test**: Testing environment configuration

#### Key Configuration Files
- `application.yml`: Base configuration
- `application-docker.yml`: Docker-specific settings
- `application-test.yml`: Test profile configuration
- Environment variables for sensitive data

## API Documentation

### Health Check Endpoints

#### GET `/api/health`
Returns detailed health status of the application.

**Response:**
```json
{
  "status": "UP",
  "message": "Job Tracker Backend is running",
  "timestamp": "2024-01-15T10:30:45.123"
}
```

#### GET `/api/health/ping`
Simple connectivity test endpoint.

**Response:**
```
pong
```

## Docker Setup

### Development Environment

The project includes a complete Docker setup for development:

```yaml
services:
  postgres:
    image: postgres:18
    ports: ["5432:5432"]

  backend:
    build: ./backend
    ports: ["8080:8080"]
    depends_on: [postgres]
```

### Docker Commands

```bash
# Start services
./docker-dev.sh up

# Rebuild and start
./docker-dev.sh build
./docker-dev.sh up

# Stop services
./docker-dev.sh down

# View logs
./docker-dev.sh logs

# Execute command in backend container
./docker-dev.sh shell
```

## Code Style & Formatting

Formatting is enforced automatically via pre-commit hooks (Lefthook) and CI checks.

### One-time setup

Install git hooks after cloning by running `bun install` from the repo root:

```bash
bun install   # installs lefthook and runs `lefthook install` automatically
```

### Frontend (Prettier + ESLint)

```bash
cd frontend

# Auto-fix all files
bun run format

# Check formatting without writing (used in CI)
bun run format:check

# Lint
bun run lint
```

The pre-commit hook automatically runs Prettier on staged `.ts/.tsx/.js/.css/.json` files and re-stages them, then runs ESLint. A commit is blocked if ESLint reports any errors or warnings.

### Backend (Spotless + Google Java Format)

```bash
cd backend

# Auto-fix all Java files
./gradlew spotlessApply

# Check formatting without writing (used in CI and pre-commit hook)
./gradlew spotlessCheck
```

The pre-commit hook runs `spotlessCheck` whenever `.java` files are staged. If it fails, run `spotlessApply` to fix, then re-stage and commit.

### Editor config

A root `.editorconfig` sets charset, line endings, and indentation for all editors. Most editors pick this up automatically.

## Contributing

### Development Workflow

1. Create feature branch from `main`
2. Make changes with appropriate tests
3. Ensure all tests pass
4. Submit pull request

### Code Standards

- Follow Java naming conventions
- Write comprehensive tests for business logic
- Use meaningful commit messages
- Update documentation for API changes

### Testing Strategy

#### Unit Tests
- Service layer business logic
- DTO validation
- Utility functions

#### Integration Tests
- Repository layer with Testcontainers
- API endpoint testing
- Database migration verification

#### Running Tests

```bash
cd backend

# Run all tests
./gradlew test

# Run specific test class
./gradlew test --tests JobApplicationServiceTest

# Run with verbose output
./gradlew test --info
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using port 8080
lsof -i :8080

# Check what's using port 5432
lsof -i :5432
```

#### Database Connection Issues

1. Ensure PostgreSQL is running
2. Check environment variables
3. Verify database exists
4. Check firewall settings

#### Docker Issues
```bash
# Clean up Docker resources
./docker-dev.sh clean

# Force rebuild
./docker-dev.sh build
./docker-dev.sh up
```

### Logs and Debugging

```bash
# Backend logs (Docker)
./docker-dev.sh logs

# Database logs
./docker-dev.sh logs-db

# Follow logs in real-time
./docker-dev.sh logs
```

### Performance Considerations

- Database connection pool is configured for development workloads
- JPA `open-in-view` is disabled for better performance
- SQL logging is enabled in development, disabled in Docker profile
