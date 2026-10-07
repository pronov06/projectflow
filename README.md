# ProjectFlow

A project and task management system with a **React web app** and an **Android app** (Expo / React Native). Both apps share **one Node.js + Express REST API** and **one PostgreSQL database**: register on either, log in on both, and see the same projects and tasks.

[![CI](https://github.com/pronov06/projectflow/actions/workflows/ci.yml/badge.svg)](https://github.com/pronov06/projectflow/actions/workflows/ci.yml)

## Live links

| | URL |
|---|---|
| 🌐 Web app | _TBD — filled after deployment_ |
| ⚙️ API | _TBD_ |
| 📖 API docs (Swagger) | _TBD_/api/docs |
| 📱 Android APK | _TBD_ |
| 🎬 Demo video (5 min) | _TBD_ |

> Hosting: web app, API (serverless functions) and PostgreSQL (Neon, via the Vercel integration) all run on Vercel's free tier.

**Test account** (seeded demo data, not real people): `alice@example.com` / `Password123!`. You can also register a new account. A second account, `bob@example.com`, has its own private data, so you can check that users can't see each other's projects.

---

## Features

**Both apps:**
- Register, log in and log out with one account
- A dashboard showing total projects, total tasks, completed tasks, pending tasks, projects in progress and overdue tasks
- Projects: create, view, edit and delete (create/edit/delete is web-only; mobile shows the projects and their tasks)
- Tasks: create, edit and delete, mark complete, and change status or priority inline
- Search by name; filter projects by status and tasks by status and priority; sorting; pagination

**Web:**
- Responsive layout: sidebar on desktop, drawer on phones
- Form validation, skeleton loaders, toasts, confirmation before deleting, error boundary, offline banner

**Mobile:**
- Pull-to-refresh everywhere
- Tokens stored in the Android Keystore (expo-secure-store)
- An expired session sends you back to the login screen with a clear message
- No network: a clear offline message (never a crash), plus offline viewing of cached data

**Security:**
- bcrypt password hashing
- JWT access tokens plus rotating refresh tokens
- Ownership checks on every query (another user's data returns 404)
- Validation on every request with shared zod schemas
- Rate limiting, helmet, CORS allowlist; Prisma's parameterised queries prevent SQL injection

See [`docs/REQUIREMENTS_CHECKLIST.md`](docs/REQUIREMENTS_CHECKLIST.md) for every requirement mapped to its code and tests.

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Node.js 22, **Express 5**, TypeScript, **Prisma 6**, zod, jsonwebtoken, bcryptjs, helmet, express-rate-limit, pino |
| Database | **PostgreSQL** (Neon in production) |
| Web | **React 19**, Vite, TypeScript, React Router, TanStack Query, react-hook-form, Tailwind CSS 4 with a strict token system ([docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)) |
| Mobile | **Expo SDK 57** (React Native 0.86), expo-router, TanStack Query, expo-secure-store, NetInfo |
| Shared | `@pms/shared`: zod schemas, enums and TypeScript types used by all three apps |
| Testing | Vitest, Supertest (against real Postgres), Testing Library |
| DevOps | GitHub Actions CI, Docker and docker-compose, Vercel (web + API as serverless functions), Neon (PostgreSQL), EAS Build (APK); Docker + `render.yaml` as alternative hosting |

## Architecture

```mermaid
flowchart LR
  W["Web app (React, Vercel)"] -- "/api/* via Vercel rewrite" --> A
  M["Android app (Expo)"] -- "HTTPS + JWT" --> A
  A["REST API (Express, Vercel Functions)"] -- Prisma --> D[("PostgreSQL (Neon)")]
```

```
apps/
  api/       Express API: src/{config, middleware, modules/{auth,projects,tasks,dashboard,audit}, utils, docs}, prisma/, tests/
  web/       React app: src/{api, auth, components, features, pages, lib}
  mobile/    Expo app: app/ (expo-router screens), src/{api, auth, components, lib}
packages/
  shared/    zod schemas + types shared by api, web and mobile
docs/        API.md, DATABASE.md (ER diagram), DECISIONS.md, DEMO_SCRIPT.md, REQUIREMENTS_CHECKLIST.md, postman_collection.json
```

Design rationale (auth, 404-vs-403, normalisation, trade-offs) is in [`docs/DECISIONS.md`](docs/DECISIONS.md).

---

## Running locally

**Prerequisites:** Node.js **20.19+** (22 LTS recommended) and npm 10+. PostgreSQL is optional: there's a built-in embedded Postgres, or you can use Docker.

```bash
git clone https://github.com/pronov06/projectflow.git
cd projectflow
npm install                 # installs all workspaces (api, web, mobile, shared)
```

### 1. Database

Pick **one** option.

```bash
# Option A: no install needed. Embedded PostgreSQL on port 5433 (keep this terminal open).
npm run db:local -w @pms/api

# Option B: Docker
docker run -d --name projectflow-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=projectflow -p 5433:5432 postgres:17-alpine

# Option C: your own PostgreSQL or a free Neon database. Just put its URL in apps/api/.env
```

### 2. Backend API

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env:
#   - DATABASE_URL / DIRECT_URL, e.g. postgresql://postgres:postgres@localhost:5433/projectflow?schema=public
#   - JWT_ACCESS_SECRET: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm run db:deploy -w @pms/api       # apply migrations
npm run db:seed -w @pms/api         # optional demo data (alice / bob)
npm run dev:api                     # http://localhost:4000  (Swagger: http://localhost:4000/api/docs)
```

### 3. Web app

```bash
npm run dev:web                     # http://localhost:5173  (Vite proxies /api to localhost:4000)
```

### 4. Mobile app

**Option A: install the APK** (see *Live links*). It's already configured to use the deployed backend.

**Option B: run from source with Expo Go** (Android phone, Expo Go from the Play Store):

```bash
cd apps/mobile
cp .env.example .env
# Set EXPO_PUBLIC_API_URL in .env:
#   deployed backend: https://<api-host>                 (recommended)
#   local backend:    http://<your-PC-LAN-IP>:4000       (phone on the same Wi-Fi; allow port 4000 in the firewall)
#   Android emulator: http://10.0.2.2:4000
npx expo start                      # scan the QR code with Expo Go
```

**Build your own APK** (needs a free expo.dev account):

```bash
cd apps/mobile
npx eas-cli login
npx eas-cli build -p android --profile preview   # EXPO_PUBLIC_API_URL comes from eas.json
```

### Docker (full stack)

```bash
docker compose up --build           # web http://localhost:8080 · API http://localhost:4000/api/docs
docker compose exec api npx tsx prisma/seed.ts   # optional demo data
```

---

## Environment variables

### API (`apps/api/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string used at runtime (pooled on Neon) |
| `DIRECT_URL` | ✅ | — | Direct (non-pooled) connection for `prisma migrate`. Same as `DATABASE_URL` locally |
| `JWT_ACCESS_SECRET` | ✅ | — | HMAC secret, **at least 32 characters**. The server refuses to start without it |
| `CORS_ORIGINS` | ✅ | — | Comma-separated web origins allowed to call the API, e.g. `https://projectflow.vercel.app` |
| `NODE_ENV` | | `development` | `development` \| `test` \| `production` |
| `PORT` | | `4000` | HTTP port |
| `JWT_ACCESS_TTL_SECONDS` | | `900` | Access token lifetime (15 min) |
| `REFRESH_TOKEN_TTL_DAYS` | | `7` | Refresh token / session lifetime |
| `COOKIE_SECURE` | | `true` in production | `Secure` flag on the refresh cookie (`false` for plain-http localhost) |
| `TRUST_PROXY` | | `0` | Number of proxies in front of the API (`1` on Vercel/Render), for correct client IPs |
| `BCRYPT_ROUNDS` | | `12` | bcrypt cost factor |
| `RATE_LIMIT_LOGIN_MAX` | | `5` | Failed logins allowed per IP + email per window |
| `RATE_LIMIT_LOGIN_WINDOW_MINUTES` | | `15` | Login limiter window |
| `RATE_LIMIT_REGISTER_MAX` | | `10` | Registrations per IP per hour |
| `RATE_LIMIT_API_MAX` | | `300` | Requests per IP per 15 min across the API |
| `LOG_LEVEL` | | `info` | pino log level (`silent` in tests) |

### Web (`apps/web`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | | API base URL. **Defaults to `/api`** (same origin), which the Vite dev proxy or the Vercel rewrite in `apps/web/vercel.json` forwards to the API. |
| `VITE_DEV_API_PROXY` | | Dev only: where Vite proxies `/api` (default `http://localhost:4000`) |

### Mobile (`apps/mobile/.env` or `eas.json` → `env`)

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | ✅ | API origin without `/api`, e.g. `https://projectflow-api.vercel.app` |

---

## Testing

```bash
# API tests need a test database: set DATABASE_URL/DIRECT_URL in apps/api/.env.test
#   (database name must contain "test", e.g. .../projectflow_test). The embedded server creates one.
npm test                                  # all workspaces
npm test -w @pms/api                      # 70+ API unit + integration tests (real PostgreSQL)
npm run test:coverage -w @pms/api
npm test -w @pms/web                      # web component tests
npm test -w @pms/shared                   # shared schema tests
npm run lint && npm run typecheck

# Against a deployed API (HTTPS only): 17 end-to-end checks; --seed also loads the demo accounts
node scripts/prod-check.mjs https://<api-host> --seed
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, every test suite against a Postgres service container, the API and web builds, and both Docker image builds on each push.

## Deployment

| Part | Host | How |
|---|---|---|
| Database | Neon PostgreSQL (Vercel → Storage → Neon) | Connect it to the API project. Vercel injects `DATABASE_URL` (pooled); add `DIRECT_URL` = the unpooled URL, which migrations use. |
| API | Vercel (Functions) | Import the repo with **Root Directory = `apps/api`**. [`apps/api/vercel.json`](apps/api/vercel.json) builds with tsup, runs `prisma migrate deploy`, and routes every request to the Express app ([`api/index.js`](apps/api/api/index.js)). Set `JWT_ACCESS_SECRET`, `CORS_ORIGINS`, `TRUST_PROXY=1` and `NODE_ENV=production`. |
| Web | Vercel | Import the repo again with **Root Directory = `apps/web`**. [`apps/web/vercel.json`](apps/web/vercel.json) rewrites `/api/*` to the API project, so the refresh cookie stays first-party. |
| Alternative | Any Node host / Docker | `npm run start -w @pms/api`, `docker compose up`, or [`render.yaml`](render.yaml) (Render Blueprint). |
| Android | EAS Build | `npx eas-cli build -p android --profile preview` produces an installable APK link |

## Documentation

- [API reference](docs/API.md), plus Swagger UI at `/api/docs` and a [Postman collection](docs/postman_collection.json)
- [Database schema and ER diagram](docs/DATABASE.md) ([SVG](docs/er-diagram.svg))
- [Design system (tokens, components, auth layout)](docs/DESIGN_SYSTEM.md)
- [Design decisions and trade-offs](docs/DECISIONS.md)
- [Requirements checklist](docs/REQUIREMENTS_CHECKLIST.md)
- [Demo script](docs/DEMO_SCRIPT.md)

## Known limitations and future work

- Serverless cold starts add about 1 s to the first request after idle.
- Rate-limit counters are in memory per function instance. On serverless, a burst can be spread across instances; production would use a shared store (Redis / Upstash).
- Projects are created and edited on the web; the mobile app views them and manages tasks, per the brief.
- Not done yet: admin UI on top of the existing role claim, push notifications for tasks due tomorrow, offline *writes* on mobile, E2E tests.

---

All data in this project is test data. No real personal data is used.
