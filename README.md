<div align="center">

<img src="docs/readme/hero.svg" alt="ProjectFlow — Plan it. Track it. Ship it." width="100%" />

<br />

<a href="https://projectflow-hf4d.vercel.app"><img src="https://img.shields.io/badge/Open_the_web_app-56f09f?style=for-the-badge&logo=vercel&logoColor=032019" alt="Open the web app" /></a>
<a href="https://expo.dev/accounts/pronov06/projects/projectflow/builds/95d102f1-be28-4817-847c-70b48ddb6c94"><img src="https://img.shields.io/badge/Install_Android_APK-004737?style=for-the-badge&logo=android&logoColor=56f09f" alt="Install the Android APK" /></a>
<a href="https://projectflow-beta-three.vercel.app/api/docs"><img src="https://img.shields.io/badge/API_docs_(Swagger)-d4ffe8?style=for-the-badge&logo=swagger&logoColor=004737" alt="API docs" /></a>

<br /><br />

<a href="https://github.com/pronov06/projectflow/actions/workflows/ci.yml"><img src="https://github.com/pronov06/projectflow/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
<img src="https://img.shields.io/badge/tests-77_API_·_17_live_checks-004737?style=flat-square&labelColor=032019" alt="Tests" />
<img src="https://img.shields.io/badge/hosting-Vercel_·_Neon_·_EAS-004737?style=flat-square&labelColor=032019" alt="Hosting" />

<br /><br />

<img src="https://img.shields.io/badge/React_19-004737?style=flat-square&logo=react&logoColor=56f09f" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-004737?style=flat-square&logo=typescript&logoColor=56f09f" alt="TypeScript" />
<img src="https://img.shields.io/badge/Expo_SDK_57-004737?style=flat-square&logo=expo&logoColor=56f09f" alt="Expo" />
<img src="https://img.shields.io/badge/Node.js_·_Express_5-004737?style=flat-square&logo=express&logoColor=56f09f" alt="Express" />
<img src="https://img.shields.io/badge/PostgreSQL-004737?style=flat-square&logo=postgresql&logoColor=56f09f" alt="PostgreSQL" />
<img src="https://img.shields.io/badge/Prisma-004737?style=flat-square&logo=prisma&logoColor=56f09f" alt="Prisma" />
<img src="https://img.shields.io/badge/Tailwind_CSS_4-004737?style=flat-square&logo=tailwindcss&logoColor=56f09f" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/Vitest-004737?style=flat-square&logo=vitest&logoColor=56f09f" alt="Vitest" />
<img src="https://img.shields.io/badge/Docker-004737?style=flat-square&logo=docker&logoColor=56f09f" alt="Docker" />

<br /><br />

**A project & task manager with a React web app and an Android app,**<br />
**sharing one Express REST API and one PostgreSQL database.**<br />
<sub>Register on either · log in on both · every change shows up on the other after a refresh.</sub>

<br />

