# Reporte QA — Portal Scheduler

Fecha: 2026-10-09 · Rama: `develop`
Fuentes: `code-reviewer` (endpoints + código), `ui-ux-expert` (UX/responsive/a11y), `ui-tester` (funcional, en curso).

---

## 1. Endpoints faltantes / desalineados

### 1.1 El front llama endpoints que NO existen en el backend

| Método | Ruta | Usado en | Efecto en UI |
|---|---|---|---|
| GET | `/api/auth/me` | `AuthApi.me` → página **Perfil** | 404: el perfil nunca carga (todos los roles) |
| DELETE | `/api/doctorAvailability/{id}` | `AgendaApi.removeAvailability` → **Disponibilidad** | "Quitar horario" siempre falla |
| GET | `/api/scheduleException?from` | `AgendaApi.exceptions` → **Disponibilidad** | 405: la lista de bloqueos sale vacía |
| DELETE | `/api/scheduleException/{id}` | `AgendaApi.removeException` → **Disponibilidad** | "Quitar bloqueo" siempre falla |

### 1.2 Endpoints del backend que el front no usa

| Método | Ruta | Comentario |
|---|---|---|
| GET | `/api/account/{ci}` | Sin pantalla que lo necesite |
| GET | `/api/patients/{id}` | No usado (método eliminado del front) |
| GET | `/api/personal/{id}` | No usado (método eliminado del front) |
| GET | `/api/roles` | El front usa IDs de rol fijos |

Ninguno es necesario para las pantallas actuales.

### 1.3 Desajustes de contrato (DTO)

| # | Problema | Impacto |
|---|---|---|
| G1 | `ErrorResponse.errors` es `{field, message}[]`, el front esperaba `string[]` | Errores de validación mostraban "[object Object]" — **corregido en el front** |
| G2 | `AppointmentSummaryItem` (board/calendar) sólo trae `clientName, doctorName, appointmentDate, appointmentTime` — falta `id, startTime, endTime, status, doctorId, patientId` | Drag & drop del tablero y abrir detalle en tablero/calendario/dashboard no funcionan; horas PM mal parseadas si el servidor está en español |
| G3 | `POST /api/appointments` siempre guarda CONFIRMED y confía en `patientId` del body | Un paciente puede agendar a nombre de otro (**seguridad**); el mensaje "la clínica confirmará tu cita" es falso |
| G4 | `PUT /api/personal/update/{id}` ignora `specialtyId` | Cambiar especialidad de un doctor no hace nada |
| G5 | `AppointmentResponse.status` viene como texto en español ("Confirmado") | Contrato frágil; el front lo traduce de vuelta |
| — | `POST /api/scheduleException` sin `@PreAuthorize` | Cualquier rol puede crear bloqueos; debería ser sólo DOCTOR |
| — | `@PageableDefault(sort="schedule.startTime")` en `AppointmentController:54` | Campo inexistente; oculto porque el front siempre manda `sort` |

### 1.4 Tareas de backend propuestas (no implementadas)

| Tarea | Cambio | Archivos |
|---|---|---|
| BE-1 | Agregar `id, startTime, endTime, status, doctorId, patientId` al summary item | `AppointmentSummaryItem.java`, `AppointmentServiceImpl.toSummaryItem` |
| BE-2 | `GET /scheduleException?from`, `DELETE /scheduleException/{id}`, `DELETE /doctorAvailability/{id}`; POST scheduleException sólo DOCTOR | ScheduleException*/DoctorAvailability* controller/service/repo |
| BE-3 | `GET /api/auth/me` → `{id, ci, name, email, phoneNumber, role, specialtyName}` | `AuthController`, `AuthService`, nuevo `ProfileResponse` |
| BE-4 | Booking de PATIENT: forzar `patientId` = usuario actual y estado PENDING | `AppointmentController`, `AppointmentServiceImpl` |
| BE-5 | Aplicar `specialtyId` al actualizar personal | `PersonalMapper` / `PersonalServiceImpl` |
| BE-6 | Corregir sort por defecto a `startTime` | `AppointmentController.java:54` |

Prioridad: **BE-4** (seguridad) y **BE-1** (revive tablero + detalle en 3 pantallas).

---

## 2. UX / Responsive / Accesibilidad (ui-ux-expert)

Probado en 360 / 768 / 1280 / 1920 con usuarios seed admin, doctor y paciente.

