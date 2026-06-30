# MicroBooker – Project Overview

MicroBooker is a reservation-focused microservices solution built with .NET and event-driven patterns.  
It is structured using layered architecture (Domain, Application, Infrastructure, API) and integrates Redis, MongoDB, and Kafka for distributed behavior.

## Solution Structure

- `Reservation.Api`  
  HTTP API entry point for reservation operations.

- `MicroBooker.Application`  
  Application use cases and orchestration logic.

- `MicroBooker.Domain`  
  Core business models and contracts (framework-independent).

- `MicroBooker.Infrastructure`  
  External integrations and adapters (Redis lock service, Kafka publisher, Mongo persistence, etc.).

- `MicroBooker.StorageWorker`  
  Background worker for async/event-driven storage processing.

- `Ecommerce.Core` and `Ecommerce.Infrastructure`  
  External auth-related projects currently present in solution (can be removed if auth is fully separated as its own service).

- `MicroBooker.Client`  
  Frontend web client built with Vite/React for interacting with the reservation API.

## Infrastructure (Docker Compose)

The project uses `docker-compose.yml` to run dependencies locally:

- **Redis** (`6379`) for distributed locks
- **MongoDB** (`27017`) for primary data storage
- **Zookeeper** (`2181`) required by Kafka
- **Kafka** (`9092`) for publishing reservation events

## Runtime Flow (High-Level)

1. API receives reservation request.
2. Redis lock is acquired per table/time slot to prevent double booking.
3. Reservation is stored in MongoDB.
4. Reservation-created event is published to Kafka topic (`reservations`).
5. Worker/other services can consume events asynchronously.

## Notes

- Keep secrets and connection strings in environment variables/config files.
- If authentication is deployed as a separate service, integrate via JWT/service-to-service communication rather than project references.
- For production, avoid hardcoded infrastructure endpoints.
