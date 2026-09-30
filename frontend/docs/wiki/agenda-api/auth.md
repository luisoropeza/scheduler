---
title: Agenda API — Auth
---

Parte de [[agenda-api/index]].

## Login

`POST /api/auth/login` — público, sin token.

Request:
```json
{ "email": "string", "password": "string", "clinicId": 0 }
```
`clinicId` obligatorio — backend es schema-per-tenant, un JWT queda ligado a una sola clínica.

Response:
```json
{ "token": "string" }
```
JWT, expira en 24h. Sin endpoint de refresh.

Uso: header `Authorization: Bearer <token>`.

JWT encoda: `sub` = id usuario (`Personal.id` para staff, `Patient.id` para pacientes — NO `Account.id`), `role`, `clinicId`, `username`.

## Registro

No hay endpoint público de auto-registro, ni para pacientes ni para staff.
- Pacientes: creados por DOCTOR o RECEPTIONIST vía `POST /api/patients`.
- Staff: creado por ADMINISTRATOR vía `POST /api/personal`.

## Content-Type

Todo request con body necesita `Content-Type: application/json`.

## CORS

Abierto por defecto (env var `cors.allowed-origins`, default `"*"`).
