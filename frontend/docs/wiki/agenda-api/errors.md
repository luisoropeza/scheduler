---
title: Agenda API — Errores
---

Parte de [[agenda-api/index]].

## Formato estándar

```json
{
  "status": 0,
  "message": "string",
  "timestamp": "ISO datetime",
  "errors": ["string"] 
}
```
`errors` puede ser null.

## Códigos

- **400** — validación (`@Valid`, campos faltantes/malformados) → `errors` trae mensajes por campo. También `BadRequestException` (ej. email/ci duplicado al crear).
- **401** — credenciales inválidas en login.
- **403** — `ForbiddenException` (mismatch de ownership, ej. doctor tocando cita/slot de otro doctor) o rol denegado por `@PreAuthorize`.
- **404** — recurso no encontrado (scheduleId/appointmentId/patientId/doctorId inválido).
- **406** (NOT ACCEPTABLE, **no 409**) — todos los conflictos de reglas de negocio de agenda usan este código, no el 409 esperado normalmente. Mensajes concretos:
  - "This schedule slot is no longer available"
  - "Cannot bookAppointment a past schedule slot"
  - "Just can confirm an appointment pending"
  - "This appointment is already cancelled"
  - "Cannot rescheduleAppointmentById a cancelled appointment"
  - "New schedule slot is not available"
  - "Cannot rescheduleAppointmentById to a past slot"
  - "Can't remove schedule already booked"

  No hay campo de error código-máquina — para branchear UI hay que matchear texto del mensaje.

- **500** — dos gaps conocidos en backend:
  1. Race condition real (dos clientes reservando mismo slot al mismo instante) → 500 crudo, no 409/406 (optimistic-lock exception no mapeada en GlobalExceptionHandler).
  2. Reschedule con `scheduleId` null/faltante → 500 crudo, no 400.

  Tratar 500 inesperado en booking/reschedule como posible conflicto de slot y re-fetch de disponibilidad.

## Pendientes reportados a backend

- Endpoints PATIENT-facing para cancelar/reagendar cita propia.
- `id` en items de `/api/appointments/board` y `/api/appointments/calendar`.
- Remap de 406 → 409 en conflictos de negocio.
