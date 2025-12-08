# PartIoT Backend Task

## Description

PartIoT Backend is a microservices-based IoT system designed to handle sensor data, define rules, and generate reports. The system is built using NestJS and utilizes NATS for asynchronous messaging, MongoDB for persistent storage, and Redis for caching.

The architecture consists of three main services:

- **Agent Service**: Simulates or handles IoT agents sending sensor data.
- **API Gateway Service**: Exposes RESTful APIs for client interactions (managing rules, retrieving reports).
- **Process Service**: Processes incoming data, evaluates rules, and manages data persistence.

## Prerequisites

- Node.js (v18 or later)
- Docker and Docker Compose
- NPM

## Installation

1.  Clone the repository.
2.  Install dependencies for all services:
    ```bash
    # In the root directory (if using a monorepo tool like Lerna or Nx, otherwise install in each service)
    cd services/common && npm install && npm run build
    cd ../agent && npm install
    cd ../api-gateway && npm install
    cd ../process && npm install
    ```
    _Note: Ensure the `common` library is built before starting other services._

## Configuration

Environment variables are managed via `.env` files. Example configuration files (`example.env`) are provided in each service directory.

- `services/agent/example.env`
- `services/api-gateway/example.env`
- `services/process/example.env`

You can copy these to `.env` in their respective directories and adjust values as needed.

## Running the Project

### Using Docker Compose (Recommended)

To start the entire infrastructure (MongoDB, NATS, Redis) and all microservices:

```bash
docker-compose up --build
```

### Using VS Code Tasks

This project includes VS Code tasks to run services individually or all together in debug mode.

1.  Open the Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`).
2.  Type `Tasks: Run Task`.
3.  Select one of the following:
    - **Run All Services**: Starts Gateway, Agent, and Process services in parallel.
    - **Run Gateway Service**: Starts only the API Gateway.
    - **Run Agent Service**: Starts only the Agent service.
    - **Run Process Service**: Starts only the Process service.

_Note: Ensure infrastructure services (NATS, MongoDB, Redis) are running (e.g., via `docker-compose up mongodb nats redis`) before running services locally via VS Code tasks._

## API Documentation

The API Gateway exposes the following endpoints (default port: 3000):

### Health Check

- **GET** `/health`
    - Check the health status of the service.

### Rules Management

- **POST** `/rules`
    - Create a new rule.
    - Body: `CreateRuleDTO`
- **GET** `/rules`
    - List all rules.
    - Query: `ListRuleDTO`
- **DELETE** `/rules/:ruleId`
    - Delete a specific rule.
- **PATCH** `/rules/:ruleId`
    - Update a specific rule.
    - Body: `UpdateRuleBodyDTO`

### Reports

- **GET** `/reports/rules/:ruleId/history`
    - Get historical data for a rule.
    - Query Params:
        - `from`: Start timestamp (Unix ms)
        - `to`: End timestamp (Unix ms)
- **GET** `/reports/rules/:ruleId/ranking`
    - Get ranking report for a rule.

## Future Plans & Improvements

The following features are planned for future releases to enhance the system:

- [ ] **Global Error Handler for API Gateway**: Implement a centralized exception filter to handle errors gracefully and provide consistent error responses across all APIs.
- [ ] **Large Dataset Optimization**: To efficiently handle millions of records and minimize response payloads, two strategies are proposed:
    - **Strategy 1 (Split APIs)**: Implement a two-step retrieval process. First, a summary API to retrieve a paginated list of agents with record counts, followed by a detail API to fetch timestamps for a specific agent.
    - **Strategy 2 (Flat Stream Pattern)**: Implement an "Infinite Scroll" mechanism using Keyset Pagination (avoiding `skip`/`offset`) for efficient data streaming.
- [ ] **NATS Resilience and Scalability**:
    - **Retry Mechanism**: Implement retry logic for NATS connections to ensure service resilience during startup or connectivity issues.
    - **Queue Groups**: Utilize NATS queue groups to distribute message processing load across multiple instances of the Process Service.
- [ ] **Rule Threshold Validation**: Implement minimum and maximum value validation for the threshold field during rule creation to ensure data integrity.
