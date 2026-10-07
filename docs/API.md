# ProjectFlow API Reference

The web app and the mobile app both use this one REST API.

- **Interactive docs (Swagger UI):** `GET /api/docs` on the deployed API
- **Raw OpenAPI 3 spec:** `GET /api/docs.json` (Postman: *Import → Link*)
- **Postman collection:** [`postman_collection.json`](./postman_collection.json)

## Conventions

**Base URL:** `https://<api-host>/api`. Locally that's `http://localhost:4000/api`.

**Authentication:** send `Authorization: Bearer <accessToken>`. Every endpoint needs it except `register`, `login`, `refresh`, `logout`, `health` and `docs`.

**Response envelope**

```json
// success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 } }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Validation failed",
  "details": [ { "field": "email", "message": "Invalid email address" } ] } }
```

`meta` is only present on paginated list endpoints.

**Status codes**

| Status | `error.code` | When |
|---|---|---|
| 200 / 201 / 204 | — | Success (204 = no body, used by DELETE and logout) |
| 400 | `VALIDATION_ERROR` | Missing or invalid field, empty string, bad email, bad date, bad enum, bad UUID, unknown sort field, empty update |
| 400 | `BAD_REQUEST` | Malformed JSON |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 401 | `TOKEN_EXPIRED` | Expired access token, or an expired, revoked or reused refresh token. Clients refresh, or send the user to the login screen. |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password. The message is the same in both cases. |
| 404 | `NOT_FOUND` | Doesn't exist **or belongs to another user**, so the API never confirms another user's data exists |
| 409 | `CONFLICT` | Email already registered |
| 413 | `BAD_REQUEST` | Body larger than 100 KB |
| 429 | `RATE_LIMITED` | Too many requests (see the limits below) |
| 500 | `INTERNAL_ERROR` | Unexpected error. The response is generic; details go only to the server logs. |

**Dates:** `startDate`, `endDate` and `dueDate` are calendar dates, `YYYY-MM-DD`. Impossible dates such as `2026-02-30` are rejected. Send `null` or `""` to clear one. `createdAt`, `updatedAt` and `completedAt` are ISO-8601 timestamps.

**Rate limits** (configurable via env)

| Scope | Default | Key |
|---|---|---|
| `POST /auth/login`, failed attempts only | 5 per 15 min | IP + email |
| `POST /auth/register` | 10 per hour (30 in production) | IP |
| `POST /auth/refresh` | 60 per 15 min | IP |
| All `/api/*` | 300 per 15 min (1000 in production) | IP |

Responses carry the standard `RateLimit` and `RateLimit-Policy` headers.

---

## Auth

### `POST /api/auth/register`
```json
{ "fullName": "Alice Tester", "email": "alice@example.com", "password": "Password123!" }
```
- `fullName`: 2–100 characters
- `email`: valid address; stored lower-cased and must be unique
- `password`: 8–72 characters, at least one letter and one number

**201**
```json
{ "success": true, "data": {
  "user": { "id": "…", "fullName": "Alice Tester", "email": "alice@example.com", "role": "USER", "createdAt": "…" },
  "accessToken": "eyJhbGciOi…" } }
```
- **Browsers** also receive `Set-Cookie: pf_refresh=…; HttpOnly; Secure; SameSite=Lax; Path=/api/auth`.
- **Native apps** that send `X-Client-Platform: mobile` receive `"refreshToken": "…"` in `data` instead of the cookie.

Errors: 400, 409, 429.

### `POST /api/auth/login`
```json
{ "email": "alice@example.com", "password": "Password123!" }
```
Response: same as register, with status 200. Errors: 400, 401 `INVALID_CREDENTIALS`, 429.

### `POST /api/auth/refresh`
Exchanges a refresh token for a new access token. The refresh token is **rotated**: the old one stops working. Presenting an already-used refresh token revokes every session of that user (theft detection).
- Browser: send no body; the cookie is used.
- Mobile: `{ "refreshToken": "…" }` with `X-Client-Platform: mobile`.

**200:** same shape as login. Errors: 401 `UNAUTHORIZED` or `TOKEN_EXPIRED`.

### `POST /api/auth/logout`
Revokes the refresh token (from the cookie or `{ "refreshToken": "…" }`) and clears the cookie. Idempotent. Works even after the access token has expired. **204**.

### `GET /api/auth/me` 🔒
**200:** `{ "id", "fullName", "email", "role", "createdAt" }`. The password hash is never returned.

---

## Projects 🔒

**Project object**

```json
{ "id": "uuid", "name": "Website Redesign", "description": "…", "status": "IN_PROGRESS",
  "startDate": "2026-09-23", "endDate": "2026-11-06",
  "createdAt": "…", "updatedAt": "…", "taskCount": 4, "completedTaskCount": 1, "progress": 25 }
```

