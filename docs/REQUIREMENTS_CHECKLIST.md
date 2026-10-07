# Requirements Traceability

Each requirement from the assessment brief, the code that implements it, and how it's verified.
API tests are in `apps/api/tests/`; ✅ = implemented and verified.

## 1. User authentication

| Requirement | Implementation | Verified by |
|---|---|---|
| Registration, login, logout | `apps/api/src/modules/auth/*`, web `pages/AuthPages.tsx`, mobile `src/components/AuthForm.tsx` | `auth.test.ts` (register, login, logout) ✅ |
| Fields: full name, email, password | `registerSchema` in `packages/shared/src/schemas.ts`, `users` table | `auth.test.ts` "rejects invalid input" ✅ |
| Unique emails | `@unique` on `users.email`, lower-cased before saving, 409 on duplicate | `auth.test.ts` "normalises email case so duplicates are caught" ✅ |
| Passwords never in plain text | bcrypt in `utils/password.ts` | `auth.test.ts` "stores a bcrypt hash" ✅ |
| Stay logged in until logout or expiry | Refresh-token rotation; web restores the session from the httpOnly cookie, mobile from SecureStore | `auth.test.ts` refresh tests; manual reload check on web ✅ |
| One account on web and mobile | Same `/api/auth/*` endpoints and database | Demo recording |

## 2. Project management

| Requirement | Implementation | Verified by |
|---|---|---|
| Create, view, edit, delete; list own projects | `modules/projects/*`, web `ProjectsPage`, `ProjectDetailPage`, `ProjectFormModal` | `projects.test.ts` CRUD ✅ |
| Fields: name, description, status, start/end date, created date | `projects` table, `projectCreateSchema` | `projects.test.ts` "creates a project with defaults" ✅ |

## 3. Task management

| Requirement | Implementation | Verified by |
|---|---|---|
| Create, edit, delete, mark complete, list per project | `modules/tasks/*`, web `TaskBrowser`/`TaskList`/`TaskFormModal`, mobile `TaskForm`/`TaskItem` | `tasks.test.ts` ✅ |
| Fields: name, description, priority, status, due date, created date | `tasks` table, `taskCreateSchema` | `tasks.test.ts` "creates a task with defaults" ✅ |

## 4. Dashboard

| Requirement | Implementation | Verified by |
|---|---|---|
| Total projects, total tasks, completed, pending, projects in progress (per user) | `modules/dashboard/dashboard.service.ts`, web `DashboardPage`, mobile `(tabs)/index.tsx` | `dashboard.test.ts` "computes exact counts", `authorization.test.ts` ✅ |

## 5. Search & filtering

| Requirement | Implementation | Verified by |
|---|---|---|
| Search projects/tasks by name; filter projects by status; filter tasks by status and priority | Query params in `projectListQuerySchema`/`taskListQuerySchema`, web URL-synced filters, mobile chips plus debounced search | `projects.test.ts` and `tasks.test.ts` listing suites ✅ |

## 6. Mobile app

| Requirement | Implementation | Verified by |
|---|---|---|
| Same backend, no separate mobile backend | `apps/mobile/src/lib/api.ts` → `EXPO_PUBLIC_API_URL` | Config in `eas.json` ✅ |
| Register / login / logout with the web account | `AuthForm.tsx`, `(tabs)/profile.tsx` | Demo recording |
| Dashboard; projects and their tasks | `(tabs)/index.tsx`, `(tabs)/projects.tsx`, `project/[id].tsx` | Device test |
| Create, edit, delete tasks; mark complete; change status and priority | `task/new.tsx`, `task/[id].tsx`, `TaskForm.tsx`, `TaskItem.tsx` (checkbox) | Device test |
| Search and filter tasks | `TaskList.tsx` | Device test |
| Android required | Expo, EAS `preview` profile builds an APK | APK link in README |
| Changes appear after pull-to-refresh | `RefreshControl` on every list and the dashboard | Demo recording |
| Token in secure storage (Keystore/Keychain) | `src/lib/secureStore.ts` (expo-secure-store) | Code review ✅ |
| Expired token → login screen with a clear message | Interceptor in `src/lib/api.ts` → `AuthContext` notice → login screen | Code review; API side `auth.test.ts` "reports an expired token" ✅ |
| No network → clear message, no crash | `OfflineBanner`, `ErrorView`, `networkMode: 'always'`, offline save blocked | Device test (airplane mode) |

