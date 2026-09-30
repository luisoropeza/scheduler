---
title: Agenda API — Panel Admin (Kanban / Calendario)
---

Parte de [[agenda-api/index]]. Ver también [[agenda-api/appointments]].

## Board (Kanban)

`GET /api/appointments/board?from={ISO date}&to={ISO date}&doctorId&patientId`

Cualquier rol autenticado (mismas reglas de forzado doctorId/patientId que en `/api/appointments` para caller DOCTOR/PATIENT).

Response: `Map<AppointmentStatus, List<AppointmentSummaryItem>>` — keys son nombres de enum crudo `PENDING`/`CONFIRMED`/`CANCELLED` (no display string), siempre las 3 keys presentes aunque vacías.

AppointmentSummaryItem:
```json
{
  "clientName": "string",
  "doctorName": "string",
  "appointmentDate": "ISO date",
  "appointmentTime": "hh:mm a, ej. 02:30 PM"
}
```

**Gap importante:** sin `id` en este objeto — no se puede linkear tarjeta Kanban a la cita. Opciones: usar `GET /api/appointments` (listado) en paralelo, o pedir a backend que agregue `id` al summary.

## Calendario

`GET /api/appointments/calendar?month={1-12}&year&doctorId&patientId`

Response: `Map<String, List<AppointmentSummaryItem>>` — key formato `"MM-dd-yyyy"`.

Mismo `AppointmentSummaryItem`, mismo gap de `id` faltante.