| # | Sev | Problema | Estado |
|---|---|---|---|
| B1 | blocker | Sidebar sin modo móvil: a 360px el contenido queda fuera de pantalla | ✅ Drawer off-canvas |
| B2 | blocker | `backdrop-filter` no aplicaba en Chrome/Edge/Firefox (sólo `-webkit-`) | ✅ Corregido en `styles.css` |
| B3 | blocker | Login/registro: labels no asociados, sin `autocomplete`, sin separación | ✅ Reescritos con inputs nativos glass |
| B4 | blocker | Booking: a 768px la columna de pasos colapsa a 0 | ✅ Corregido |
| B5 | blocker | Calendario ilegible a 768px | ✅ Corregido |
| B6 | blocker | Citas sólo abren con click (sin teclado) | ✅ Corregido |
| B7 | blocker | "Quitar horario" sólo visible con hover | ✅ Corregido |
| M1–M12 | major | Estados de error vs vacío, contraste `gray-400`, foco, toasts a 360px, nombre accesible de diálogos, tablero, copy inconsistente | ✅ Corregido (salvo lo indicado abajo) |
| m1–m12 | minor | Tabs overflow, tablas en móvil, títulos, targets pequeños, reduced-motion, etc. | ✅ Corregido (salvo lo indicado abajo) |

---

## 3. Calidad de código (code-reviewer)

| # | Sev | Problema | Estado |
|---|---|---|---|
| B1 | high | Errores "[object Object]" | ✅ `api-error.ts`, `api.models.ts` |
| B7 | medium | `shared/components` (input/button/select) era un segundo sistema de formularios con CVA defectuoso | ✅ Eliminado |
| B8 | medium | Código muerto: badge, loader, `PatientsApi.get`, `StaffApi.get`, `CatalogsApi.roles` | ✅ Eliminado |
| B9 | medium | Subscribe anidado ocultaba fallo al asignar paciente | ✅ Pipeline con `switchMap` + manejo de error |
| B10 | low | Ningún componente usa `OnPush` | Pendiente (hacer al final, toca todo) |
| B11 | low | Estados dependen del texto en español del backend | Pendiente (requiere G5) |
| B12 | low | `core/navigation` importa tipo de `shared/ui` | Pendiente |
| B13 | low | Segundo sistema de íconos para 3 SVG | Pendiente |

---

## 4. Pruebas funcionales (ui-tester)

Cobertura: 13 rutas × 4 roles (admin, doctor, asistente, paciente — Downtown Clinic) × 4 viewports (360/768/1280/1920).

### 4.1 Llamadas API fallidas

| Llamada | Estado | Origen | Causa |
|---|---|---|---|
| `GET /api/auth/me` | 404 | `/profile` | No existe (BE-3) |
| `GET /api/scheduleException?from` | 405 | `/availability` | Sólo existe POST (BE-2) |
| `DELETE /api/doctorAvailability/{id}` | 405 | "Quitar horario" | No existe (BE-2) |
| `DELETE /api/scheduleException/{id}` | 405 | "Quitar bloqueo" | No existe (BE-2) |
| `GET /api/appointments/{id}` | **500** | Diálogo de detalle de cita | Error del servidor en `findAppointmentById` — **nuevo, BE-7** |
| `PATCH /api/appointments/{id}/cancel` | **500** | "Cancelar cita" | Error del servidor en `cancelAppointmentById` — **nuevo, BE-7** |
| `GET /api/appointments` (sort por defecto) | 500 | Sólo vía API | `sort="schedule.startTime"` (BE-6) |
| `POST /api/specialties` | 406 / 409 | Especialidades | Nombre duplicado o demasiado largo |

### 4.2 Hallazgos

| # | Sev | Problema | Front | Backend |
|---|---|---|---|---|
| 1 | **critical** | Doble click en "Agendar cita" crea dos citas en el mismo horario | Guard síncrono + botón deshabilitado | **BE-8:** validar solapamiento / constraint único (doctor, inicio) |
| 2 | **critical** | Ver detalle y cancelar cita dan 500: el staff no tiene forma de ver ni cancelar citas | — | **BE-7:** revisar log/stacktrace |
| 3 | high | Tarjetas del tablero no hacen nada (`id = null`) | No renderizarlas como botón si no hay `id` | BE-1 |
| 4 | high | El perfil nunca carga | Estado de error ✅ | BE-3 |
| 5 | high | Bloqueos de agenda: no se listan ni se quitan | Estado de error ✅ | BE-2 |
| 6 | medium | El texto dice "pendiente" pero la cita se crea CONFIRMED; la columna "Pendientes" no se usa nunca | — | BE-4 |
| 7 | medium | Especialidad duplicada muestra "correo o CI"; doble POST; nombre sin `maxlength` | Corregir mensaje, guard, `maxLength` | — |
| 8 | medium | Tabs de estado inalcanzables a 360px | `min-w-0 max-w-full` | — |
| 9 | medium | Paneles del dashboard desbordan a 360px | `grid-cols-1` + `min-w-0` | — |
| 10 | medium | Tablas a 360px con acciones fuera de pantalla | Columnas secundarias ocultas ✅; layout de tarjetas pendiente | — |
| 11 | low | El chat del asistente muestra markdown crudo | Pendiente (requiere un renderer) | — |
| 12 | low | Búsqueda de pacientes sin resultados muestra "Registra al primer paciente" | Mensaje específico | — |
| 13 | low | Botón de fecha de 73×20px; el campo CI del staff acepta letras | `min-h-6`; `Validators.pattern` | — |

### 4.3 Funciona correctamente

