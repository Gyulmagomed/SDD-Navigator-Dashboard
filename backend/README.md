# SDD Navigator API (Go)

Production-oriented REST API for the [SDD Navigator Dashboard](../README.md): specifications, coverage metrics, dashboard stats, reports, and JWT authentication.

## Stack

| Layer | Technology |
|-------|------------|
| HTTP router | [chi](https://github.com/go-chi/chi) |
| Database | PostgreSQL 16 + [pgx](https://github.com/jackc/pgx) |
| Auth | JWT (HS256) + bcrypt passwords |
| Logging | `log/slog` (structured JSON in production) |
| Docs | [swaggo/swag](https://github.com/swaggo/swag) |
| Observability | Request lifecycle spans + OpenTelemetry hook (`OTEL_ENABLED`) |

## Architecture

```
cmd/api/main.go          # bootstrap, graceful shutdown
internal/
  config/                # env loading + validation
  handler/               # HTTP adapters only
  service/               # business rules
  repository/postgres/   # SQL / DB access
  middleware/            # request id, logging, tracing, cors, jwt, recovery
  observability/         # trace/request context helpers
  httputil/              # unified JSON responses
  apperror/              # typed HTTP errors
  domain/                # entities + DTOs
docs/                    # generated Swagger (make swagger)
```

**Rules enforced in this codebase**

- Handlers parse HTTP, call services, write JSON — no SQL or business rules.
- Services orchestrate repositories and return domain errors.
- Repositories use parameterized queries only (`$1`, `$2`, …).

## API (compatible with the dashboard)

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | No |
| POST | `/auth/login` | No |
| POST | `/auth/refresh` | No |
| GET | `/dashboard/stats` | Bearer JWT |
| GET | `/specifications` | Bearer JWT |
| GET | `/specifications/{id}` | Bearer JWT |
| GET | `/coverage/{specId}` | Bearer JWT |
| GET | `/reports/export/{specId}?format=pdf\|csv\|json` | Bearer JWT |
| GET | `/swagger/index.html` | No |

Success body shape (matches `types/index.ts` on the frontend):

```json
{
  "data": {},
  "meta": { "page": 1, "pageSize": 20, "total": 30, "totalPages": 2 }
}
```

Error body (also exposes `message` for the existing Axios client):

```json
{
  "error": "unauthorized",
  "message": "unauthorized",
  "code": "unauthorized"
}
```

## Environment variables

Copy [`.env.example`](./.env.example) to `.env` in this directory.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL DSN |
| `JWT_SECRET` | Yes | Min 32 characters |
| `HTTP_PORT` | No | Default `4000` |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated, default `http://localhost:3000` |
| `JWT_ACCESS_TTL` | No | Default `15m` |
| `JWT_REFRESH_TTL` | No | Default `168h` |
| `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` | No | Seeded on first run (`test@test.com` / `123456`) |
| `OTEL_ENABLED` | No | Placeholder for future OTLP exporter |

## Local setup

**Requirements:** Go 1.23+, PostgreSQL 16 (or Docker Compose below).

```bash
cd backend
cp .env.example .env
# edit JWT_SECRET (32+ chars) and DATABASE_URL

docker compose up -d postgres   # optional: only DB
go run ./cmd/api
```

Swagger UI: [http://localhost:4000/swagger/index.html](http://localhost:4000/swagger/index.html)

Regenerate docs after handler changes:

```bash
make swagger
```

## Docker

Full stack (API + Postgres):

```bash
cd backend
export JWT_SECRET=your-local-secret-at-least-32-characters-long
docker compose up --build
```

API health: `GET http://localhost:4000/health`

## Connect the Next.js dashboard

1. Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in the frontend `.env.local`.
2. Wire NextAuth to the backend by using [`lib/auth.ts`](../lib/auth.ts) in `app/api/auth/[...nextauth]/route.ts` (replaces inline demo credentials).
3. Login with the demo user from `.env.example` (`test@test.com` / `123456`).

> The built-in demo NextAuth route issues `mock-token`, which this API **does not** accept. Use real `/auth/login` when testing against this backend.

## API examples

**Login**

```bash
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

**Dashboard stats**

```bash
TOKEN=<accessToken from login>
curl -s http://localhost:4000/dashboard/stats -H "Authorization: Bearer $TOKEN"
```

**Specifications (page 1)**

```bash
curl -s "http://localhost:4000/specifications?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"
```

## Security notes

- Passwords stored as bcrypt hashes; secrets only via env (never committed).
- JWT validated on protected routes; refresh tokens are typed separately from access tokens.
- CORS uses an explicit allow-list (no `*` with credentials).
- SQL uses bound parameters throughout repositories.
- Panics are recovered and returned as `500` JSON (no stack traces to clients).

## Commands

```bash
make run      # go run ./cmd/api
make build    # compile to bin/api
make swagger  # regenerate docs/
make tidy       # go mod tidy
```
