# MicroBooker

MicroBooker is a distributed reservation demo designed to showcase real backend engineering patterns for booking systems:

- **Concurrency protection** (Redis distributed lock)
- **Event-driven workflow** (Kafka producer/consumer)
- **Asynchronous persistence pipeline** (API publishes, Worker stores)
- **Frontend UX safeguards** (disable booked combinations)
- **Layered backend architecture** (Domain → Application → Infrastructure)

This project is intentionally built as a learning + portfolio system to demonstrate practical microservice concepts, not just CRUD.

---

## Table of Contents

1. [System Purpose](#system-purpose)
2. [Architecture Overview](#architecture-overview)
3. [Repository Structure](#repository-structure)
4. [Service Responsibilities](#service-responsibilities)
5. [Reservation Flow (Step-by-Step)](#reservation-flow-step-by-step)
6. [Concurrency Strategy](#concurrency-strategy)
7. [API Contracts](#api-contracts)
8. [Data Model](#data-model)
9. [Configuration](#configuration)
10. [Local Setup & Run](#local-setup--run)
11. [Verification Checklist](#verification-checklist)
12. [Troubleshooting](#troubleshooting)
13. [Interview Talking Points](#interview-talking-points)
14. [Future Improvements](#future-improvements)

---

## System Purpose

Booking systems are sensitive to race conditions (double booking under simultaneous requests).  
MicroBooker focuses on solving that by combining:

- **UI prevention**: disable obviously booked options
- **Backend enforcement**: lock + conflict response as source of truth

The backend remains authoritative even if the UI is bypassed.

---

## Architecture Overview

**Frontend:** React (Vite)  
**API:** ASP.NET Core (`Reservation.Api`)  
**Worker:** .NET Background Service (`MicroBooker.StorageWorker`)  
**Messaging:** Kafka  
**Locking:** Redis  
**Database:** MongoDB

### Logical flow

1. User picks table/date/time in UI.
2. Client calls `POST /api/reservations`.
3. API tries Redis lock for the reservation key.
4. If lock fails / slot already taken → `409 Conflict`.
5. If accepted → API publishes reservation event to Kafka.
6. Worker consumes event and writes reservation to MongoDB.
7. Client calls `GET /api/reservations` and disables booked slots.

---

## Repository Structure

- `MicroBooker.Client/`  
  React UI, context/state, API client adapters, table/date/time selection UX.

- `Reservation.Api/`  
  HTTP endpoints, DI container setup, orchestration through Application layer.

- `MicroBooker.Domain/`  
  Core entity + interfaces (contracts):
  - `Reservation`
  - `ILockService`
  - `IEventPublisher`

- `MicroBooker.Application/`  
  Use-case logic:
  - `ReservationRequestDto`
  - `ReservationService` (lock + publish orchestration)

- `MicroBooker.Infrastructure/`  
  Technical implementations:
  - `RedisLockService`
  - `KafkaEventPublisher`

- `MicroBooker.StorageWorker/`  
  Kafka consumer that persists events to MongoDB.

- `docker-compose.yml`  
  Local infrastructure: Redis, MongoDB, Zookeeper, Kafka.

---

## Service Responsibilities

## Reservation.Api

- Handles reservation API requests.
- Calls `ReservationService`.
- Returns:
  - success (Accepted/OK based on controller behavior)
  - `409 Conflict` on lock/contention rule failure.

## MicroBooker.Application (ReservationService)

- Validates request flow.
- Acquires lock via `ILockService`.
- Builds reservation domain object.
- Publishes event via `IEventPublisher`.

## MicroBooker.Infrastructure

- `RedisLockService`: lock key management for concurrency control.
- `KafkaEventPublisher`: publishes reservation-created events to topic `reservations`.

## MicroBooker.StorageWorker

- Subscribes to Kafka `reservations` topic.
- Deserializes event payload.
- Persists into MongoDB collection `BookerDb.reservations`.

## MicroBooker.Client

- Fetches existing reservations.
- Normalizes response shape.
- Computes booked table/time combinations.
- Disables unavailable options.
- Submits reservation payload.

---

## Reservation Flow (Step-by-Step)

1. **Load UI data**
   - Client requests `GET /api/reservations`.
   - Existing reservations are mapped into availability state.

2. **User selects**
   - Table
   - Date
   - Time

3. **Client submits**
   - `POST /api/reservations` with DTO fields:
     - `customerId`
     - `restaurantId`
     - `tableId`
     - `timeSlot` (ISO-like timestamp)
     - `partySize`

4. **API processing**
   - Builds lock key from table + timeslot.
   - If key is locked / invalid condition:
     - return `409 Conflict`.
   - Else publish Kafka event and return success.

5. **Worker processing**
   - Consumes event
   - Saves in MongoDB

6. **Client refreshes availability**
   - Slot appears booked and becomes disabled in UI.

---

## Concurrency Strategy

MicroBooker uses **defense in depth**:

1. **Frontend guard (UX):**
   - Disable already-booked combinations to reduce invalid attempts.

2. **Backend guarantee (consistency):**
   - Redis distributed lock to prevent concurrent write race.
   - Conflict response (`409`) for contested slot.

This distinction is important in interviews:  
UI is convenience; backend is correctness.

---

## API Contracts

## `GET /api/reservations`

Returns persisted reservations.

Example response:

```json
[
  {
    "id": "cbe93a60-ae99-4b7e-9d48-d168ba4004c9",
    "customerId": "demo-user-1",
    "restaurantId": "demo-restaurant-1",
    "tableId": "table_number_2",
    "timeSlot": "2026-06-21T19:00:00",
    "partySize": 2,
    "createdAt": "2026-06-19T17:34:42.06Z"
  }
]
```

## `POST /api/reservations`

Creates a reservation request.

Example request:

```json
{
  "customerId": "demo-user-1",
  "restaurantId": "demo-restaurant-1",
  "tableId": "table_number_2",
  "timeSlot": "2026-06-21T19:00:00",
  "partySize": 2
}
```

Expected outcomes:

- Success (`202` or `200`, based on controller implementation)
- `409 Conflict` if lock/business conflict occurs

---

## Data Model

Primary reservation fields:

- `Id` (Guid)
- `CustomerId`
- `RestaurantId`
- `TableId`
- `TimeSlot`
- `PartySize`
- `CreatedAt` (UTC)

Mongo target:

- Database: `BookerDb`
- Collection: `reservations` (lowercase recommended)

---

## Configuration

## Client

`MicroBooker.Client/.env`

```env
VITE_API_BASE_URL=http://localhost:5147
```

## API

`Reservation.Api/appsettings.json`

```json
{
  "ConnectionStrings": {
    "Mongo": "mongodb://localhost:27017"
  }
}
```

If API port changes, update `VITE_API_BASE_URL` accordingly.

---

## Local Setup & Run

## 1) Start infrastructure

```powershell
cd b:\Projects\MicroBooker
docker compose up -d
docker ps
```

Expected containers:

- `mb-redis`
- `mb-mongodb`
- `mb-zookeeper`
- `mb-kafka`

## 2) Start API

```powershell
cd b:\Projects\MicroBooker\Reservation.Api
dotnet run
```

Confirm listening URL (example): `http://localhost:5147`

## 3) Start Worker

```powershell
cd b:\Projects\MicroBooker\MicroBooker.StorageWorker
dotnet run
```

## 4) Start Client

```powershell
cd b:\Projects\MicroBooker\MicroBooker.Client
npm install
npm run dev
```

---

## Verification Checklist

- [ ] `GET /api/reservations` returns JSON (not error page)
- [ ] New reservation appears in MongoDB (`BookerDb.reservations`)
- [ ] Duplicate same table/time gets `409` (or blocked by UI)
- [ ] UI shows booked state after refresh
- [ ] Worker logs confirm Kafka consumption + Mongo insert

Optional direct check:

```powershell
Invoke-RestMethod http://localhost:5147/api/reservations
```

---

## Troubleshooting

## `ERR_CONNECTION_REFUSED` from frontend

- API not running or wrong port in `.env`.
- Restart Vite after changing `.env`.

## `GET /api/reservations` returns `[]` after booking

- Worker not running or not consuming topic.
- Topic mismatch between publisher and consumer.
- Collection naming mismatch (`reservations` vs `Reservations`).

## BSON serialization exception on GET

- Do not return raw `BsonDocument` directly.
- Return typed `Reservation` model from controller.

## Bad time format stored (e.g. `06:00 PM:00`)

- Ensure frontend converts to 24-hour format before submit:
  `YYYY-MM-DDTHH:mm:ss`

---

## Interview Talking Points

Use this framing:

- “I implemented a reservation workflow with **Redis distributed locking** to prevent race-condition double booking.”
- “I used **Kafka** to decouple API request handling from persistence side effects.”
- “The API publishes events; a **background worker** consumes and writes to Mongo.”
- “Frontend disables known-booked slots for UX, but backend still enforces conflicts with `409`.”

---

## Future Improvements

- Add consumer groups + retries/dead-letter topic for worker resilience
- Add idempotency key to reservation requests
- Add OpenTelemetry tracing across API/Worker
- Add integration tests for lock conflict scenarios
- Add auth + real customer/restaurant identity context
- Add CI pipeline for build/lint/test

---
