---
title: Agenda API (scheduler backend)
---

API del backend tal como la consume el frontend. Verificado contra el código y contra la API en ejecución el 2026-10-05 (reemplaza la versión del 2026-09-24, que describía un modelo de "schedules" que ya no existe).

Swagger UI: `/swagger-ui/index.html` · Spec: `/v3/api-docs` (públicos).

## Contenido

- [[agenda-api/auth]] — login, JWT, roles, perfil
- [[agenda-api/doctors-specialties]] — doctores, personal y especialidades
- [[agenda-api/availability]] — disponibilidad semanal, bloqueos y horarios libres
- [[agenda-api/appointments]] — reservar, listar, confirmar, cancelar
- [[agenda-api/admin-board]] — tablero Kanban y calendario
- [[agenda-api/errors]] — códigos de error

## Gaps conocidos (pendientes backend)

- No hay reagendar ni cancelación por parte del paciente.
- No hay búsqueda de pacientes en servidor ni cambio de contraseña.
- El chat IA requiere `GEMINI_API_KEY` real.