- Guards y redirecciones por rol, y logout.
- Login con error de credenciales y registro con validación.
- Alta y edición de staff, con validación inline.
- Alta de especialidad.
- Disponibilidad semanal, incluida la validación de que el fin sea posterior al inicio.
- Reserva como paciente.
- Calendario mensual.
- Asistente IA.
- Diálogos: focus trap, Esc y retorno de foco.
- Sin errores NG0 y sin scroll horizontal del documento.

### 4.4 Sin probar

- Clínica Uptown y el envío del registro de clínica.
- Paginación (hay menos de 12 citas).
- Confirmar una cita (no pueden existir citas PENDING).
- Envío del alta y la edición de paciente.
- Comportamiento con el backend caído.

### 4.5 Datos de prueba creados (no se pueden borrar desde la UI)

- Especialidad `QA Esp 71399 <b>&"`.
- Doctor `Dr. QA Edited 563327`.
- 3 citas de John Smith con la Dra. Ana García el 12/10 (09:00 duplicada y 09:30).
- Disponibilidad de Ana los lunes de 09:00 a 13:00.
- Posible bloqueo el 25/12.

### 4.6 Tareas de backend adicionales

| Tarea | Cambio |
|---|---|
| BE-7 | Corregir el 500 en `GET /appointments/{id}` y `PATCH /appointments/{id}/cancel` |
| BE-8 | Rechazar una reserva que se solape con otra del mismo doctor (validación en el servicio + constraint único) |

---

## 5. Notas de implementación

- **B6 parcial:** Enter y Space ya funcionan en las tarjetas del tablero y del calendario, pero el detalle sigue sin abrirse porque el backend envía `id = null` (G2). Depende de **BE-1**.
- **Perfil y Disponibilidad:** ahora muestran un error con el botón "Reintentar" en lugar de quedar vacíos. La funcionalidad depende de **BE-2** y **BE-3**.
- **`dialog-frame`:** usa `_addAriaLabelledBy` del CDK, una API semi-interna. Hay que revisarla al actualizar `@angular/cdk`.
- **Tabla de citas a 360px:** no se ocultaron columnas porque "Doctor" es la información principal. La tabla hace scroll dentro de su panel.

---

## 6. Segunda revisión (code-reviewer) y correcciones aplicadas

Build: OK · Tests: 13/13 OK (`ng test --watch=false --browsers=ChromeHeadless`)

| Sev | Hallazgo | Estado |
|---|---|---|
| medium | El spec usaba el formato de error viejo (test en rojo); un mensaje `null` dejaba el toast en blanco | ✅ |
| medium | El drawer no se cerraba al tocar la ruta actual; el focus trap seguía activo al pasar a `lg` | ✅ |
| medium | Fondo con gradiente y blobs duplicado en 4 páginas | ✅ Nuevo componente `shared/ui/glass-background` |
| low | `errorOf` duplicado en 5 componentes | ✅ `fieldError()` en `validation-messages.util.ts` |
| low | Clinic-options: estados de error y vacío propios | ✅ `app-empty-state` |
| low | El perfil ignoraba `apiErrorMessage` | ✅ |
| low | El date-range-picker anunciaba un diálogo sin mover el foco | ✅ `cdkTrapFocus` + autoCapture |
| low | Si se crea el paciente pero falla la asignación, se pierde el aviso de éxito | ✅ Mensaje combinado |
| low | `RoleOption` sin uso; `}}` sobrante en `catalogs.api.ts` | ✅ |

### Pendiente

- **Backend:** BE-1 a BE-6 (sección 1.4).
- **Front, una vez hecho BE-1:** eliminar el workaround `AppointmentSummaryWire`, `toSummaryItem` y `to24h`.
- **Front, una vez hecho G5:** eliminar `statusFromDisplay`.
- **OnPush (B10):** aplicarlo en todos los componentes como cambio aislado.

---

## 7. Correcciones de los hallazgos del ui-tester

Build: OK · Tests: 14/14 OK

| # | Corrección | Estado |
|---|---|---|
| 1 | Guard síncrono contra doble envío en booking, especialidades, staff, disponibilidad, bloqueos, paciente, perfil, login, registro y detalle de cita | ✅ (falta **BE-8** del lado del servidor) |
| 7 | Mensaje "ya existe" neutral (sólo menciona correo o CI si el backend lo indica); `maxlength="255"` en especialidad | ✅ |
| 8 | Tabs de estado con scroll a 360px | ✅ |
| 9 | Dashboard a 360px | ✅ |
| 3 | Las tarjetas sin `id` ya no se presentan como botón ni son arrastrables | ✅ (falta **BE-1**) |
| 12 | Mensaje específico para una búsqueda sin resultados | ✅ |
| 13 | Botones de fecha de 24px; CI del staff sólo acepta dígitos | ✅ ⚠ Si existen CIs con letras (ej. `1234567-1A`), hay que ajustar el patrón |
| 10, 11 | Tablas como tarjetas en móvil; renderizar markdown en el chat | ⏸ Omitido |
