# ClinicFlow — Scheduler

Agenda de citas médicas multi-clínica: cada clínica tiene su propio espacio (schema PostgreSQL), con personal, pacientes,
disponibilidad de doctores, reservas, tablero Kanban, calendario y un asistente de IA para pacientes.

| Carpeta | Stack |
|---|---|
| `backend/` | Spring Boot 4, Java 26, PostgreSQL, Flyway, JWT, Spring AI (Gemini) — ver [backend/README.md](backend/README.md) |
| `frontend/` | Angular 19, Tailwind v4, Angular CDK, pnpm |

## Arranque rápido

```bash
# 1. Base de datos
docker compose up -d db

# 2. Backend (copia backend/.env.example a backend/.env y completa JWT_SECRET; GEMINI_API_KEY solo para el chat)
cd backend && ./gradlew bootRun        # Windows: .\gradlew.bat bootRun

# 3. Frontend
cd frontend && pnpm install && pnpm start   # http://localhost:4200
```

Con la base vacía se crean dos clínicas de ejemplo. Usuarios (contraseña `password123`), clínica *Downtown Clinic*:

| Rol | Email | Qué puede hacer |
|---|---|---|
| Administrador | admin.downtown@clinic.com | Personal, especialidades, vista general |
| Doctor | ana.garcia@clinic.com | Su disponibilidad y bloqueos, sus pacientes, confirmar/cancelar sus citas |
| Asistente | maria.ramos@clinic.com | Pacientes, reservar con cualquier doctor, confirmar/cancelar |
| Paciente | john.smith@email.com | Reservar (queda pendiente), ver sus citas, asistente IA |

También puedes registrar una clínica nueva desde la pantalla de inicio.

## Calidad

```bash
cd frontend && pnpm build && pnpm format:check
cd frontend && pnpm e2e:smoke     # con todo levantado: recorre cada pantalla con cada rol en Chrome
cd backend && ./gradlew test
```

## Desarrollo con Claude Code

`CLAUDE.md` (raíz, `frontend/`, `backend/`) describe arquitectura y convenciones. En `.claude/` hay hooks (formato automático,
protección de migraciones y secretos, estado del stack al iniciar), skills (`run-stack`, `new-frontend-page`, `api-sync`,
`flyway-migration`) y `.mcp.json` configura los MCP de Angular CLI y Playwright.
