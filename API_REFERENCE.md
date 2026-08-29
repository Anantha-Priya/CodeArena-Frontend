# CodeArena API — Reference for Frontend Work

This is a snapshot of the CodeArena backend's actual contract, pulled directly from its
source (`D:\Projects\CodeArena`) as of the backend's Phase 14 completion. Read this alongside
`CodeArena_Frontend_Build_Guide.md` — the guide has the phase-by-phase build plan; this has the
exact request/response shapes and gotchas the guide doesn't spell out field-by-field.

The backend is a separate project/repo. Nothing here is fetched live — if the backend's
contract changes after this was written, this file goes stale. Re-check against
`D:\Projects\CodeArena\README.md` (API table) and the live Swagger UI
(`http://localhost:8080/swagger-ui.html`) if something doesn't match.

## Before you start: dev server port is fixed by the backend

**CORS is already configured on the backend** (`com.codearena.security.SecurityConfig`,
`corsConfigurationSource()` bean) — but only for these two exact origins:
`http://localhost:5173` and `http://127.0.0.1:5173`. That's Vite's default dev port, so as
long as `npm run dev` isn't told otherwise, this just works out of the box.

**Keep the frontend dev server on port 5173.** If anything forces a different port (5173
already in use, an explicit `--port` flag, a `vite.config.ts` override, etc.), every API call
will be silently blocked by the browser with a CORS error — the fix isn't anything in the
frontend project, it's adding that new origin to the `allowedOrigins` list back in the
backend's `SecurityConfig`. Flag it rather than working around it client-side.

## Base URL & auth

- Base URL (local dev): `http://localhost:8080`
- Auth: JWT Bearer. Get a token from `POST /api/auth/login`, then send
  `Authorization: Bearer <token>` on every subsequent request.
- Token expiry: 24 hours, no refresh mechanism (v1 scope) — a 401 means the token is
  missing/invalid/expired; there's no way to silently renew it, only re-login.
