---
title: Agenda API — Doctores y Especialidades
---

Parte de [[agenda-api/index]]. Auth: ver [[agenda-api/auth]].

## Listar doctores

`GET /api/personal/doctors?specialtyId={id}&isActive={bool}&page&size&sort`

Roles permitidos: PATIENT, RECEPTIONIST únicamente. NO DOCTOR, NO ADMINISTRATOR (admin usa `GET /api/personal` en su lugar, fuera de scope agenda).

Response: `Page<PersonalResponse>`

## Especialidades

`GET /api/specialties`

Sin `@PreAuthorize` — cualquier rol autenticado.

Response:
```json
[{ "id": 0, "name": "string" }]
```
