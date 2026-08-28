# CodeArena Frontend

A React + TypeScript frontend for **CodeArena**, a coding-contest platform. It consumes the
CodeArena Spring Boot REST API (a separate backend project at `D:\Projects\CodeArena` — never
edit code there from this project). Users can browse problems, join contests, submit solutions,
and check leaderboards; admins can manage problems and contests.

This is v2 of the CodeArena project — the backend was built first and fully finished (14
phases), and this frontend is being built on top of its live, working API.

## Tech stack

- **Vite** + **React 18+** + **TypeScript**
- **react-router-dom** for routing
- A thin typed fetch/Axios wrapper for the API (`src/api/`)
- No heavier framework/state library — the project is small enough not to need one

## Folder structure

```
src/
  pages/       route-level components (Home, Login, Register, Problems, ProblemDetail,
               Contests, ContestDetail, Leaderboard, Submissions, Profile, Admin/*)
  components/  shared/reusable UI pieces (Navbar, ProtectedRoute, badges, form controls...)
  api/         API client layer (base client + per-resource calls: auth, problems, contests,
               submissions, users)
  hooks/       custom hooks (e.g. useAuth)
  context/     React context providers (AuthContext)
  types/       shared TypeScript types/interfaces matching the backend's response/request shapes
```

## Running this project

- Dev server **must** stay on port 5173 (Vite's default). The backend's CORS is configured for
  exactly `http://localhost:5173` and `http://127.0.0.1:5173` — nothing else. If 5173 is ever
  unavailable, stop and flag it; don't let Vite silently pick another port.
- The backend must be running on `http://localhost:8080` (`.\mvnw.cmd spring-boot:run` in
  `D:\Projects\CodeArena`) to test against.
- `VITE_API_BASE_URL` env var controls the API base URL (defaults to `http://localhost:8080`).

## Source of truth

Three files drive this project and should be read at the start of every session, before doing
new work:

- **`CodeArena_Frontend_Build_Guide.md`** — the 14-phase roadmap and the ready-to-use prompt/verify
  checklist for each phase.
- **`API_REFERENCE.md`** — the exact backend API contract (request/response shapes, error format,
  enum values, auth flow, and gotchas) pulled from the backend's actual source. Trust this over
  assumptions or over the build guide's shorthand where they conflict on field-level detail.
- **`PROGRESS.md`** — what's actually been built so far, phase by phase, plus decisions/deviations
  and what's next. Update it at the end of every phase.

## Workflow

After finishing each phase: check it off in `PROGRESS.md` with a note on what was built and any
deviations, then make a git commit for that phase.
