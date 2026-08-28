# CodeArena Frontend — Progress

Tracks what's actually been built, phase by phase, against the roadmap in
[CodeArena_Frontend_Build_Guide.md](CodeArena_Frontend_Build_Guide.md). See
[API_REFERENCE.md](API_REFERENCE.md) for the exact API contract. Update this file at the end of
every phase, then commit.

---

## Phase 1: Project Setup & Skeleton

- [x] Done

**Built:**
- Scaffolded with `npm create vite@latest` (react-ts template) directly into the project
  root (already git-initialized) — React 19, TypeScript, Vite 8.
- Added `react-router-dom` and wired up `src/App.tsx` with a `BrowserRouter`/`Routes` shell
  (single `/` route for now; more routes land in later phases).
- Folder structure per the guide: `src/pages`, `src/components`, `src/api`, `src/hooks`,
  `src/context`, `src/types`.
- Typed API client at [src/api/client.ts](src/api/client.ts): thin `fetch` wrapper with
  `get`/`post`/`put`/`delete` helpers, base URL from `VITE_API_BASE_URL` (defaults to
  `http://localhost:8080`), and an `ApiError` class that carries the backend's
  `{status, message}` error shape (see API_REFERENCE.md). Response bodies are parsed as
  JSON when possible, falling back to raw text (the health endpoint isn't guaranteed to be
  JSON everywhere, and this keeps the client from throwing on a non-JSON 2xx body).
- [src/api/health.ts](src/api/health.ts) calls `GET /api/health`; [src/pages/Home.tsx](src/pages/Home.tsx)
  shows "Backend: UP" / "Backend: unreachable" / "Checking backend…" based on that call
  resolving or rejecting.
- `vite.config.ts` pins `server.port = 5173` with `strictPort: true` so the dev server fails
  loudly instead of silently moving to another port if 5173 is taken (required — backend CORS
  only allows exactly `localhost:5173` / `127.0.0.1:5173`).
- Removed the default Vite template's landing-page markup/assets (`App.css`, hero/react/vite
  SVGs, `public/icons.svg`) since they're not part of this app.
- `.env.example` documents `VITE_API_BASE_URL`.

**Decisions/deviations:**
- Scaffolded in place (project root) rather than a nested `codearena-frontend/` folder, since
  this folder is already the intended repo root (git already initialized here in the prior
  setup step). Package name in `package.json` set to `codearena-frontend`.
- Kept the custom `.gitignore` written before scaffolding (already Vite/React/TS-appropriate)
  instead of the one `create-vite` generates.

**Next:** Phase 2 — Auth pages & token handling.

---

## Phase 2: Auth Pages & Token Handling

- [ ] Done

**Built:**

**Decisions/deviations:**

**Next:**

---

## Phase 3: Protected Routing & App Shell

- [ ] Done

**Built:**

**Decisions/deviations:**

**Next:**

---

## Phase 4: Problems List Page

- [ ] Done

**Built:**

**Decisions/deviations:**

**Next:**

---

## Phase 5: Problem Detail Page

- [ ] Done

**Built:**

**Decisions/deviations:**

**Next:**

---

## Phase 6: Admin Problem Management

- [ ] Done

**Built:**

**Decisions/deviations:**

**Next:**

---

## Phase 7: Contests List & Detail

- [ ] Done

**Built:**

**Decisions/deviations:**

**Next:**

---

## Phase 8: Contest Join Flow

- [ ] Done

**Built:**

**Decisions/deviations:**

**Next:**

---

## Phase 9: Admin Contest Management

- [ ] Done

**Built:**

**Decisions/deviations:**

**Next:**

---

## Phase 10: Submission Form & My Submissions

- [ ] Done

**Built:**

**Decisions/deviations:**

**Next:**

---

## Phase 11: Leaderboard Page

- [ ] Done

**Built:**

**Decisions/deviations:**

**Next:**

---

## Phase 12: Profile Page

- [ ] Done

**Built:**

**Decisions/deviations:**

**Next:**

---

## Phase 13: Polish — Errors, Loading, Responsiveness

- [ ] Done

**Built:**

**Decisions/deviations:**

**Next:**

---

## Phase 14: Deployment & Resume Polish

- [ ] Done

**Built:**

**Decisions/deviations:**

**Next:**
