# Zorvyn Finance Backend API

![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supported-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

Backend API for finance data processing with authentication, role-based access control, record management, and dashboard analytics.

## Table of Contents

- [Highlights](#highlights)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Authentication and RBAC](#authentication-and-rbac)
- [API Overview](#api-overview)
- [Logging and Observability](#logging-and-observability)
- [Caching](#caching)
- [Error Format](#error-format)
- [Project Structure](#project-structure)
- [Development Notes](#development-notes)

## Highlights

- JWT-based authentication with HTTP-only cookie support
- Role-based route protection for `admin`, `analyst`, and `viewer`
- User management module for admin operations
- Financial records CRUD with filtering and pagination
- Dashboard endpoints for summary, categories, trends, and recent activity
- Optional Upstash Redis caching for dashboard responses
- Centralized validation and error handling
- Structured, readable logs for each API request and system snapshots

## Architecture

Layered request flow:

`Client -> Routes -> Controllers -> Services -> Repositories -> PostgreSQL`

Optional cache layer for dashboard endpoints:

`Services -> Upstash Redis`

## Tech Stack

- Node.js
- Express
- Sequelize
- PostgreSQL
- JWT (`jsonwebtoken`)
- Password hashing (`bcrypt`)
- Upstash Redis (`@upstash/redis`)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL instance
- Optional: Upstash Redis database

### Install

```bash
npm install
```

### Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Default base URL: `http://localhost:3000/api`

## Environment Variables

Create a `.env` file in the project root.

### Required

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | API port | `3001` |
| `JWT_SECRET` | Secret used to sign JWT tokens | `super_secret_key` |
| `JWT_EXPIRES_IN` | JWT expiration window | `8h` |
| `DB_NAME` | PostgreSQL database name | `finance_dashboard` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASS` | PostgreSQL password | `your_password` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |

### Optional

| Variable | Description | Default |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Caching disabled when missing |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Caching disabled when missing |
| `DASHBOARD_CACHE_TTL_SECONDS` | Dashboard cache TTL | `60` |
| `AUTH_COOKIE_NAME` | Auth cookie key | `auth_token` |
| `AUTH_COOKIE_MAX_AGE_MS` | Auth cookie lifetime | `28800000` |
| `AUTH_COOKIE_SAME_SITE` | Cookie SameSite policy | `lax` |
| `LOG_LEVEL` | Logger threshold (`error`, `warn`, `info`, `debug`, `trace`) | `debug` in dev, `info` in production |
| `LOG_COLORS` | Enable/disable colored console output (`true`/`false`) | Auto (enabled on TTY, disabled when redirected) |
| `SYSTEM_INFO_LOG_INTERVAL_MS` | System snapshot interval in milliseconds | `300000` |
| `NODE_ENV` | Runtime environment | `development` |

Example:

```env
PORT=3001
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=8h

DB_NAME=finance_dashboard
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost
DB_PORT=5432

UPSTASH_REDIS_REST_URL=https://<your-upstash-endpoint>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-upstash-rest-token>
DASHBOARD_CACHE_TTL_SECONDS=60

AUTH_COOKIE_NAME=auth_token
AUTH_COOKIE_MAX_AGE_MS=28800000
AUTH_COOKIE_SAME_SITE=lax
LOG_LEVEL=debug
LOG_COLORS=true
SYSTEM_INFO_LOG_INTERVAL_MS=300000
NODE_ENV=development
```

## Authentication and RBAC

### Authentication behavior

- `POST /api/auth/login` returns a JWT and also sets an HTTP-only auth cookie.
- Protected routes accept token from:
  - Auth cookie (`AUTH_COOKIE_NAME`)
  - `Authorization: Bearer <token>` header

### Registration behavior

- First user can register without login and is forced to `admin`.
- After first user exists, registering new users requires logged-in `admin` context.

### Role access matrix

| Module | Viewer | Analyst | Admin |
| --- | --- | --- | --- |
| Auth login | Yes | Yes | Yes |
| Auth register (first user bootstrap) | Yes | Yes | Yes |
| Auth register (after bootstrap) | No | No | Yes |
| Users management | No | No | Yes |
| Records read (`GET /records`, `GET /records/:id`) | No | Yes | Yes |
| Records write (`POST/PATCH/DELETE`) | No | No | Yes |
| Dashboard endpoints | Yes | Yes | Yes |

## API Overview

Base path: `/api`

| Area | Method | Endpoint | Access |
| --- | --- | --- | --- |
| Health | `GET` | `/health` | Public |
| Auth | `POST` | `/auth/login` | Public |
| Auth | `POST` | `/auth/logout` | Public |
| Auth | `POST` | `/auth/register` | Public for first user, then Admin |
| Users | `POST` | `/users` | Admin |
| Users | `GET` | `/users` | Admin |
| Users | `GET` | `/users/:id` | Admin |
| Users | `PATCH` | `/users/:id` | Admin |
| Users | `PATCH` | `/users/:id/status` | Admin |
| Users | `DELETE` | `/users/:id` | Admin |
| Records | `POST` | `/records` | Admin |
| Records | `GET` | `/records` | Analyst, Admin |
| Records | `GET` | `/records/:id` | Analyst, Admin |
| Records | `PATCH` | `/records/:id` | Admin |
| Records | `DELETE` | `/records/:id` | Admin |
| Dashboard | `GET` | `/dashboard/summary` | Viewer, Analyst, Admin |
| Dashboard | `GET` | `/dashboard/categories` | Viewer, Analyst, Admin |
| Dashboard | `GET` | `/dashboard/trends` | Viewer, Analyst, Admin |
| Dashboard | `GET` | `/dashboard/recent?limit=10` | Viewer, Analyst, Admin |

### Minimal login example

```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

## Logging and Observability

- API request logging is enabled for all routes through centralized middleware.
- Every response emits structured, readable logs with:
  - request ID (`X-Request-Id` response header)
  - method, path, normalized route, status code
  - request duration, user identity (if authenticated), client metadata
- Error handling emits structured warning/error logs with request context and serialized error details.
- Startup logs include DB/Redis initialization and service lifecycle events.
- System info snapshots are emitted on startup and every `SYSTEM_INFO_LOG_INTERVAL_MS`.
- Log levels are colorized in terminal output (`INFO` green, `WARN` yellow, `ERROR` red, etc.).

Sample request log:

```text
[INFO] 2026-04-05 10:15:22.321 zorvyn.backend [req-f1298c9d] HTTP request completed requestId=f1298c9d-4932-4565-935f-98db31f6bc45 method=GET path=/api/dashboard/summary route=/api/dashboard/summary apiArea=dashboard statusCode=200 durationMs=14.52 userId=12 userRole=analyst
```

## Caching

- Dashboard responses are cached when Upstash credentials are configured.
- Cache keys are under the `dashboard:*` namespace.
- Record create/update/delete operations invalidate dashboard cache.
- If Redis is unavailable, API still responds and falls back to direct database reads.

## Error Format

Typical error response:

```json
{
  "message": "Validation failed",
  "details": [
    "email must be a valid email address"
  ]
}
```

Common HTTP status codes:

- `200` OK
- `201` Created
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `409` Conflict
- `500` Internal Server Error

## Project Structure

```text
src/
  configs/
  controllers/
    auth/
    dashboard/
    record/
    user/
  middlewares/
  models/
    auth/
    record/
  repositories/
  routes/
  services/
  utils/
  server.js
```

## Development Notes

- Server startup runs Sequelize sync automatically.
- Keep role checks in routes and business constraints in services.
- If frontend and backend run on different origins, configure CORS with credentials for cookie-based auth.
