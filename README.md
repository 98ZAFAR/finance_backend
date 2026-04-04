# Finance Data Processing and Access Control Backend

Backend API for a finance dashboard with authentication, RBAC, financial record management, and dashboard analytics.

This implementation follows the SRS requirements in a modular flow:

Client -> Express API -> Controller -> Service -> Repository -> PostgreSQL

Optional caching layer:

Express API -> Service -> Redis

## 1. Implemented Scope

The codebase implements core functionality for:

- User management (admin CRUD + status control)
- Authentication (login + secure password hashing + JWT)
- Authorization (JWT middleware + role-based restrictions)
- Financial record CRUD with filtering
- Dashboard analytics endpoints (summary, categories, trends, recent)
- Validation and centralized error handling
- Optional Redis caching for dashboard responses

## 2. Tech Stack

- Node.js + Express
- Sequelize ORM
- PostgreSQL
- JWT (jsonwebtoken)
- bcrypt password hashing
- Redis client support (optional)

## 3. Project Structure

src

- configs
  - db.js
  - redis.js
- controllers
  - auth/controller.js
  - user/controller.js
  - record/controller.js
  - dashboard/controller.js
- middlewares
  - authMiddleware.js
  - rbacMiddleware.js
  - validationMiddleware.js
  - errorMiddleware.js
- models
  - auth/model.js
  - record/model.js
  - index.js
- repositories
  - userRepository.js
  - recordRepository.js
  - dashboardRepository.js
- services
  - authService.js
  - userService.js
  - recordService.js
  - dashboardService.js
- routes
  - index.js
  - authRoutes.js
  - userRoutes.js
  - recordRoutes.js
  - dashboardRoutes.js
- utils
  - asyncHandler.js
  - errors.js
  - validators.js
- server.js

## 4. Environment Variables

Create/update .env with:

PORT=3001
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=8h

DB_NAME=finance_dashboard
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost
DB_PORT=5432

Optional Redis:
UPSTASH_REDIS_REST_URL=https://<your-upstash-endpoint>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-upstash-rest-token>
DASHBOARD_CACHE_TTL_SECONDS=60

## 5. Setup and Run

1. Install dependencies

npm install

1. Start development server

npm run dev

1. Start production mode

npm start

Notes:

- If Upstash credentials are missing, the app still runs and caching is disabled.
- Sequelize sync is enabled at startup for schema/table creation.

## 6. Role and Permission Matrix

- viewer
  - No protected API access currently assigned by default routes.
- analyst
  - Can read records and dashboard analytics.
- admin
  - Full control of users and records.

Permissions by feature:

- Auth
  - POST /api/auth/login: public
  - POST /api/auth/register: bootstrap-only for first user; afterward requires admin context through managed user APIs
- Users
  - All /api/users endpoints: admin only
- Records
  - Create/Update/Delete: admin only
  - Read/List: analyst or admin
- Dashboard
  - All dashboard endpoints: analyst or admin

## 7. API Endpoints

Base URL: /api

### 7.1 Auth

POST /auth/register

- Purpose: bootstrap first admin account when system has no users
- Body:
  - name (string, required)
  - email (string, required)
  - password (string, required, min 8)
  - role (optional, ignored for first user and forced to admin)
  - status (optional)

POST /auth/login

- Body:
  - email (string, required)
  - password (string, required)
- Response:
  - token
  - user object

### 7.2 Users (Admin Only)

POST /users

- Create user with role and status

GET /users

- Query filters:
  - role
  - status
  - search
  - page
  - limit

GET /users/:id

- Fetch single user

PATCH /users/:id

- Update any of: name, role, status, password

PATCH /users/:id/status

- Update active/inactive status

DELETE /users/:id

- Delete a user (self-delete blocked)

### 7.3 Records

POST /records (admin)

- Body:
  - userId (optional, defaults to current admin)
  - type: income | expense
  - amount: positive number
  - category: string
  - date: valid date
  - note: string (optional)

GET /records (analyst, admin)

- Query filters:
  - type
  - category
  - startDate
  - endDate
  - page
  - limit

GET /records/:id (analyst, admin)

PATCH /records/:id (admin)

- Update any of: type, amount, category, date, note

DELETE /records/:id (admin)

### 7.4 Dashboard (Analyst, Admin)

GET /dashboard/summary

- Returns totalIncome, totalExpense, netBalance

GET /dashboard/categories

- Category-wise aggregation

GET /dashboard/trends

- Monthly trend aggregation by type

GET /dashboard/recent?limit=10

- Recent transactions list

## 8. Validation and Error Handling

Validation covers:

- Auth payloads
- User payloads and query params
- Record payloads and filter query params
- UUID path params

Error format:

{
  "message": "Validation failed",
  "details": ["...", "..."]
}

HTTP status usage:

- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 500 Internal Server Error

## 9. Caching Behavior

Dashboard service caches:

- summary
- categories
- trends
- recent list by limit

Record mutations automatically invalidate dashboard cache keys.

## 10. Security

- Password hashing with bcrypt hooks in user model
- JWT verification middleware for protected routes
- Active user check on token authentication
- RBAC middleware for role checks
- Self-deactivation and self-deletion protections for admin user operations

## 11. SRS Coverage Mapping

- FR1-F6: implemented in admin user management + constraints
- FR7-F11: implemented in auth service + JWT/RBAC middlewares
- FR12-F17: implemented in record service + filters
- FR18-F24: implemented in dashboard repository/service + optional Redis cache
- FR25-F28: implemented in validators + ApiError + error middleware + safeguards
- NFR1-NFR5: covered through optional Redis, secure auth, layered architecture, readability, model indexes/query patterns

## 12. Ordered Implementation Plan (Completed)

1. Foundation and DB/model corrections
2. Authentication and JWT setup
3. RBAC middleware
4. User management APIs
5. Record management APIs
6. Filtering support
7. Dashboard analytics queries
8. Optional Redis caching
9. Validation and error handling
10. Route integration
11. Startup wiring
12. Documentation

## 13. Optional Next Enhancements

- Pagination metadata standardization across all list endpoints
- Swagger/OpenAPI docs generation
- Rate limiting middleware
- Docker and docker-compose setup (Postgres + Redis + API)
- Automated tests (unit + integration)
