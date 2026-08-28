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

- [x] Done

**Built:**
- [src/types/auth.ts](src/types/auth.ts) + [src/api/auth.ts](src/api/auth.ts): `register()` /
  `login()` calling `POST /api/auth/register` and `POST /api/auth/login`.
- [src/context/AuthContext.ts](src/context/AuthContext.ts) (context + `AuthContextValue` type)
  and [src/context/AuthProvider.tsx](src/context/AuthProvider.tsx) (the provider component) —
  split into two files because oxlint's react-refresh rule flags mixing a context export with
  a component export in one file (breaks Fast Refresh). `AuthProvider` persists the token to
  `localStorage` (`codearena_token`) and exposes `{ token, isAuthenticated, login, logout }`
  via [src/hooks/useAuth.ts](src/hooks/useAuth.ts).
- `src/api/client.ts` now holds the current token as module state (`setAuthToken`), attaches
  `Authorization: Bearer <token>` to every request automatically, and exposes
  `setUnauthorizedHandler` — `AuthProvider` registers a handler there that clears the token
  and navigates to `/login` **only when a 401 comes back while a token was actually attached**
  (so the login page's own "wrong password" 401 doesn't get swallowed by a global redirect —
  see Decisions below).
- [src/pages/Login.tsx](src/pages/Login.tsx): email/password form; 401 → "Invalid email or
  password"; success stores the token via `useAuth().login()` and navigates to `/`; reads an
  optional success message passed via router state (from Register).
- [src/pages/Register.tsx](src/pages/Register.tsx): username/email/password form; on success
  navigates to `/login` with a success-message state; 400/409 responses are parsed by
  [src/api/errors.ts](src/api/errors.ts)'s `parseFieldErrors()` and routed to the matching
  field where the backend's `"field: message"` format allows it, otherwise shown as a
  general banner.
- [src/pages/Home.tsx](src/pages/Home.tsx) got a temporary logged-in/out affordance (Log out
  button, or Log in/Register links) so the flow is reachable and testable before Phase 3's
  real navbar replaces it.

**Decisions/deviations:**
- The backend's 409 duplicate-username/email message doesn't follow the "field: message"
  format the way 400 validation errors do (API_REFERENCE.md only documents that format for
  400s), so a 409 with no parseable field prefix renders as a general banner rather than a
  fabricated per-field error. Confirmed live: registering a duplicate username returned
  `"Username already exists"` with no colon, which `parseFieldErrors` correctly bucketed as
  `_general`.
- Chose to scope the global 401→logout/redirect to "a token was attached to this request" so
  it can't fire on the login/register calls themselves (which are unauthenticated by design
  and have their own inline error handling).
- Verified end-to-end in-browser: register → redirect-to-login-with-message → wrong password
  (shows error, no token stored) → correct password (token stored, lands on authenticated
  Home) → refresh (still logged in) → manually forcing a 401 on an authenticated call (clears
  token, redirects to `/login`).

**Next:** Phase 3 — Protected routing & app shell (real navbar, `ProtectedRoute`, role-aware
nav via `GET /api/users/me`).

---

## Phase 3: Protected Routing & App Shell

- [x] Done

**Built:**
- [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx): redirects to
  `/login` when unauthenticated, otherwise renders the nested route (`<Outlet />`).
- [src/components/AppLayout.tsx](src/components/AppLayout.tsx) +
  [src/components/Navbar.tsx](src/components/Navbar.tsx): persistent shell (navbar + content
  area) wrapping all protected routes. Navbar shows Problems/Contests/My
  Submissions/Profile to everyone, Admin: Problems/Admin: Contests only when
  `user.role === 'ADMIN'`, plus username · rating and a Log out button.
- [src/types/user.ts](src/types/user.ts) + [src/api/users.ts](src/api/users.ts): `getMe()`
  calling `GET /api/users/me`.
- `AuthProvider` now also fetches and stores the user profile (`user` in context) whenever the
  token is set — on login and on a fresh page load with a persisted token — so the navbar's
  role-aware links are correct in both cases. `user` is reset to `null` at the actual events
  that clear/replace the token (login, logout, forced 401-logout) rather than inferred inside
  the fetch effect, per an oxlint `set-state-in-effect` catch.
- App route tree in [src/App.tsx](src/App.tsx): `/login` and `/register` stay public;
  everything else sits behind `ProtectedRoute` → `AppLayout`. Added placeholder pages for the
  routes the navbar links to ahead of their real phases: Problems, Contests, Submissions,
  Profile, and `src/pages/Admin/{AdminProblems,AdminContests}.tsx` — each just a heading for
  now, so the nav has somewhere real to go instead of a dead link.
- Login/Register now redirect to `/` if the user is already authenticated (visiting either
  page mid-session bounces back to the app instead of re-showing the form).
- Simplified `Home.tsx` back to just the health check (plus a username greeting) now that the
  navbar owns login/logout — removed the Phase 2 stand-in links/button.

**Decisions/deviations:**
- **Backend contract gap, resolved by editing the backend (with the user's explicit go-ahead,
  not on my own initiative):** `GET /api/users/me` and the JWT itself did not expose the
  user's role anywhere (confirmed by reading `JwtService.generateToken`,
  `UserProfileResponse`, and `UserController` — the JWT only carries `sub`/`iat`/`exp`, and
  the response only had `username`/`rating`/`problemsSolved`/`contestsJoined`), even though
  the build guide's Phase 3 prompt assumes role comes back from that endpoint. Flagged this to
  the user; they added a `role` field to `UserProfileResponse` (typed as the `Role` enum,
  serializes as `"USER"`/`"ADMIN"`) and populated it in `UserService.getMyProfile` themselves
  in the backend project. Frontend types `role` as `'USER' | 'ADMIN'` in
  [src/types/user.ts](src/types/user.ts) to match.
- Verified end-to-end in-browser: logged-out direct navigation to `/problems` redirects to
  `/login`; logging in as a plain `USER` hides both admin links; promoted that same account to
  `ADMIN` directly in MySQL, logged out/in again (role is read at login time per
  API_REFERENCE.md's gotcha note), and the admin links appeared; refreshing on `/admin/problems`
  while authenticated preserved both the route and the admin nav.

**Next:** Phase 4 — Problems list page (filterable, paginated, backed by `GET /api/problems`).

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
