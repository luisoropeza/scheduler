---
title: Agenda API — Disponibilidad y horarios libres
---

Parte de [[agenda-api/index]]. Cliente: `AgendaApi` (`core/api/agenda.api.ts`).

Los horarios libres no se guardan: se calculan a partir de la disponibilidad semanal del doctor, menos bloqueos, menos citas no canceladas, menos horas pasadas.

## Disponibilidad semanal

- `POST /api/doctorAvailability` — DOCTOR (siempre para sí mismo). Body `{ dayOfWeek: "MONDAY", startTime: "08:00", endTime: "12:00", slotDurationMinutes: 30 }` (`slotDurationMinutes` ≥ 5).
- `GET /api/doctorAvailability/{doctorId}` — DOCTOR (ignora el id y usa el propio), ASSISTANT, PATIENT. Solo bloques activos.
- `DELETE /api/doctorAvailability/{id}` — DOCTOR dueño; desactiva el bloque (no borra citas).
- `GET /api/doctorAvailability/{doctorId}/availables?date=yyyy-MM-dd` → `{ date, doctorId, availableSlots: ["08:00:00", …] }`.

## Bloqueos (schedule exceptions)

Todos DOCTOR y sobre su propia agenda:

- `POST /api/scheduleException` — `{ date, isFullDayBlock, startTime?, endTime?, reason? }`. Si no es día completo, `startTime` y `endTime` son obligatorios.
- `GET /api/scheduleException?from=yyyy-MM-dd` (default hoy).
- `DELETE /api/scheduleException/{id}`.

Al reservar, el backend rechaza (406) horarios dentro de un bloqueo total o parcial.
