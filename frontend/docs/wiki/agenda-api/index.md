---
title: Agenda API (scheduler-back)
---

Documentación API de scheduler-back, scope agenda: reserva citas (cliente) + panel Kanban (administrativo). Fuente: sesión scheduler-back, verificado contra código fuente (no CLAUDE.md, desactualizado en algunos puntos). Fecha: 2026-09-24.

Swagger UI: `/swagger-ui/**` · Spec: `/v3/api-docs` (ambos públicos, sin auth).

## Contenido

- [[agenda-api/auth]] — login, JWT, roles
- [[agenda-api/doctors-specialties]] — listado doctores y especialidades
- [[agenda-api/schedules]] — slots de horario (crear, listar, borrar)
- [[agenda-api/appointments]] — citas (crear, confirmar, cancelar, reagendar)
- [[agenda-api/admin-board]] — endpoints Kanban/calendario para administrativos
- [[agenda-api/errors]] — códigos de error y casos especiales

## Gaps conocidos (pendientes backend)

- No hay endpoints PATIENT-facing para cancelar/reagendar cita propia (solo DOCTOR/RECEPTIONIST).
- `/api/appointments/board` no devuelve `id` en items — no se puede linkear tarjeta Kanban a cita sin llamar `/api/appointments` aparte.
- Conflictos de reserva (race condition) devuelven 500 crudo, no 406/409.
- `reschedule` con `scheduleId` null/faltante devuelve 500 crudo, no 400.

Ver [[agenda-api/errors]] para detalle.
