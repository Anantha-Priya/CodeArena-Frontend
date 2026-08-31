# CodeArena Frontend

**Live:** https://codearena-frontend-mu.vercel.app *(UI only — the backend it talks to runs
locally and isn't deployed yet, so API-dependent screens will show "Backend: unreachable" unless
you're running the backend yourself and set `VITE_API_BASE_URL` accordingly. See
[Status](#status).)*

A React + TypeScript frontend for **CodeArena**, a coding-contest platform. It's the client for
the [CodeArena Spring Boot REST API](../CodeArena) — a separate backend project with its own
repo and its own JWT-secured, role-based API. Users register, browse a problem catalog, join
time-boxed contests, submit solutions (in practice or in-contest), and check live leaderboards;
admins manage the problem/contest catalog and can see a platform-wide coders leaderboard.

This is v2 of the CodeArena project — the backend was built first and fully finished (14 phases,
38 tests, Swagger-documented), and this frontend was built on top of its live, working API across
its own 14-phase build.

## Tech stack

- **Vite 8** + **React 19** + **TypeScript**
- **react-router-dom v7** for routing (protected routes, role-gated admin routes)
- A thin typed `fetch` wrapper (`src/api/client.ts`) — no Axios, no heavier data-fetching library;
  the project is small enough not to need one
- **recharts**, lazy-loaded, for the two donut charts (submission breakdown, user activity)
- **oxlint** for linting

## How it talks to the API

Every request goes through one client (`src/api/client.ts`): it attaches the JWT from
`localStorage` as a `Bearer` token, parses the backend's `{status, message}` error shape into a
typed `ApiError`, and triggers a global logout on a `401` from an authenticated request. Each
resource gets its own thin wrapper module in `src/api/` (`auth.ts`, `problems.ts`, `contests.ts`,
`submissions.ts`, `users.ts`) that just types the request/response and calls the shared client —
no business logic lives in this layer. The exact request/response shapes are tracked in
[`API_REFERENCE.md`](API_REFERENCE.md), pulled from the backend's actual source rather than
assumed.

## Project structure

```
src/
  pages/       route-level components (Home, Login, Register, Problems, ProblemDetail,
               Contests, ContestDetail, Leaderboard, Submissions, Profile, Admin/*)
  components/  shared UI (Navbar, ProtectedRoute/AdminRoute, badges, form controls,
               charts, ambient/matrix backgrounds...)
  api/         API client layer — base client + one module per resource
  hooks/       custom hooks (useAuth, useContestStatus)
  context/     AuthContext/AuthProvider (token + current user, shared app-wide)
  types/       TypeScript types matching the backend's request/response shapes
  utils/       small shared helpers (e.g. avatar initials)
```

Routing is split by who can see what:

```
Public:        /login, /register
Authenticated: /                          (Home)
               /problems, /problems/:id
               /contests, /contests/:id, /contests/:id/leaderboard
               /submissions/my
               /profile
Admin only:    /admin/problems  (create/edit/delete problems)
               /admin/contests  (create contests, attach problems)
               /admin/coders    (platform-wide ranked leaderboard)
```

Admin accounts get their own nav (Coders / Profile / Create Problem / Create Contest) and their
own Profile dashboard (platform totals + an active/non-active user donut) instead of the
participant-facing solver stats — role checks live in `ProtectedRoute`/`AdminRoute` and are
re-derived from the authenticated user's role, not hidden client-side state.

## Getting started

**Prerequisites:** Node 18+, and the [CodeArena backend](../CodeArena) running locally.

```bash
git clone <this-repo-url>
cd codearena-frontend
npm install
```

Copy the env template and point it at your backend:

```bash
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:8080
```

Start the backend first (`.\mvnw.cmd spring-boot:run` in the CodeArena repo — it must be on
`http://localhost:8080`, since its CORS config is locked to exactly `http://localhost:5173`),
then run the frontend:

```bash
npm run dev
```

The dev server **must** stay on port 5173 (`vite.config.ts` sets `strictPort: true` so it fails
loudly instead of silently starting elsewhere) — the backend's CORS won't allow anything else.

Other scripts:

```bash
npm run build     # tsc -b && vite build — production build to dist/
npm run lint       # oxlint
npm run preview    # serve the production build locally
```

## Status

All 14 build phases are complete, plus several rounds of visual/UX polish afterward (see
[`PROGRESS.md`](PROGRESS.md) for the phase-by-phase log and [`CodeArena_Frontend_Build_Guide.md`](CodeArena_Frontend_Build_Guide.md)
for the original roadmap).

Deployed to Vercel at the link above, built from this repo. The backend
([`CodeArena`](../CodeArena)) only runs locally right now — it has no production deployment of
its own — so the live frontend has nothing real to fetch from yet. Once the backend is deployed,
point the Vercel project's `VITE_API_BASE_URL` environment variable at it and redeploy
(`npx vercel --prod` from this repo, or push to `master` once auto-deploy-on-push is connected in
the Vercel dashboard).
