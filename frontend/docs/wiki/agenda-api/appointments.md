---
title: Agenda API — Appointments
---

Parte de [[agenda-api/index]]. Auth: ver [[agenda-api/auth]]. Slots: ver [[agenda-api/schedules]]. Errores: ver [[agenda-api/errors]]. Panel admin: ver [[agenda-api/admin-board]].

## Crear cita

`POST /api/appointments` — cualquier rol autenticado.

Body (AppointmentRequest):
```json
{ "scheduleId": 0, "patientId": 0 }
```
Ambos campos requeridos.

- Si caller role = PATIENT: `patientId` en body DEBE coincidir con id propio del caller (JWT `sub`), si no 403. Resultado: status = PENDING.
- Si caller role != PATIENT (staff reservando por paciente): resultado: status = CONFIRMED directo (salta PENDING).
- Falla 406 si slot no está AVAILABLE o si hora inicio del slot ya pasó. Ver [[agenda-api/errors]].

## Detalle cita

`GET /api/appointments/{appointmentId}` — cualquier rol autenticado, pero DOCTOR solo ve las propias, PATIENT solo ve las propias (403 si no).

## Listar citas

`GET /api/appointments?doctorId&patientId&status&page&size&sort`

- Role DOCTOR: `doctorId` forzado al caller.
- Role PATIENT: `patientId` forzado al caller.
- Otros roles: filtros libres.

`status` enum: `PENDING`, `CONFIRMED`, `CANCELLED`.

## Confirmar cita

`PATCH /api/appointments/{appointmentId}/confirm` — solo roles DOCTOR, RECEPTIONIST.

## Cancelar cita

`PATCH /api/appointments/{appointmentId}/cancel` — solo roles DOCTOR, RECEPTIONIST. Libera el slot de vuelta a AVAILABLE.

## Reagendar cita

`PATCH /api/appointments/{appointmentId}/reschedule` — solo roles DOCTOR, RECEPTIONIST.

Body:
```json
{ "scheduleId": 0 }
```
Sin `@NotNull` en servidor — enviar null causa 500 crudo, no 400. Validar en cliente también.

Mueve la cita a otro Schedule row — el nuevo schedule puede pertenecer a doctor DIFERENTE del original sin check extra. Acción "reasignar a otro doctor" en UI usaría este mismo endpoint.

## Gap: no hay endpoints PATIENT-facing

Confirmar/cancelar/reagendar son staff-only en código actual. No existe endpoint para que paciente cancele/reagende su propia cita. Si el flujo cliente lo necesita, hay que pedirlo a backend.

## AppointmentResponse

```json
{
  "id": 0,
  "scheduleId": 0,
  "scheduleStart": "ISO datetime",
  "scheduleEnd": "ISO datetime",
  "doctorId": 0,
  "doctorName": "string",
  "doctorSpecialty": "string",
  "doctorEmail": "string",
  "clientId": 0,
  "clientName": "string",
  "clientEmail": "string",
  "status": "Pendiente | Confirmado | Cancelado",
  "createdAt": "ISO datetime"
}
```

**Ojo:** `status` en response = string español (display), no enum crudo. Filtro `?status=` usa enum crudo `PENDING`/`CONFIRMED`/`CANCELLED`.