[Live links](#-live-links) · [Features](#-features) · [Architecture](#-architecture) · [Run locally](#-run-locally) · [API](#-api) · [Testing](#-testing) · [Docs](#-documentation)

</div>

<br />
<img src="docs/readme/divider.svg" width="100%" alt="" />

## 🌿 Live links

| | |
|---|---|
| 🌐 **Web app** | https://projectflow-hf4d.vercel.app |
| ⚙️ **API health** | https://projectflow-beta-three.vercel.app/api/health |
| 📖 **API docs (Swagger)** | https://projectflow-beta-three.vercel.app/api/docs |
| 📱 **Android APK** | [expo.dev build page](https://expo.dev/accounts/pronov06/projects/projectflow/builds/95d102f1-be28-4817-847c-70b48ddb6c94) → open it on an Android phone → *Install* |
| 🎬 **Demo video (5 min)** | _link added after recording_ |

> [!TIP]
> **Test account:** `alice@example.com` / `Password123!` (seeded demo data, not a real person).
> A second account, `bob@example.com`, owns a private project, so you can check that users never see each other's data. You can also register a new account.

> [!NOTE]
> Everything runs on free tiers: the web app and the API (as serverless functions) on **Vercel**, PostgreSQL on **Neon**, and the APK built with **EAS**. All data is test data.

<img src="docs/readme/divider.svg" width="100%" alt="" />

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 🗂️ Projects & tasks
- Create, view, edit and delete **projects** (name, description, status, start/end dates)
- Create, edit, delete and **complete tasks** (priority, status, due date)
- Inline status / priority changes, overdue highlighting
- **Search** by name · **filter** by status & priority · **sort** · **paginate**

</td>
<td width="50%" valign="top">

### 📊 Dashboard
- Total projects · total tasks · completed · pending · projects in progress · **overdue**
- Breakdown by project status and task priority
- Computed in the database, **per signed-in user**

</td>
</tr>
<tr>
<td valign="top">

### 📱 Android app
- Same account and data as the web
- **Pull-to-refresh** on every list
- Tokens in the **Android Keystore** (expo-secure-store)
- Expired session → login screen with a clear message
- **Offline:** clear message (never a crash) + cached viewing

</td>
<td valign="top">

### 🔐 Security
- **bcrypt** password hashing · **JWT** + rotating, hashed refresh tokens
- Every query scoped to its owner; other users' data → **404**
- **zod** validation on every request (shared by all three apps)
- **Rate-limited** login · helmet · CORS allowlist · no raw SQL

</td>
</tr>
</table>

<details>
<summary><b>🎨 Design system</b> — strict tokens, monoweight type, an animated notched auth screen</summary>
<br />

The UI follows one visual language (cream canvas, forest-teal panels, sparing mint accents, a single font weight). Tailwind's default scales are **reset**, so only design tokens generate classes, and a lint script rejects arbitrary values, hex colours and off-scale spacing. See [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

</details>

Every requirement in the brief is mapped to its code and tests in [`docs/REQUIREMENTS_CHECKLIST.md`](docs/REQUIREMENTS_CHECKLIST.md).

<img src="docs/readme/divider.svg" width="100%" alt="" />

## 🧭 Architecture

<img src="docs/readme/architecture.svg" alt="Web app and Android app call one Express API, which uses PostgreSQL via Prisma" width="100%" />

| Layer | Tech |
|---|---|
| **Backend** | Node.js 22 · **Express 5** · TypeScript · **Prisma 6** · zod · jsonwebtoken · bcryptjs · helmet · express-rate-limit · pino |
| **Database** | **PostgreSQL** (Neon in production) · 3NF · FK cascades · CHECK constraint · indexes ([schema & ER diagram](docs/DATABASE.md)) |
| **Web** | **React 19** · Vite · React Router · TanStack Query · react-hook-form · **Tailwind CSS 4** with a strict token system |
| **Mobile** | **Expo SDK 57** (React Native 0.86) · expo-router · TanStack Query · expo-secure-store · NetInfo |
| **Shared** | `@pms/shared`: zod schemas, enums and types used by API, web *and* mobile |
| **Quality** | Vitest · Supertest against real PostgreSQL · Testing Library · ESLint · GitHub Actions CI |
| **Delivery** | Vercel (web + API functions) · Neon · EAS Build (APK) · Docker & `docker-compose` · `render.yaml` |

```
apps/
  api/       Express API — src/{config, middleware, modules/{auth,projects,tasks,dashboard,audit}, utils, docs}, prisma/, tests/
  web/       React app   — src/{api, auth, components, features, pages, styles}
  mobile/    Expo app    — app/ (expo-router screens), src/{api, auth, components, lib}
packages/
  shared/    zod schemas + types shared by api, web and mobile
docs/        API, database, design system, decisions, requirements checklist, demo script, Postman collection
```

Why it's built this way (auth design, 404 vs 403, normalisation, trade-offs): [`docs/DECISIONS.md`](docs/DECISIONS.md).

<img src="docs/readme/divider.svg" width="100%" alt="" />

## 🚀 Run locally

**Prerequisites:** Node.js **20.19+** (22 LTS recommended) and npm 10+. PostgreSQL is optional: there's a built-in embedded Postgres, or you can use Docker.

```bash
git clone https://github.com/pronov06/projectflow.git
cd projectflow
npm install                 # installs all workspaces (api, web, mobile, shared)
```

<details open>
<summary><b>1 · Database</b></summary>

```bash
# Option A: no install needed. Embedded PostgreSQL on port 5433 (keep this terminal open).
npm run db:local -w @pms/api

# Option B: Docker
docker run -d --name projectflow-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=projectflow -p 5433:5432 postgres:17-alpine

# Option C: your own PostgreSQL or a free Neon database. Just put its URL in apps/api/.env
```
</details>

<details open>
<summary><b>2 · Backend API</b></summary>

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env:
#   - DATABASE_URL / DIRECT_URL, e.g. postgresql://postgres:postgres@localhost:5433/projectflow?schema=public
#   - JWT_ACCESS_SECRET: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm run db:deploy -w @pms/api       # apply migrations
npm run db:seed -w @pms/api         # optional demo data (alice / bob)
npm run dev:api                     # http://localhost:4000  (Swagger: http://localhost:4000/api/docs)
```
</details>

<details open>
<summary><b>3 · Web app</b></summary>

```bash
npm run dev:web                     # http://localhost:5173  (Vite proxies /api to localhost:4000)
```
</details>

<details open>
<summary><b>4 · Mobile app</b></summary>

**Option A — install the APK** (see [Live links](#-live-links)). It's already configured to use the deployed backend.

**Option B — run from source with Expo Go** (Android phone, Expo Go from the Play Store):

```bash
cd apps/mobile
cp .env.example .env
# Set EXPO_PUBLIC_API_URL in .env:
#   deployed backend: https://projectflow-beta-three.vercel.app   (recommended)
#   local backend:    http://<your-PC-LAN-IP>:4000                 (same Wi-Fi; allow port 4000 in the firewall)
#   Android emulator: http://10.0.2.2:4000
npx expo start                      # scan the QR code with Expo Go
```

**Build your own APK** (free expo.dev account):

```bash
cd apps/mobile
npx eas-cli login
npx eas-cli build -p android --profile preview   # EXPO_PUBLIC_API_URL comes from eas.json
```
</details>

<details>
<summary><b>🐳 Docker — full stack in one command</b></summary>

```bash
docker compose up --build           # web http://localhost:8080 · API http://localhost:4000/api/docs
docker compose exec api npx tsx prisma/seed.ts   # optional demo data
```
</details>

<details>
<summary><b>🔧 Environment variables</b></summary>

#### API (`apps/api/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string used at runtime (pooled on Neon) |
| `DIRECT_URL` | ✅ | — | Direct (non-pooled) connection for `prisma migrate`. Same as `DATABASE_URL` locally |
| `JWT_ACCESS_SECRET` | ✅ | — | HMAC secret, **at least 32 characters**. The server refuses to start without it |
| `CORS_ORIGINS` | ✅ | — | Comma-separated web origins allowed to call the API, e.g. `https://projectflow-hf4d.vercel.app` |
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

#### Web (`apps/web`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | | API base URL. **Defaults to `/api`** (same origin), which the Vite dev proxy or the Vercel rewrite in `apps/web/vercel.json` forwards to the API |
| `VITE_DEV_API_PROXY` | | Dev only: where Vite proxies `/api` (default `http://localhost:4000`) |

#### Mobile (`apps/mobile/.env` or `eas.json` → `env`)

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | ✅ | API origin without `/api`, e.g. `https://projectflow-beta-three.vercel.app` |

</details>

<img src="docs/readme/divider.svg" width="100%" alt="" />

## 🔌 API

All endpoints from the brief, plus refresh, health, audit log and docs. Full reference with request/response examples: [`docs/API.md`](docs/API.md) · interactive: [Swagger UI](https://projectflow-beta-three.vercel.app/api/docs) · [Postman collection](docs/postman_collection.json).

| Area | Endpoints |
|---|---|
| **Auth** | `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` · `POST /api/auth/refresh` |
| **Projects** | `GET /api/projects` · `GET /api/projects/{id}` · `POST /api/projects` · `PUT /api/projects/{id}` · `DELETE /api/projects/{id}` |
| **Tasks** | `GET /api/tasks` · `GET /api/tasks/{id}` · `POST /api/tasks` · `PUT /api/tasks/{id}` · `DELETE /api/tasks/{id}` |
| **Dashboard** | `GET /api/dashboard` |
| **Extras** | `GET /api/health` · `GET /api/audit-logs` · `GET /api/docs` |

<img src="docs/readme/divider.svg" width="100%" alt="" />

## 🧪 Testing

```bash
# API tests need a test database: set DATABASE_URL/DIRECT_URL in apps/api/.env.test
#   (database name must contain "test", e.g. .../projectflow_test). The embedded server creates one.
npm test                                  # all workspaces
npm test -w @pms/api                      # 77 API unit + integration tests (real PostgreSQL)
npm run test:coverage -w @pms/api
npm test -w @pms/web                      # web component tests
npm test -w @pms/shared                   # shared schema tests
npm run lint && npm run typecheck         # includes the design-token check

# Against a deployed API (HTTPS only): 17 end-to-end checks; --seed also loads the demo accounts
node scripts/prod-check.mjs https://projectflow-beta-three.vercel.app --seed
```

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs lint, typecheck, every test suite against a Postgres service container, the API and web builds, and both Docker image builds on every push.

<details>
<summary><b>☁️ Deployment</b></summary>

| Part | Host | How |
|---|---|---|
| Database | Neon PostgreSQL (Vercel → Storage → Neon) | Vercel provides the pooled `DATABASE_URL`; set `DIRECT_URL` to the unpooled URL, which migrations use |
| API | Vercel (Functions) | Import the repo with **Root Directory = `apps/api`**. [`apps/api/vercel.json`](apps/api/vercel.json) builds with tsup, runs `prisma migrate deploy`, and routes every request to the Express app ([`api/index.js`](apps/api/api/index.js)). Set `JWT_ACCESS_SECRET`, `CORS_ORIGINS`, `TRUST_PROXY=1`, `NODE_ENV=production` |
| Web | Vercel | Import the repo again with **Root Directory = `apps/web`**. [`apps/web/vercel.json`](apps/web/vercel.json) rewrites `/api/*` to the API project, so the refresh cookie stays first-party |
| Android | EAS Build | `npx eas-cli build -p android --profile preview` produces an installable APK link |
| Alternative | Any Node host / Docker | `npm run start -w @pms/api`, `docker compose up`, or [`render.yaml`](render.yaml) (Render Blueprint) |

</details>

<img src="docs/readme/divider.svg" width="100%" alt="" />

## 📚 Documentation

| | |
|---|---|
| 🔌 [API reference](docs/API.md) | Every endpoint, request/response examples, error codes |
| 🗄️ [Database](docs/DATABASE.md) | Schema, [ER diagram](docs/er-diagram.svg), constraints, indexes, normalisation |
| 🎨 [Design system](docs/DESIGN_SYSTEM.md) | Tokens, components, the notched auth layout |
| 🧠 [Design decisions](docs/DECISIONS.md) | Auth design, authorisation, trade-offs, what's next |
| ✅ [Requirements checklist](docs/REQUIREMENTS_CHECKLIST.md) | Every requirement → code → test |
| 🎬 [Demo script](docs/DEMO_SCRIPT.md) | The 5-minute walkthrough |

### Known limitations & what's next
- Serverless cold starts add about 1 s to the first request after idle.
- Rate-limit counters live in memory per function instance; production would use a shared store (Redis / Upstash).
- Projects are created and edited on the web; the mobile app views them and manages tasks, per the brief.
- Next: admin UI on the existing role claim, push notifications for tasks due tomorrow, offline *writes* on mobile, E2E tests.

<br />

<div align="center">
<img src="docs/readme/divider.svg" width="60%" alt="" />
<br />
<sub>Built by <a href="https://github.com/pronov06">@pronov06</a> · all data in this project is test data</sub>
</div>
