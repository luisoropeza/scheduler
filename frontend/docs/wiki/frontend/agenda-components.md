---
title: Agenda Frontend — Segmentación de Componentes
---

Segmentación del mockup glass-ui (rama `glass-ui`) del módulo agendar cita en componentes reutilizables. Fecha: 2026-09-24. Backend relacionado: [[agenda-api/index]].

## Convención de carpetas

- `src/app/core/` — lo principal de la app: interceptors, models, services, utils, icons. No UI.
- `src/app/shared/components/` — librería de componentes de formulario (button, input, select) usada por login/register. Diseño plano (rounded-lg).
- `src/app/shared/ui/` — librería de componentes visuales del diseño glass (rounded-2xl/3xl, `glass-panel`, `glass-card`, `glass-modal`) usados por board, calendar y shell. Todos standalone, `input()`/`output()` signals, sin lógica de negocio — solo presentación.
- `src/app/features/<feature>/` — páginas que componen los componentes de `shared/ui` (board, calendar).
- `src/app/layout/shell/` — layout raíz (sidebar + topbar + router-outlet), también compuesto con piezas de `shared/ui`.

## Componentes ya existentes (antes de esta segmentación)

- `board-column`, `board-card` — columnas y tarjetas del Kanban.
- `calendar-day-cell` — celda de día del mes.
- `appointment-list-item` — fila de cita en listas.
- `badge`, `icon`, `loader`, `notification` — átomos genéricos.
- `new-appointment-dialog` — formulario modal de nueva cita.

## Componentes nuevos (sesión de segmentación)

- **`page-header`** (`shared/ui/page-header`) — título + subtítulo opcional (línea aparte, debajo) + slot `[titleAccessory]` (contenido inline junto al título, ej. el filtro de fechas del board) + slot de acciones a la derecha (default). Usado por `board` y `calendar`.
- **`segmented-tabs`** (`shared/ui/segmented-tabs`) — switcher de pastillas genérico `{id, label}[]`. No se usa actualmente, se deja como pieza reutilizable.
- **`calendar-nav`** (`shared/ui/calendar-nav`) — grupo prev/next/today del calendario.
- **`day-agenda-panel`** (`shared/ui/day-agenda-panel`) — panel lateral del calendario.
- **`sidebar-nav`** (`shared/ui/sidebar-nav`) — sidebar del shell. Ancho `w-72` (288px, antes `w-64`/256px).
- **`topbar`** (`shared/ui/topbar`) — barra superior del shell.
- **`date-range-picker`** (`shared/ui/date-range-picker`) — ver sección propia abajo.

## Modal (`new-appointment-dialog`) — restyle a glass (dos rondas)

### Ronda 1 (primer restyle)
Único componente fuera de la línea gráfica original (blanco opaco, `rounded-xl`, inputs planos). `styles.css` ganó `.glass-modal` y `.glass-backdrop`. Formulario reescrito con clases glass. Sin cambios de comportamiento.

### Ronda 2 (esta sesión — "los modals no están quedando bien")
Tras revisar en browser, el restyle de ronda 1 seguía viéndose plano: `.glass-modal` al 85% de opacidad blanca es casi opaco, apenas deja ver/desenfocar color detrás — se percibe como card blanco sólido, no "glass" (confirmado comparando el modal del formulario, que tiene `.glass-backdrop` oscureciendo detrás, contra el popover del `date-range-picker`, que usa la misma clase `.glass-modal` pero sin backdrop oscuro — **ambos** se veían igual de planos, descartando el backdrop como causa; el problema era la opacidad del propio `.glass-modal`).

Además los inputs (`bg-white/60 border-white/70`) eran casi invisibles: blanco sobre un modal casi-blanco, con borde al 70% de opacidad blanca — sin contraste real, los campos se confundían con la tarjeta.

Fixes:
- `.glass-modal` en `styles.css`: opacidad bajada de 85% a **72%** (más cerca de `.glass-card`, 68%, que sí se ve translúcida en el resto de la app), border subido a 85% para mantener definición del borde.
- Inputs/select del formulario: de `bg-white/60 border-white/70` (blanco sobre blanco, invisible) a **`bg-gray-900/[0.04] border-gray-900/10` + `shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]`** — campo gris tenue "recesado" con sombra interior, se distingue claramente del card sin romper el minimalismo. En foco: `focus:bg-white focus:border-primary/40 focus:shadow-none` + el ring ya existente — el campo "sale" a blanco sólido al escribir, look premium común en formularios minimal (iOS/macOS-style).

Verificado en browser: modal del calendario (`New Appointment`) y popover del `date-range-picker` (mismo `.glass-modal`) — campos ahora se leen como pozos recesados distintos del card, focus state pasa a blanco con ring azul, texto legible en todo momento.

## Board (`/board`) — limpieza según swagger

