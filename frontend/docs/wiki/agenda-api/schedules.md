---
title: Agenda API — Schedules (slots)
---

Parte de [[agenda-api/index]]. Auth: ver [[agenda-api/auth]]. Errores: ver [[agenda-api/errors]].

## Listar slots

`GET /api/schedules?doctorId&specialtyId&status&after={ISO datetime}&page&size&sort`

Cualquier rol autenticado. Si caller es DOCTOR, param `doctorId` se ignora — servidor lo fuerza al id propio del caller.

Defaults: `status=AVAILABLE` si se omite, `after=now` si se omite.

Response: `Page<ScheduleResponse>`

## Detalle slot

`GET /api/schedules/{scheduleId}` — cualquier rol autenticado.

## Crear slot

`POST /api/schedules` — solo rol DOCTOR.

`POST /api/schedules/batch` — solo rol DOCTOR. Body: `List<ScheduleRequest>`.

ScheduleRequest:
```json
{
  "startTime": "ISO-8601 LocalDateTime (debe ser futuro)",
  "endTime": "ISO-8601 LocalDateTime (debe ser futuro, después de startTime)"
}
```

## Borrar slot

`DELETE /api/schedules/{scheduleId}` — solo rol DOCTOR, debe ser dueño del slot, falla si `status=BOOKED`.

## ScheduleResponse

```json
{
  "id": 0,
  "doctorId": 0,
  "doctorName": "string",
  "doctorSpecialty": "string",
  "doctorEmail": "string",
  "startTime": "ISO datetime",
  "endTime": "ISO datetime",
  "status": "Disponible | Reservado"
}
```

**Ojo:** `status` en response viene como string en español (`getDisplayName()`: "Disponible"/"Reservado"), no como enum crudo. Pero filtro `?status=` en el GET usa enum crudo (`ScheduleStatus`: `AVAILABLE`, `BOOKED`). Mismatch entre lo que se envía como filtro y lo que vuelve en el body — frontend debe manejar ambas grafías.
