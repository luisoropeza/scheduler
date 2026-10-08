---
name: run-stack
description: Start, check or stop the local Scheduler stack (PostgreSQL in Docker, Spring Boot backend, Angular dev server) and verify it end-to-end with the seeded users. Use when asked to run/launch/test the app, reproduce a bug in the browser, or before any UI verification.
---

# Run the local stack

Three processes, in this order. The SessionStart hook already printed which ones are UP.

## 1. Database (Docker)

```bash
docker compose up -d db          # from the repo root; postgres:16 on :5432, db "scheduler", postgres/postgres
docker compose ps                # wait for "healthy"
```

Data lives in the `scheduler-db-data` volume. To start from scratch (re-runs DataSeeder): ask the user first, then `docker compose down -v`.

## 2. Backend (Spring Boot, :8080)

Reads `backend/.env` if it exists (never read or edit it — it holds secrets). Without it, pass dev values inline:

```bash
cd backend
DB_URL=jdbc:postgresql://127.0.0.1:5432/scheduler DB_USERNAME=postgres DB_PASSWORD=postgres PORT=8080 \
CORS_ALLOWED_ORIGINS=http://localhost:4200 JWT_SECRET=dev-secret-dev-secret-dev-secret-0123456789 \
GEMINI_API_KEY=dummy MAIL_HOST=localhost MAIL_PORT=1025 MAIL_USERNAME=x MAIL_PASSWORD=x \
./gradlew bootRun --console=plain > ../backend-dev.log 2>&1
```

Run it with `run_in_background`. Ready when the log shows `Started SchedulerApplication`. Swagger: http://localhost:8080/swagger-ui/index.html

- With `GEMINI_API_KEY=dummy` everything works except `/api/chat/patient` (500 "Failed to generate content"). That is expected.
- devtools is on: `./gradlew compileJava` in another shell hot-restarts the running app.

## 3. Frontend (Angular, :4200)

```bash
cd frontend
pnpm install        # first time (or: npx -y pnpm@10.33.2 install)
pnpm start          # ng serve, proxies /api → :8080 (proxy.conf.json), so no CORS in dev
```

## Seeded users (DataSeeder, password `password123`)

| Role | Clinic 1 "Downtown" | Clinic 2 "Uptown" |
|---|---|---|
| ADMINISTRATOR | admin.downtown@clinic.com | admin.uptown@clinic.com |
| DOCTOR | ana.garcia@clinic.com (General Medicine) | sofia.ramirez@clinic.com |
| ASSISTANT | maria.ramos@clinic.com | pedro.alvarez@clinic.com |
| PATIENT | john.smith@email.com, maria.lopez@email.com | james.wilson@email.com |

A fresh DB has no doctor availability: log in as a doctor → *Mi disponibilidad* to create some before testing bookings.

## Verify

- API quick check: `curl -s http://localhost:8080/api/clinics`
- Login + call: `curl -s -X POST localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"email":"ana.garcia@clinic.com","password":"password123","clinicId":1}'`
- Full UI smoke (all roles, every page, fails on console errors / API >= 400): `cd frontend && pnpm e2e:smoke` (`SCREENSHOTS=shots` to keep screenshots, then Read them).
- Interactive checks: use the `playwright` MCP server (`.mcp.json`) to drive http://localhost:4200.
