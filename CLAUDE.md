# Scheduler (ClinicFlow) — monorepo

Medical appointment scheduler for multiple clinics. Spanish-speaking users; UI copy in Spanish, code/comments in English.

```
backend/    Spring Boot 4 · Java 26 (Gradle toolchain) · PostgreSQL · Flyway · JWT · Spring AI (Gemini)   → backend/CLAUDE.md
frontend/   Angular 19 standalone + signals · Tailwind v4 · CDK (dialog, drag&drop) · pnpm                → frontend/CLAUDE.md
docker-compose.yml   dev PostgreSQL (`docker compose up -d db`)
.claude/    hooks, skills and settings for Claude Code (see below)
```

## Domain in one minute

- **Multi-tenant, schema per clinic.** `public` holds `accounts`, `roles`, `clinics`; each clinic has its own `clinic_<id>` schema with personal, patients, appointments, availability… The JWT carries `clinicId` and `JwtAuthFilter` sets the tenant per request. Login therefore needs `email + password + clinicId` (the UI picks the clinic first on `/clinic-options`).
- **Roles:** `ADMINISTRATOR` (manages staff & specialties), `DOCTOR` (own agenda, availability, patients), `ASSISTANT` (receptionist: patients, bookings for any doctor), `PATIENT` (books own appointments, AI chat). JWT `sub` = `Personal.id` for staff, `Patient.id` for patients.
- **Agenda:** doctors define weekly `DoctorAvailability` blocks (day, from–to, slot minutes) and date `ScheduleException`s (full day or range). Free slots are computed on the fly (`GET /api/doctorAvailability/{id}/availables?date=`). Appointments: patient bookings start `PENDING`, staff bookings are `CONFIRMED`; staff can confirm/cancel.
- **Registration:** `POST /api/clinics` (public) creates a clinic + its admin. There is no patient/staff self-signup: admins create staff, doctors/assistants create patients.

## Working on this repo

- Start/verify the stack with the **`run-stack`** skill (seeded users, password `password123`). The SessionStart hook reports which services are already up.
- New UI screen → **`new-frontend-page`** skill; its server state (filters, pagination, loading) → **`frontend-resource-service`** skill. Backend contract changed → **`api-sync`** skill. Schema change → **`flyway-migration`** skill. Backend Java conventions → `backend/.claude/skills/java-*`.
- Verify before saying done: `cd frontend && pnpm build` (strict templates) · `cd backend && ./gradlew compileJava` · with the stack up `cd frontend && pnpm e2e:smoke`.
- MCP servers (`.mcp.json`): `angular-cli` (Angular docs/best practices, v20+ tools) and `playwright` (drive http://localhost:4200 in Chrome).

## Guardrails (enforced by `.claude/hooks`)

- `guard-protected-files.mjs` blocks edits to committed Flyway migrations, real `.env` files and lockfiles.
- `format-frontend.mjs` runs Prettier on every edited file under `frontend/src` (config: `frontend/.prettierrc.json`).
- Secrets live in `backend/.env` (gitignored, never read it); document new variables in `backend/.env.example`.
- Commit only when asked; `develop` is the working branch, `main` the release branch.

## Known gaps / next steps (not in the MVP)

- `/api/chat/patient` needs a real `GEMINI_API_KEY`; chat memory is in-memory (lost on restart).
- No password change/reset, no refresh token (JWT lasts 24h), no reschedule endpoint, patients cannot cancel their own appointments.
- Patient search is client-side (patients page loads up to 1000); add a server-side filter when clinics grow.
- `TwilioWhatsappService` and mail settings exist but nothing sends notifications yet.
