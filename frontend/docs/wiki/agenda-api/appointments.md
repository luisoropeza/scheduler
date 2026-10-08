---
title: Agenda API — Appointments
---

Parte de [[agenda-api/index]]. Disponibilidad: [[agenda-api/availability]]. Errores: [[agenda-api/errors]]. Cliente: `AppointmentsApi`.

## Reservar

`POST /api/appointments` — DOCTOR, ASSISTANT, PATIENT.

```json
{ "doctorId": 2, "patientId": 1, "startTime": "2026-10-06T08:00:00", "endTime": "2026-10-06T08:30:00" }
```

- PATIENT: `patientId` se fuerza al propio → estado **PENDING**.
- DOCTOR: `doctorId` se fuerza al propio → **CONFIRMED**. ASSISTANT → **CONFIRMED**.
- 406 si la fecha es pasada, está bloqueada, cae fuera de la jornada o se solapa con otra cita. 404 si el doctor o paciente no existe o está inactivo.
- `endTime` = inicio + `slotDurationMinutes` del bloque de disponibilidad que contiene el horario (el front lo calcula).

## Consultar

- `GET /api/appointments?doctorId&patientId&status&page&size&sort` → `Page<AppointmentResponse>`. DOCTOR/PATIENT ven solo las suyas. Sort típico: `startTime,desc`.
- `GET /api/appointments/{id}` — DOCTOR/PATIENT solo las propias (403).

## Confirmar / cancelar

`PATCH /api/appointments/{id}/confirm` (solo desde PENDING) y `PATCH /api/appointments/{id}/cancel` — DOCTOR (propias) y ASSISTANT.

## AppointmentResponse

```json
{ "id": 1, "startTime": "…", "endTime": "…", "doctorId": 2, "doctorName": "…", "doctorSpecialty": "…", "doctorEmail": "…",
  "patientId": 1, "patientName": "…", "patientEmail": "…", "status": "Confirmado", "createdAt": "…" }
```

`status` viene en español (display); los filtros usan el enum `PENDING | CONFIRMED | CANCELLED` (`statusFromDisplay` en el front).
