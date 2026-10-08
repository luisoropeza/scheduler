---
title: Agenda API — Tablero (Kanban) y Calendario
---

Parte de [[agenda-api/index]]. Ver también [[agenda-api/appointments]].

## Board

`GET /api/appointments/board?from=yyyy-MM-dd&to=yyyy-MM-dd&doctorId&patientId` — cualquier rol autenticado (DOCTOR/PATIENT forzados a lo propio).

Respuesta: `{ PENDING: [...], CONFIRMED: [...], CANCELLED: [...] }` (siempre las 3 keys).

## Calendario

`GET /api/appointments/calendar?month=1-12&year&doctorId&patientId` → `{ "MM-dd-yyyy": [...] }`.

## AppointmentSummaryItem (ambos endpoints)

```json
{ "id": 1, "clientName": "John Smith", "doctorName": "Dr. Ana García", "appointmentDate": "2026-10-06",
  "appointmentTime": "08:00 AM", "startTime": "2026-10-06T08:00:00", "endTime": "2026-10-06T08:30:00",
  "status": "CONFIRMED", "doctorId": 2, "patientId": 1 }
```

`id`, `status`, `startTime/endTime`, `doctorId` y `patientId` se agregaron el 2026-10-05 para poder abrir el detalle y mover tarjetas: en el tablero, arrastrar PENDING → CONFIRMED confirma y cualquier → CANCELLED cancela.