## Technical requirements

| Requirement | Implementation | Verified by |
|---|---|---|
| React; responsive; component structure | `apps/web` (Vite); Tailwind breakpoints; `components/ui`, `features/*`, `pages/*` | Manual at 375/768/1280 px |
| Form validation, loading indicators, error handling | Shared zod + react-hook-form, skeletons and spinners, toasts, `ErrorBoundary`, `ErrorState` | `app.test.tsx` ✅ |
| React Native (Expo); navigation; validation; loading + pull-to-refresh; error handling; secure storage | `apps/mobile` (expo-router Stack + Tabs, `Stack.Protected` auth guard) | `expo-doctor` 21/21, Android bundle export ✅ |
| Node + Express, one backend; REST; route organisation; middleware; error handling; logging; clean structure | `apps/api/src/{modules,middleware,utils,config}`, pino-http with request IDs | Full API suite ✅ |
| CORS for the web domain | `CORS_ORIGINS` allowlist in `app.ts` | `security.test.ts` "allows the configured web origin and refuses others" ✅ |
| PostgreSQL; relational design; FKs; normalised | `prisma/schema.prisma`, `docs/DATABASE.md` | Migration plus CHECK constraint ✅ |

## Security requirements

| Requirement | Implementation | Verified by |
|---|---|---|
| bcrypt; no plain text; protected APIs | `utils/password.ts`, `authenticate` middleware | `auth.test.ts`, `projects.test.ts` "requires authentication" ✅ |
| Users only see and modify their own data | Ownership-scoped queries, 404 for foreign resources | `authorization.test.ts` (7 tests) ✅ |
| Backend validation of every request | `middleware/validate.ts` + shared schemas | Validation suites in all test files ✅ |
| JWT, auth middleware, protected routes | `utils/jwt.ts`, `middleware/authenticate.ts` | `auth.test.ts` forged and expired tokens ✅ |
| No sensitive data in responses | `publicUserSelect`, generic 500s | `auth.test.ts` "never exposes the password" ✅ |
| SQL injection protection | Prisma parameterised queries only | `projects.test.ts` "treats SQL injection attempts as plain text" ✅ |
| Rate limiting on auth | `middleware/rateLimiters.ts` | `auth.test.ts` "rate limits repeated failed attempts" ✅ |

## API expectations

All 15 required endpoints exist with the exact paths from the brief (see [`API.md`](./API.md)), plus `POST /api/auth/refresh`, `GET /api/health`, `GET /api/audit-logs` and `/api/docs`.

## Documentation and submission

| Item | Location |
|---|---|
| Setup (backend, web, mobile), env vars, DB setup, running the mobile app against the deployed backend | [`README.md`](../README.md) |
| API documentation | [`API.md`](./API.md), Swagger at `/api/docs`, [`postman_collection.json`](./postman_collection.json) |
| Database schema / ER diagram | [`DATABASE.md`](./DATABASE.md), [`er-diagram.svg`](./er-diagram.svg) |
| Deployment URLs, APK, video | README *Live links* |

## Bonus features

| Bonus | Status |
|---|---|
| Docker support | ✅ `apps/api/Dockerfile`, `apps/web/Dockerfile`, `docker-compose.yml` (images built in CI) |
| Unit tests | ✅ shared schemas, API utilities |
| Integration tests | ✅ 70+ API tests against real PostgreSQL |
| Pagination | ✅ `page`/`limit` with `meta` on list endpoints, pagination UI on web |
| Sorting | ✅ `sortBy`/`order` with an allowlist |
| Audit logs | ✅ `audit_logs` table and `GET /api/audit-logs` |
| Role-based access control | ◑ `role` column, JWT claim and `authorize()` middleware; no admin endpoints yet |
| CI/CD pipeline | ✅ GitHub Actions CI; Vercel auto-deploys web and API from `main` |
| Refresh tokens | ✅ Rotating, hashed, with reuse detection |
| Push notifications | ✗ Future work |
| Offline viewing on mobile | ✅ Persisted query cache (AsyncStorage, no tokens) and an offline banner |
| Shared types/validation | ✅ `packages/shared` used by all three apps |
