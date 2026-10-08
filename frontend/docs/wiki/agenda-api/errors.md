---
title: Agenda API — Errores
---

Parte de [[agenda-api/index]].

```json
{ "status": 406, "message": "That slot is already taken", "timestamp": "…", "errors": null }
```

- **400** — validación (`errors` trae mensajes por campo, en el idioma del servidor), body/param mal formado ("Malformed request"), email/CI duplicado.
- **401** — credenciales inválidas o token vencido (el front cierra sesión).
- **403** — rol no permitido o recurso de otro doctor/paciente.
- **404** — recurso inexistente (también doctor/paciente inactivo al reservar).
- **406** — regla de negocio: "That slot is already taken", "That schedule is blocked", "That Schedule is out of journey", "Cannot book an appointment in the past", "Just can confirm an appointment pending", "This appointment is already cancelled", "This specialty already exists".
- **409** — conflicto de concurrencia (optimistic lock): reintentar.
- **500** — error no controlado (p. ej. chat IA sin API key válida).

El front traduce estos mensajes en `core/http/api-error.ts`; si agregas uno nuevo en el backend, agrégalo ahí.
