# Scheduler — Backend

API REST para agendar citas médicas en varias clínicas. Cada clínica es un tenant aislado en su propio schema de
PostgreSQL (`clinic_<id>`); los datos compartidos (cuentas, roles, clínicas) viven en `public`. Incluye gestión de
personal y pacientes, disponibilidad semanal de doctores con excepciones, reserva de citas, autenticación JWT por rol
y un asistente conversacional con Google Gemini (Spring AI).

## Requisitos

- JDK 26 (el toolchain de Gradle lo descarga si no está instalado)
- PostgreSQL 14+
- API key de Google Gemini

## Levantar el servicio

1. **Crear la base de datos** en PostgreSQL:

   ```sql
   CREATE DATABASE scheduler;
   ```

2. **Configurar las variables de entorno.** Copia `.env.example` a `.env` y completa los valores. La aplicación lee
   el `.env` automáticamente al arrancar.

   | Variable                                                   | Ejemplo                                      |
   |------------------------------------------------------------|----------------------------------------------|
   | `DB_URL`                                                   | `jdbc:postgresql://localhost:5432/scheduler` |
   | `DB_USERNAME` / `DB_PASSWORD`                              | `postgres` / `postgres`                      |
   | `PORT`                                                     | `8080`                                       |
   | `CORS_ALLOWED_ORIGINS`                                     | `http://localhost:5173`                      |
   | `JWT_SECRET`                                               | cadena de al menos 32 caracteres             |
   | `GEMINI_API_KEY`                                           | tu API key de Gemini                         |
   | `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` | `smtp.gmail.com` / `587` / ...            |

3. **Arrancar la aplicación:**

   ```bash
   ./gradlew bootRun        # Linux / macOS
   .\gradlew.bat bootRun    # Windows
   ```

   Al iniciar, Flyway crea las tablas: primero el schema `public` (`db/migration/public`) y luego cada
   schema `clinic_<id>` (`db/migration/tenant`). Si la base está vacía, `DataSeeder` crea dos clínicas de ejemplo;
   todos los usuarios sembrados usan la contraseña `password123` (p. ej. `admin.downtown@clinic.com`, clínica `1`).

4. **Probar la API** en Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### Con Docker

```bash
docker build -t scheduler .
docker run --env-file .env -p 8080:8080 scheduler
```

Si PostgreSQL corre en tu máquina, usa `host.docker.internal` en lugar de `localhost` en `DB_URL`.

## Migraciones

Los cambios de base de datos se agregan como nuevos archivos versionados (`V2__descripcion.sql`, ...); nunca se
editan los ya aplicados.

- `src/main/resources/db/migration/public`: tablas compartidas.
- `src/main/resources/db/migration/tenant`: tablas por clínica. Usa `${flyway:defaultSchema}` como nombre de schema;
  se aplican a todas las clínicas existentes al arrancar y a cada clínica nueva al crearla.

## Tests

```bash
./gradlew test
```