- Public, no token needed: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/health`.
- Everything else needs a valid token. `ROLE_ADMIN`-only routes are called out below.

## Error shape (applies to every non-2xx response)

```json
{ "status": 404, "message": "Contest not found: 5" }
```

Always exactly these two fields, whether the error came from a thrown exception, Spring
Security (401/403), or `@Valid` failing. For a failed validation (400), `message` is multiple
field errors joined into one string, e.g.:

```json
{ "status": 400, "message": "username: must not be blank; email: must be a well-formed email address" }
```

There's no structured field-to-error map — if you want to highlight specific form fields,
you'll need to parse this string or match on the field name prefix before the `:`.

## Enums (exact values, case-sensitive)

| Enum | Values |
|---|---|
| Role | `USER`, `ADMIN` |
| Difficulty | `EASY`, `MEDIUM`, `HARD` |
| SubmissionStatus | `ACCEPTED`, `WRONG_ANSWER`, `COMPILATION_ERROR` |
| ContestStatus | `UPCOMING`, `ACTIVE`, `ENDED` (only ever appears in `GET .../status` responses, never stored) |

## Endpoints, request/response shapes

All request/response fields below are camelCase — that's what the JSON actually uses (not
snake_case, despite the DB columns being snake_case).

### Auth

**POST `/api/auth/register`** — public
```json
// request
{ "username": "string", "email": "string", "password": "string (min 6 chars)" }
```
201, empty body on success. 400 on validation failure. 409 if username or email already exists.

**POST `/api/auth/login`** — public
```json
// request
{ "email": "string", "password": "string" }
// response (200)
{ "token": "eyJhbGci..." }
```
401 for wrong password OR unknown email — same message either way, no way to distinguish
which one failed (intentional, no user enumeration).

### Problems

**POST `/api/problems`** — admin only
```json
// request (all fields required, all plain strings except difficulty)
{
  "title": "string", "description": "string", "difficulty": "EASY|MEDIUM|HARD",
  "topic": "string", "constraints": "string", "inputFormat": "string",
  "outputFormat": "string", "sampleInput": "string", "sampleOutput": "string"
}
```
201 + full `ProblemResponse` body (below). 400 validation, 401, 403.

**GET `/api/problems?difficulty=&topic=&page=&size=`** — any authenticated user

All four query params optional. Returns a Spring `Page` object, not a bare array:
```json
{
  "content": [ /* array of ProblemResponse */ ],
  "totalElements": 5, "totalPages": 1, "number": 0, "size": 10,
  "first": true, "last": true, "empty": false
  // plus a few more standard Spring Page fields (pageable, sort, numberOfElements)
}
```
Read `content` for the array, `totalPages`/`totalElements` for pagination controls — don't
infer page count from `content.length`.

**ProblemResponse shape** (returned by POST/PUT/GET):
```json
{
  "id": 1, "title": "string", "description": "string", "difficulty": "MEDIUM",
  "topic": "string", "constraints": "string", "inputFormat": "string",
  "outputFormat": "string", "sampleInput": "string", "sampleOutput": "string",
  "createdAt": "2026-08-27T20:10:52.624669"
}
```

**GET `/api/problems/{id}`** — any authenticated user. 200 + `ProblemResponse`, or 404.

**PUT `/api/problems/{id}`** — admin only. Same request body as POST (full replace, not
partial patch). 200 + `ProblemResponse`, 400, 401, 403, 404.

**DELETE `/api/problems/{id}`** — admin only. 204 empty body, 401, 403, 404.

### Contests

**POST `/api/contests`** — admin only
```json
// request
{
  "title": "string", "description": "string",
  "startTime": "2026-01-01T10:00:00", "endTime": "2026-01-01T12:00:00"
}
```
`startTime`/`endTime` format: `YYYY-MM-DDTHH:mm:ss` — **no timezone offset, no trailing `Z`**.
This is a plain `LocalDateTime`, compared directly against the server's own local clock with
no zone conversion. If your frontend's `Date` objects produce ISO strings with a `Z` or `+00:00`
suffix, strip it before sending, and be aware the value is interpreted as the **server's**
local time, not UTC.

`endTime` must be strictly after `startTime` or you get 400 with message
`"end_time must be after start_time"`. 201 + `ContestResponse` on success.

**ContestResponse shape:**
```json
{
  "id": 1, "title": "string", "description": "string",
  "startTime": "2026-01-01T10:00:00", "endTime": "2026-01-01T12:00:00",
  "createdAt": "2026-08-27T20:10:52.624669"
}
```
Note: this response does **not** include a computed status field — call the `/status`
endpoint below for that.

**GET `/api/contests`** — any authenticated user. Returns a plain JSON array (not paginated),
each item a `ContestResponse`.

**GET `/api/contests/{id}`** — any authenticated user. 200 + `ContestResponse`, or 404.

**POST `/api/contests/{contestId}/problems/{problemId}`** — admin only. No request body
(both ids are in the URL). 201 empty body. 404 if contest or problem doesn't exist. 409 if
that problem is already attached to that contest.

**GET `/api/contests/{id}/problems`** — any authenticated user. Added after the frontend's
Phase 7 shipped without it (there was previously no way to read back a contest's attached
problems at all). Confirmed live against the running backend:
```json
[
  {
    "id": 5, "title": "Two Sum", "description": "x", "difficulty": "EASY",
    "topic": "Arrays", "constraints": "x", "inputFormat": "x", "outputFormat": "x",
    "sampleInput": "x", "sampleOutput": "x", "createdAt": "2026-08-26T17:22:30.84265"
  }
]
```
Plain array of full `ProblemResponse` objects (same shape as `GET /api/problems/{id}`), not
paginated. 200 + `[]` (not 404) if the contest exists but has no problems attached yet. 404 if
the contest itself doesn't exist. No documented ordering guarantee — treat it as attachment
order, don't rely on it being sorted any particular way.

**GET `/api/contests/{id}/status`** — any authenticated user
```json
{ "status": "ACTIVE", "remainingSeconds": 3421 }
```
`status` is one of `UPCOMING`/`ACTIVE`/`ENDED`, computed server-side every call — **never
compute this from the client's own clock**, always poll this endpoint (the guide suggests
every 5-10s while a contest page is open). `remainingSeconds` is seconds until start (if
UPCOMING) or until end (if ACTIVE); it's `0` once ENDED.

**POST `/api/contests/{id}/join`** — any authenticated user. No request body. 201 empty body
on success. Allowed for `UPCOMING` and `ACTIVE` contests. 400 if the contest has already
`ENDED`. 409 if the caller already joined this contest. 404 if the contest doesn't exist.

**GET `/api/contests/{id}/leaderboard`** — any authenticated user
```json
[
  { "rank": 1, "username": "alice", "score": 300 },
  { "rank": 2, "username": "bob", "score": 200 }
]
```
Plain array, already sorted by rank ascending — don't re-sort client-side. Includes every
participant (even ones with 0 accepted submissions, score `0`), not just ones who submitted.
404 if the contest doesn't exist.

### Submissions

**POST `/api/submissions`** — any authenticated user
```json
// request
{
  "contestId": 1, "problemId": 5, "language": "java",
  "sourceCode": "string", "status": "ACCEPTED|WRONG_ANSWER|COMPILATION_ERROR"
}
```
**Important**: `status` is supplied by the *caller*, not computed by a judge — v1 has no code
execution engine. The frontend's submit form needs a status picker (dropdown), and per the
frontend guide, should be labeled clearly so it doesn't read as a real judge to the user.

Validation order (each failure is distinct, worth showing distinct messages for): contest
exists (404) → problem exists (404) → caller has joined the contest (400,
`"You have not joined this contest"`) → contest is `ACTIVE` (400,
`"Contest is not currently active"`) → problem is associated with that contest (400,
`"Problem does not belong to this contest"`).

201 + `SubmissionResponse` on success:
```json
{
  "id": 1, "problemId": 5, "problemTitle": "Two Sum", "contestId": 1,
  "contestTitle": "Weekly Contest", "language": "java", "status": "ACCEPTED",
  "score": 200, "submittedAt": "2026-08-27T20:10:52.624669"
}
```
`score` is computed server-side by `ScoreService`: `ACCEPTED` → 100/200/300 by the problem's
difficulty (EASY/MEDIUM/HARD); anything else → 0. Don't compute/display a "predicted" score
client-side — just show what the response returns.

**GET `/api/submissions/my`** — any authenticated user. Plain array of `SubmissionResponse`,
newest first, only the caller's own.

### Users

**GET `/api/users/me`** — any authenticated user
```json
{ "username": "alice", "rating": 60, "problemsSolved": 3, "contestsJoined": 2 }
```
Read-only in v1 (no PUT/PATCH). `problemsSolved` counts distinct problems with at least one
ACCEPTED submission (not total accepted submissions). `rating`: +10 for joining a contest,
+50 more if that contest's leaderboard ranks the user top 3 — applied once, automatically,
the first time anyone views that contest's leaderboard after it ends. There's no endpoint to
trigger this manually; it just happens as a side effect of a leaderboard GET.

## Things that will surprise you if you don't know them going in

- **No pagination on `GET /api/contests` or `GET /api/submissions/my`** — both return every
  row as a plain array. Fine for this project's scale, but don't build UI that assumes a
  `content`/`totalPages` shape for these two (only `GET /api/problems` is paginated).
- **No admin-creation endpoint.** Every registered user is `USER`. To test admin-only frontend
  screens, register normally then promote directly in MySQL:
  `UPDATE users SET role='ADMIN' WHERE email='...';` — then log in again (the JWT's role claim
  is set at login time, not re-checked live).
- **Contest state is authoritative on the server, always.** Don't cache/compute
  UPCOMING/ACTIVE/ENDED client-side beyond the interval between polls — the guide's Phase 7
  is explicit about this.
