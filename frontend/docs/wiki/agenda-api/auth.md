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

## Perfil

`GET /api/auth/me` — cualquier rol autenticado → `{ id, ci, name, email, phoneNumber, role, specialtyName }`.
Actualización: PATIENT `PUT /api/patients/update`, DOCTOR/ASSISTANT `PUT /api/personal/update`, ADMINISTRATOR `PUT /api/personal/update/{id}`.

## Registro

`POST /api/clinics` (público) registra una clínica nueva con su administrador `{ name, phoneNumber, adminName, adminEmail, adminPassword, adminCi }`. No hay auto-registro de pacientes ni de staff:
- Pacientes: creados por DOCTOR o ASSISTANT vía `POST /api/patients`.
- Staff: creado por ADMINISTRATOR vía `POST /api/personal`.

## Content-Type

Todo request con body necesita `Content-Type: application/json`.

## CORS

`CORS_ALLOWED_ORIGINS`. En desarrollo el front usa el proxy de `ng serve`, así que no aplica.