### `GET /api/projects`

| Query | Values | Default |
|---|---|---|
| `search` | Case-insensitive partial match on name (≤100 chars) | — |
| `status` | `NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED` | — |
| `sortBy` | `createdAt` \| `name` \| `startDate` \| `endDate` \| `status` | `createdAt` |
| `order` | `asc` \| `desc` | `desc` |
| `page` | ≥ 1 | 1 |
| `limit` | 1–100 | 20 |

Returns only the caller's projects, plus `meta`.

### `GET /api/projects/{id}`
**200:** Project. Errors: 400 (bad UUID), 404.

### `POST /api/projects`
```json
{ "name": "Website Redesign", "description": "optional", "status": "NOT_STARTED",
  "startDate": "2026-10-01", "endDate": "2026-12-31" }
```
- `name` is required, 1–120 characters.
- `status` defaults to `NOT_STARTED`.
- `endDate` must be on or after `startDate`.

**201:** Project.

### `PUT /api/projects/{id}`
Partial update: send only the fields to change, e.g. `{ "status": "COMPLETED" }`. An empty body returns 400. The date range is checked against the values that will actually be stored. **200:** Project. Errors: 400, 404.

### `DELETE /api/projects/{id}`
Deletes the project **and all its tasks**. **204**. Error: 404.

---

## Tasks 🔒

**Task object**

```json
{ "id": "uuid", "projectId": "uuid", "project": { "id": "uuid", "name": "Website Redesign" },
  "name": "Design new homepage", "description": null, "priority": "HIGH", "status": "IN_PROGRESS",
  "dueDate": "2026-10-10", "completedAt": null, "createdAt": "…", "updatedAt": "…" }
```

### `GET /api/tasks`

| Query | Values | Default |
|---|---|---|
| `projectId` | UUID: only tasks of this project | all of the caller's tasks |
| `search` | Partial match on task name | — |
| `status` | `PENDING` \| `IN_PROGRESS` \| `COMPLETED` | — |
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` | — |
| `sortBy` | `createdAt` \| `dueDate` \| `priority` \| `status` \| `name` | `createdAt` |
| `order`, `page`, `limit` | as for projects | |

`sortBy=priority&order=desc` returns HIGH first.

### `GET /api/tasks/{id}`
**200:** Task. Errors: 400, 404.

### `POST /api/tasks`
```json
{ "projectId": "uuid", "name": "Write API docs", "description": "optional",
  "priority": "MEDIUM", "status": "PENDING", "dueDate": "2026-10-15" }
```
- `projectId` must be one of **your** projects; otherwise **404**.
- `priority` defaults to `MEDIUM` and `status` to `PENDING`.

**201:** Task.

### `PUT /api/tasks/{id}`
Partial update.
- **Mark complete:** `{ "status": "COMPLETED" }`. The API sets `completedAt`, and clears it when the task is re-opened.
- **Change priority:** `{ "priority": "HIGH" }`.
- **Move to another project:** `{ "projectId": "…" }`. The target must be your own project.

**200:** Task. Errors: 400, 404.

### `DELETE /api/tasks/{id}`
**204**. Error: 404.

---

## Dashboard 🔒

### `GET /api/dashboard`
```json
{ "success": true, "data": {
  "totalProjects": 3, "totalTasks": 8, "completedTasks": 3, "pendingTasks": 4,
  "inProgressTasks": 1, "projectsInProgress": 1, "overdueTasks": 1,
  "projectsByStatus": { "NOT_STARTED": 1, "IN_PROGRESS": 1, "COMPLETED": 1 },
  "tasksByStatus":    { "PENDING": 4, "IN_PROGRESS": 1, "COMPLETED": 3 },
  "tasksByPriority":  { "LOW": 1, "MEDIUM": 4, "HIGH": 3 } } }
```
- `pendingTasks` = tasks with status `PENDING`.
- `overdueTasks` = tasks that aren't completed and have a `dueDate` before today (UTC).
- Every number is computed in the database for the authenticated user only.

---

## Extras

| Endpoint | Description |
|---|---|
| `GET /api/health` | `{ "status": "ok", "db": "ok" }`. Also useful to wake the free-tier server before a demo. |
| `GET /api/audit-logs` 🔒 | The caller's own activity history (paginated). Bonus feature. |
| `GET /api/docs`, `GET /api/docs.json` | Swagger UI and OpenAPI spec |

## Quick test with curl

```bash
API=https://<api-host>/api
TOKEN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"Password123!"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).data.accessToken")
curl -s $API/dashboard -H "Authorization: Bearer $TOKEN"
curl -s "$API/tasks?status=PENDING&sortBy=dueDate&order=asc" -H "Authorization: Bearer $TOKEN"
```
