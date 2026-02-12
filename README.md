# Job Tracker

A full-stack job tracking application built with Spring Boot backend and modern frontend technologies.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [Local Development Setup](#local-development-setup)
- [Backend Architecture](#backend-architecture)
- [API Documentation](#api-documentation)
- [Development Tools](#development-tools)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Prerequisites

### For Docker Setup
- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

### For Local Development
- [Java 25](https://openjdk.org/projects/jdk/25/) or later
- [Gradle 9.0+](https://gradle.org/install/)
- [PostgreSQL 18](https://www.postgresql.org/download/) or later
- [Node.js 22+](https://nodejs.org/) (required by Vite 7)
- [Bun](https://bun.sh/) (for frontend package management)

## Quick Start with Docker

The easiest way to get started is using Docker Compose, which will set up both the backend and database services.

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd jobtracker
```

### 2. Start Services
```bash
# Start all services (backend + PostgreSQL)
./docker-dev.sh up

# Or use docker-compose directly
docker-compose up -d

# If you've made code changes, rebuild the image first:
./docker-dev.sh build
./docker-dev.sh up
```

### 3. Verify Setup
```bash
# Check service status
./docker-dev.sh status

# Test the health endpoint
curl http://localhost:8080/api/health

# View application logs
./docker-dev.sh logs
```

### 4. Stop Services
```bash
# Stop all services
./docker-dev.sh down

# Clean up (removes volumes and containers)
./docker-dev.sh clean
```

## Local Development Setup

### Backend Setup

#### 1. Database Setup
```bash
# Install and start PostgreSQL
# Create database and user
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

#### 3. Environment Variables (Optional)
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=jobtracker
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
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
- **Framework**: Spring Boot 3.5.6
- **Language**: Java 25
- **Build Tool**: Gradle with Kotlin DSL
- **Database**: PostgreSQL 18
- **ORM**: Spring Data JPA with Hibernate
- **Validation**: Bean Validation (JSR-303)
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
│     Models      │ ← Entity Layer
└─────────────────┘
```

#### 2. Package Structure
```
com.jhub.backend/
├── config/         # Configuration classes
├── controller/     # REST controllers
├── dto/            # Data Transfer Objects
├── model/          # JPA entities
├── repository/     # Data repositories
└── service/        # Business logic services
```

#### 3. Key Components

**Controllers** (`@RestController`)
- Handle HTTP requests and responses
- Input validation and error handling
- RESTful API design

**Services** (`@Service`)
- Business logic implementation
- Transaction management
- Integration with repositories

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

### Spring Boot Actuator Endpoints
- `/actuator/health` - Application health status
- `/actuator/info` - Application information
- `/actuator/metrics` - Application metrics

## Development Tools

### Docker Development Script
The `docker-dev.sh` script provides convenient commands for Docker-based development:

```bash
./docker-dev.sh build     # Build Docker images
./docker-dev.sh up        # Start all services
./docker-dev.sh down      # Stop all services
./docker-dev.sh logs      # Show application logs
./docker-dev.sh logs-db   # Show database logs
./docker-dev.sh restart   # Restart application
./docker-dev.sh clean     # Clean up containers and volumes
./docker-dev.sh shell     # Open shell in app container
./docker-dev.sh db-shell  # Open PostgreSQL shell
./docker-dev.sh status    # Show service status
```

### Important: Rebuilding After Code Changes
When you make changes to the backend code, you need to rebuild the Docker image for the changes to take effect:

```bash
# After making code changes:
./docker-dev.sh build     # Rebuild the image with your changes
./docker-dev.sh up        # Start services with the new image
```

### Automatic Rebuild Options
For development convenience, you can force Docker Compose to always rebuild:

```bash
# Force rebuild and start (ignores cache)
docker-compose up --build

# Or use the development script with build flag
./docker-dev.sh build && ./docker-dev.sh up
```

**Alternative: Modify docker-compose.yml for Development**
You can add `pull_policy: build` to the app service in `docker-compose.yml` to always rebuild:

```yaml
app:
  build:
    context: ./backend
    dockerfile: Dockerfile
  # Add this line for development:
  pull_policy: build
  # ... rest of configuration
```

**Note**: The `pull_policy: build` option will always rebuild the image, which is slower but ensures your code changes are always included.

### Gradle Tasks
```bash
./gradlew build           # Build the project
./gradlew bootRun         # Run the application
./gradlew test            # Run tests
./gradlew clean           # Clean build artifacts
./gradlew bootJar         # Create executable JAR
```

## Project Structure

```
jobtracker/
├── backend/                 # Spring Boot backend
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Configuration files
│   ├── src/test/           # Test code
│   ├── init-scripts/       # Database initialization
│   ├── build.gradle.kts    # Gradle build configuration
│   └── Dockerfile          # Backend container definition
├── frontend/               # Frontend application
├── docker-compose.yml      # Multi-service orchestration
├── docker-dev.sh          # Development helper script
└── README.md              # This file
```

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port 8080
lsof -i :8080
# Kill the process
kill -9 <PID>
```

**Database Connection Issues**
- Verify PostgreSQL is running
- Check connection parameters in `application.yml`
- Ensure database and user exist

**Docker Issues**
```bash
# Clean up Docker resources
docker system prune -a
# Rebuild images
./docker-dev.sh build
```

**Code Changes Not Reflected**
If you've made changes to the backend code but they're not showing up:
```bash
# Rebuild the Docker image to include your changes
./docker-dev.sh build
./docker-dev.sh up
```

### Logs and Debugging
```bash
# View application logs
./docker-dev.sh logs

# Enable debug logging
export LOGGING_LEVEL_COM_JHUB_BACKEND=DEBUG
./gradlew bootRun
```