Mock original simulaba 3 "workflows" con columnas libres y tarjetas con `priority`/`reason`/`waitMinutes` — nada de eso existe en el backend. Según [[agenda-api/admin-board]] el board solo tiene 3 estados fijos (`PENDING`/`CONFIRMED`/`CANCELLED`) y el único filtro real es `from`/`to`.

- `core/models/board.model.ts` — `Workflow` eliminado. `AppointmentStatus`, `BoardAppointment { id, clientName, doctorName?, appointmentDate, appointmentTime, status }`.
- `core/services/appointments.service.ts` — mock plano de `BoardAppointment[]`.
- `shared/ui/board-card` — solo `clientName`/`appointmentTime`/`doctorName`. Sin badge de prioridad.
- `shared/ui/board-column` — tipado a `BoardAppointment` (`Appointment` con `priority`/`reason` sigue existiendo solo para `calendar`).
- `features/board/board.component.ts` — columnas fijas (`COLUMN_DEFS`: Pending/Confirmed/Cancelled) filtradas por `dateFrom`/`dateTo`.

Drag-and-drop entre columnas no persiste a backend (mock, no regresión). Board sigue en datos mock.

## Shell — layout centrado + topbar como pieza del sistema

Layout capado con `max-w-[1680px]` centrado (fondo degradado sigue a pantalla completa). `topbar` agrupa campanita+avatar en un pill `glass-panel`. Sin scroll global — cada sección con su propio `overflow-y-auto`/`overflow-x-auto` (ya estaba resuelto).

## Date-range-picker — reemplazo de los `<input type="date">` nativos

Se construyó propio (no se instaló librería: el proyecto ya tenía el motor de calendario de `/calendar` — `buildMonthMatrix`, `formatMonthLabel`, `toIso`/`parseIso` — y no hay Material/PrimeNG instalado; una librería de terceros pelearía contra el theming glass).

`shared/ui/date-range-picker`:
- Popover `glass-modal` anclado bajo el trigger, cierra con capa `fixed inset-0` invisible (mismo patrón que `shared/components/select-component`, sin `@angular/cdk/overlay`).
- Selección estilo Airbnb: 1er click fija inicio (popover sigue abierto, hover-preview del rango), 2do click fija fin y cierra+aplica solo; si el 2do click es anterior al 1ro se invierten. Click repetido reinicia a un solo día.
- Presets: "Today", "Next 7 days", "This month".
- Ubicación final: chip con fondo `bg-gray-900/[0.05]` en línea junto al título "Appointments" (`page-header`'s slot `[titleAccessory]`).

## Fixes de recorte por `overflow` (esquinas del calendario + hover de cards)

Dos contenedores con `overflow-y-auto` cortaban el `box-shadow` de sus hijos porque no tenían margen de holgura (el navegador clipea en el borde del *padding box*, y `overflow-y-auto` vuelve el `overflow-x` efectivo `auto` también por spec CSS).

- **Grilla de días de `/calendar`**: anillo de selección se cortaba en las 4 esquinas. Fix: `-m-2 ... p-2` (margen negativo + padding igual, cancela el desplazamiento visual pero mueve el punto de clip 8px más afuera).
- **Lista de citas del día en `day-agenda-panel`**: primera card se cortaba al hacer hover (`.glass-card:hover` levanta `-6px` + sombra mayor). Mismo truco, `pt-3.5` en vez de `p-2` parejo para conservar el gap visual original.

Verificado en browser: las 4 esquinas de septiembre 2026 (31, 6, 5, 11) con anillo completo; hover de la primera card ya no se corta.

## Sobre `docs/` — dejó de ser un repo git anidado

`docs/` (este wiki) era un repo git separado (`docs/.git`), sin remote, trackeado como gitlink roto (sin `.gitmodules` real) dentro de `scheduler-front`. Se unificó: se borró `docs/.git` y se re-trackeeron los archivos como parte normal del repo principal (`git rm --cached -f docs && rm -rf docs/.git && git add docs`). `docs/.gitignore` (que excluye `.waqwaq/tokens.json` y `.waqwaq/proposals/`) sigue aplicando igual aunque el archivo en sí está ignorado por una regla global `.gitignore` del repo padre. Pendiente de confirmar en la práctica: si el propio server de wiki intenta comitear internamente al escribir páginas, ahora ese commit cae en el `.git` del proyecto principal en vez de uno separado — a vigilar que no arrastre cambios de la app que estén *staged* sin commitear en ese momento.

## Pendiente / no tocado

- `shared/components/*` (button/input/select del flujo login-register) — diseño distinto, fuera de scope glass-ui.
- SVG inline duplicados en `board-card`/`appointment-list-item` — no migrados al `icon-registry`.
- Validación del formulario del modal no muestra mensajes de error en UI (gap preexistente).
- `calendar` no usa `date-range-picker` (sigue con `calendar-nav` propio) — fuera de scope, no se pidió.
- Board no filtra por `doctorId`/`patientId` aún.
- Board sigue en datos mock, no conectado a `GET /api/appointments/board` real.
