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

- [x] Done

**Built:**
- [src/types/problem.ts](src/types/problem.ts) (`Difficulty`, `Problem`) and a generic
  `Page<T>` added to [src/types/api.ts](src/types/api.ts) (Spring Data's page shape — only
  `GET /api/problems` uses it, per API_REFERENCE.md's gotchas section).
- [src/api/problems.ts](src/api/problems.ts): `listProblems()` building the
  `?difficulty=&topic=&page=&size=` query string, all params optional.
- [src/pages/Problems.tsx](src/pages/Problems.tsx): difficulty `<select>` (EASY/MEDIUM/HARD)
  and a debounced (400ms) topic text input, both driving the request; 0-indexed pagination
  using the backend's own `first`/`last`/`number`/`totalPages` flags rather than computing
  them client-side. Loading skeleton, error banner, and an empty state all covered.
- Reusable [src/components/DifficultyBadge.tsx](src/components/DifficultyBadge.tsx) (color
  by difficulty) and [src/components/ListSkeleton.tsx](src/components/ListSkeleton.tsx),
  meant to be reused by later list-y pages (Contests, Admin Problems, etc).
- Added a `src/pages/ProblemDetail.tsx` placeholder + `/problems/:id` route so the problem
  cards have somewhere real to link to ahead of Phase 5.

**Decisions/deviations:**
- Filter state (`difficulty`, `topic`, `page`) lives in local component state, not the URL —
  kept simple per the project's "no heavier state library" scope; not required by the guide's
  verify checklist either.
- Confirmed via the backend source (`ProblemService.buildSpecification`) that `topic` is an
  exact-match filter (`cb.equal`), not a substring search — the text input just passes
  whatever's typed straight through, no partial-match UI implied.
- Hit an oxlint `set-state-in-effect` warning twice: fixed the page-reset-on-filter-change
  one cleanly by moving `setPage(0)` into the actual events that change a filter (the select's
  `onChange`, the topic debounce's timeout callback) instead of a separate effect keyed on
  `[difficulty, topic]`. Left the other (`setState('loading')` at the top of the fetch effect)
  as-is — it's the standard "set loading, then fetch" pattern; avoiding it would mean deriving
  loading state from a request-tracking ref for no real correctness benefit.
- Verified end-to-end in-browser against the real seeded data (6 problems): temporarily set
  `PAGE_SIZE = 2` to force multiple pages, confirmed page 2 shows different problems than page
  1 and Previous/Next disable correctly at the ends, then reverted to `PAGE_SIZE = 10`.
  Confirmed combined difficulty+topic filtering narrows correctly (`EASY` + `Arrays` → exactly
  the 2 matching problems), an unmatched filter shows the empty state, and stopping the
  backend shows the error banner without crashing or falsely triggering the 401 logout path.

**Next:** Phase 5 — Problem Detail page (`GET /api/problems/{id}`, 404 handling).

---

## Phase 5: Problem Detail Page

- [x] Done

**Built:**
- `getProblem(id)` added to [src/api/problems.ts](src/api/problems.ts) (`GET
  /api/problems/{id}`).
- [src/pages/ProblemDetail.tsx](src/pages/ProblemDetail.tsx): reads `:id` via `useParams`,
  renders title, `DifficultyBadge`, topic, description (as prose), and constraints/input
  format/output format/sample input/sample output each in a monospace `<pre>` block.
  Loading, not-found, and generic-error states all covered; no submit action yet (that's
  Phase 10, tied to an active contest).
- Replaced the Phase 4 `ProblemDetail` placeholder and its route with the real page — same
  `/problems/:id` route.

**Decisions/deviations:**
- Checked the backend's actual error behavior for bad ids rather than assuming: a numeric id
  that doesn't exist returns the documented `404 {status, message}` shape, but a *non-numeric*
  id (e.g. `/problems/abc`) returns a plain `400` from Spring's default handler with a
  completely different body shape (`{timestamp, status, error, path}` — no `message` field).
  My existing API client already degrades gracefully on that (falls back to a generic
  message), and since either case means "this id doesn't resolve to a real problem," both
  404 and 400 are treated as the same "Problem not found" state here.
- Same accepted `set-state-in-effect` oxlint pattern as Phase 4's fetch effect (set loading,
  then fetch) — consistent call, not re-litigated.
- Verified end-to-end in-browser: a real id (5, "Two Sum") renders all six sections
  correctly; a well-formed-but-nonexistent id (99999) and a malformed id (`abc`) both show
  the not-found state without an error-boundary crash; clicking a problem card from the
  Problems list correctly navigates to its detail page and renders the right difficulty
  badge color (confirmed `badge--medium` for a MEDIUM problem).

**Next:** Phase 6 — Admin Problem Management (create/edit/delete, `ROLE_ADMIN`-gated).

---

## Phase 5: Problem Detail Page

- [ ] Done

**Built:**

**Decisions/deviations:**

**Next:**

---

## Phase 6: Admin Problem Management

- [x] Done

**Built:**
- `createProblem`/`updateProblem`/`deleteProblem` added to
  [src/api/problems.ts](src/api/problems.ts); `ProblemPayload` type added to
  [src/types/problem.ts](src/types/problem.ts) (`Omit<Problem, 'id' | 'createdAt'>`, matching
  the backend's `ProblemRequest` wire shape exactly).
- [src/components/AdminRoute.tsx](src/components/AdminRoute.tsx): route guard nested inside
  `ProtectedRoute`/`AppLayout`, redirects to `/` when `user.role !== 'ADMIN'`. While the
  profile fetch is still in flight (token set, `user` not yet loaded) it shows a brief
  "Checking access…" instead of redirecting, so a real admin can't get bounced by a race
  against `AuthProvider`'s `GET /api/users/me` call.
- [src/components/ProblemForm.tsx](src/components/ProblemForm.tsx): shared create/edit form
  for all 9 `ProblemRequest` fields, with a hand-rolled `validate()` mirroring the backend's
  `@NotBlank`/`@NotNull` rules field-for-field (checked `ProblemRequest.java` directly rather
  than guessing) — every field is required, so validation fails fast client-side before any
  network round-trip. On a 403 it shows "You are not authorized..."; on a 400 it falls back to
  `parseFieldErrors`.
- [src/pages/Admin/AdminProblems.tsx](src/pages/Admin/AdminProblems.tsx): replaced the Phase 3
  placeholder. Flat list (all problems, `size=100`, no filters/pagination — this is
  management, not the Phase 4 browsing UI) with Edit/Delete per row; a "New Problem" button
  toggles the create form; Edit swaps in the same form pre-filled via the existing problem.
  Delete calls `window.confirm` before hitting the API; a 403 there shows a page-level
  "not authorized" banner (delete doesn't route through `ProblemForm`'s own error UI).
- Wired `AdminRoute` into [src/App.tsx](src/App.tsx) around both `/admin/problems` and
  `/admin/contests`.

**Decisions/deviations:**
- Checked the real `ProblemRequest` DTO in the backend source instead of assuming which
  fields are required — confirmed all 9 are (`@NotBlank` on the 8 strings, `@NotNull` on
  `difficulty`), so `validate()` requires every field with no optional ones.
- Admin problem management is intentionally a flat, unpaginated list capped at 100 — the
  guide doesn't ask for filter/pagination parity with Phase 4 here, and a flat list is more
  useful for an admin scanning everything to edit/delete.
- Verified end-to-end in-browser: a plain `USER` account (freshly registered) navigating
  directly to `/admin/problems` is redirected to `/` (route guard, not just a hidden nav
  link); as `ADMIN`, submitting the empty create form shows all 9 required-field errors with
  no network call; creating a valid problem shows it immediately in both the admin list and
  the Phase 4 Problems list; editing pre-fills every field (including the two sample
  input/output textareas, confirmed via their actual DOM `.value`, since the accessibility
  tree didn't surface their text) and the change persists; clicking Delete with the
  browser's native confirm dialog auto-dismissed (cancel) correctly left the problem in
  place, and stubbing `window.confirm` to return `true` confirmed the accept path actually
  deletes it.

**Next:** Phase 7 — Contests List & Detail (server-driven `UPCOMING`/`ACTIVE`/`ENDED` status,
polled every 5–10s).

---

## Phase 7: Contests List & Detail

- [x] Done

**Built:**
- [src/types/contest.ts](src/types/contest.ts) (`Contest`, `ContestStatus`,
  `ContestStatusInfo`) and [src/api/contests.ts](src/api/contests.ts) (`listContests`,
  `getContest`, `getContestStatus`).
- [src/hooks/useContestStatus.ts](src/hooks/useContestStatus.ts): polls `GET
  /api/contests/{id}/status` every 7s (within the guide's 5-10s window). `status` is always
  exactly what the last poll returned — never computed from the client's clock. Between
  polls, `remainingSeconds` ticks down locally once a second purely for a smooth countdown
  display; the next poll's server value always overwrites it. Also exports a pure
  `formatCountdown()` helper (`"17m 26s"` style, drops leading zero units).
- [src/components/StatusPill.tsx](src/components/StatusPill.tsx): presentational-only status
  badge (no data fetching), reused by both pages.
- [src/pages/Contests.tsx](src/pages/Contests.tsx): fetches the plain array from
  `GET /api/contests` once, then each card independently polls its own status via
  `useContestStatus` for a live badge.
- [src/pages/ContestDetail.tsx](src/pages/ContestDetail.tsx): title, status pill, a
  human-readable "Starts in"/"Ends in" countdown (hidden once `ENDED`), description, and
  start/end times. 404/400 → not-found state; other failures → error banner. No associated
  problems section (see deviation below).

**Decisions/deviations:**
- **Backend contract gap — originally left unresolved, now closed.** `ContestResponse` had no
  `problems` field and there was no `GET /api/contests/{id}/problems` endpoint — checked
  `ContestController`/`ContestService` directly; `ContestProblemRepository.findByContestId`
  already existed but was only ever used internally when *attaching* a problem, never to read
  them back. Flagged this to the user with two concrete fix options (a dedicated GET endpoint,
  mirroring the existing attach endpoint's URL shape; or embedding `problems` directly in
  `ContestResponse`); they chose to build without it at the time. **Update:** the backend has
  since added `GET /api/contests/{id}/problems` (the dedicated-endpoint option). Confirmed its
  live shape via curl against a contest with attached problems — plain array of full
  `ProblemResponse` objects, `200 + []` (not 404) when a contest has none attached, `404` if
  the contest itself doesn't exist — documented in `API_REFERENCE.md`. Wired it up: added
  `getContestProblems()` to `src/api/contests.ts`, and `ContestDetail.tsx` now has a
  "Problems" section listing each attached problem (title, difficulty badge, topic) linking to
  its Problem Detail page, with its own loading/error/empty states independent of the
  contest's own fetch. Verified live: a contest with 2 attached problems (via a fresh
  `POST .../problems/{problemId}` call) renders both with working links to
  `/problems/{id}`; a contest with none shows "No problems have been added to this contest
  yet." distinctly from the loading skeleton and error banner.
- List page polls status per-card independently (N pollers for N contests) rather than one
  batched call, since there's no batch status endpoint — fine at this project's contest-count
  scale, matches the guide's "poll while the page is open" instruction literally.
- `new Date(contest.startTime).toLocaleString()` displays correctly only because the backend
  stores/compares `LocalDateTime` with no timezone info and this project's frontend and
  backend run on the same machine in the same timezone (per API_REFERENCE.md's gotcha on
  `startTime`/`endTime`). Not a bug to fix here — just a limitation inherent to the backend's
  timezone-less design, worth knowing about before any real multi-timezone deployment.
- Verified end-to-end against real contest data seeded via direct API calls (no admin contest
  UI yet — that's Phase 9): confirmed the list's per-card badges match live backend state
  including two contests that were already `ENDED`; watched an `ACTIVE` contest's detail-page
  countdown genuinely tick down over several seconds and cross-checked it against a fresh
  `GET .../status` call; caught a real `UPCOMING`→`ACTIVE` transition organically (a seeded
  contest's start time passed mid-session and the poll picked it up automatically, with zero
  client-side clock logic involved); confirmed an `ENDED` contest shows no countdown; and
  confirmed a nonexistent contest id shows the not-found state without crashing.

**Next:** Phase 8 — Contest Join Flow (join button, 409/400 handling, refetch on success).

---

## Phase 8: Contest Join Flow

- [x] Done

**Built:**
- `joinContest(id)` added to [src/api/contests.ts](src/api/contests.ts) (`POST
  /api/contests/{id}/join`, no body).
- [src/hooks/useContestStatus.ts](src/hooks/useContestStatus.ts) now also exposes
  `hasJoined` (from the status response) and a `refetch()` function that triggers an
  immediate poll instead of waiting for the next scheduled one — used right after a
  successful join so the button flips state without a delay.
- [src/pages/ContestDetail.tsx](src/pages/ContestDetail.tsx): a Join area under the
  countdown. Shows "Join Contest" only when `hasJoined === false` and `status !== 'ENDED'`;
  shows a disabled "Joined" button when `hasJoined === true`; shows neither once ended
  without having joined. A 409 shows an info banner ("You've already joined this contest.")
  and also triggers `refetch()` to correct any stale local state; a 400 (ended) shows the
  backend's own message verbatim; anything else falls back to a generic error banner. None
  of this touched Phase 7's status polling, countdown, or contests list.

**Decisions/deviations:**
- **Backend contract gap, same category as Phase 3/7 — resolved with the user's go-ahead.**
  There was no way for the frontend to know if the current user had already joined a given
  contest: `ContestParticipantRepository.existsByUserIdAndContestId` existed and was already
  used internally by `join()`, but nothing exposed it for reading. Flagged it with a
  recommended fix (add `hasJoined` to `ContestStatusResponse`, populated via a new
  `ContestParticipantService.hasJoined()` reusing the existing repository check, wired into
  the already-`@AuthenticationPrincipal`-aware `/status` endpoint); the user applied it
  verbatim in the backend project. Confirmed live via curl before touching any frontend
  code: `hasJoined` correctly starts `false`, flips to `true` immediately after a real
  `POST .../join`, and a duplicate join returns `409 {"message":"Already joined this
  contest"}` while an ended-contest join returns `400 {"message":"Contest has already
  ended"}` — both matching the error shape the UI is built to handle.
  - Mid-session gotcha: a stale orphaned backend process was still bound to port 8080 from
    an earlier turn, serving the pre-`hasJoined` build even after the source files were
    edited (JVMs don't hot-reload). Killed it and started fresh before the new field showed
    up — worth remembering for future phases: a passing health check doesn't guarantee
    you're talking to freshly-compiled code after a backend source change.
- Verified end-to-end in-browser across two sessions (the browser tab was interrupted
  mid-click in the first one, resumed cleanly in the second — confirmed via `git status`/
  `git diff` that the Phase 8 code was already fully written and just needed
  re-verification, not re-building): a fresh user sees "Join Contest" on an `ACTIVE`
  contest; clicking it flips immediately to a disabled "Joined" with no page reload; a full
  refresh preserves the joined state (fetched fresh from the backend, not cached
  client-side); forcing the real API call a second time for an already-joined contest
  returns the exact `409` shape the catch block expects, and forcing it against a contest
  that ended since being joined returns the exact `400` shape — both confirmed directly
  against the running backend rather than assumed. Also reproduced the 409 through genuine
  concurrent joins (joined the same contest from a second account via direct API call while
  a stale "Join Contest" page sat open) — the natural 7s poll closed the race window before
  the click could land, which is itself a correctness signal that the poller keeps the UI
  honest without user action.

**Next:** Phase 9 — Admin Contest Management (create contest, attach problems,
`end_time > start_time` client-side validation).

---

## Phase 9: Admin Contest Management

- [x] Done

**Built:**
- `ContestPayload` type added to [src/types/contest.ts](src/types/contest.ts); `createContest`
  and `attachProblemToContest` added to [src/api/contests.ts](src/api/contests.ts) (`POST
  /api/contests` and `POST /api/contests/{contestId}/problems/{problemId}`).
- [src/pages/Admin/AdminContests.tsx](src/pages/Admin/AdminContests.tsx): a create-contest
  form (title, description, two `datetime-local` inputs) with client-side validation
  mirroring `ContestRequest`'s exact rules — checked the real DTO
  (`@NotBlank`/`@NotNull`/class-level `@EndTimeAfterStartTime`) rather than assuming, so
  `endTime <= startTime` is rejected client-side (matching the backend's `isAfter`, i.e.
  strictly after — equal times fail too) before any request goes out. Below it, a flat list
  of every existing contest, each with a "Manage Problems" toggle.
- [src/components/ContestProblemsPanel.tsx](src/components/ContestProblemsPanel.tsx): the
  problem-attach UI — reuses Phase 4's `listProblems` (as one large page, matching
  `AdminProblems`'s pattern) and Phase 7's `getContestProblems` to show every problem with an
  "Attach" button, already-disabled+labeled "Attached" for ones already on the contest. A
  409 (already attached, e.g. from a stale second tab) just corrects local state silently
  rather than showing an error, since nothing actually went wrong from the user's
  perspective.
- No edit/delete for contests — the backend has no `PUT`/`DELETE /api/contests/{id}`
  (confirmed via `ContestController`), so unlike Phase 6's problems there's nothing to build
  there.

**Decisions/deviations:**
- Kept the create form's `startTime`/`endTime` as raw `datetime-local` strings
  (`"YYYY-MM-DDTHH:mm"`) all the way through — including the client-side after-check, which
  just does a plain string comparison (`endTime <= startTime`), safe because the format is
  lexicographically ordered the same as chronologically for same-length values. Deliberately
  never touches a JS `Date` object for this payload: the backend interprets these strings as
  its own local wall-clock time with zero zone conversion (API_REFERENCE.md's gotcha), and
  round-tripping through `Date`/`toISOString()` would risk introducing an offset shift that
  isn't wanted here. Only appends `:00` for seconds before sending, since `datetime-local`
  omits them.
- No pagination/filtering on the admin contest list (same call as `AdminProblems` in
  Phase 6) — this is management, not browsing.
- Verified end-to-end in-browser as `ADMIN`: submitting the create form with end time before
  start time is blocked with "End time must be after start time" and fires zero network
  requests; a valid submission creates the contest, closes the form, and it appears both in
  the admin list and — confirmed separately — in the Phase 7 public Contests list with the
  correct live status (`UPCOMING`, matching the future start time with no timezone drift);
  opening "Manage Problems" and attaching a problem flips its button to a disabled
  "Attached" immediately, leaves an identically-titled *different* problem (different id)
  independently attachable, and the attached problem shows up on the contest's public detail
  page with a working link. Forced a duplicate attach via direct API call and confirmed it
  returns the exact `409 {"message":"Problem already added to this contest"}` shape the
  catch block is built to handle. Also reconfirmed a fresh non-admin account is redirected
  away from `/admin/contests` by the same `AdminRoute` guard from Phase 6.

**Next:** Phase 10 — Submission Form & My Submissions (manual status field, per-rejection-
reason messaging: not joined / not active / problem not in contest).

---

## Phase 10: Submission Form & My Submissions

- [x] Done

**Built:**
- `SubmissionStatus`, `SubmissionPayload`, `Submission` types added to
  [src/types/submission.ts](src/types/submission.ts); `createSubmission`/`listMySubmissions`
  added to [src/api/submissions.ts](src/api/submissions.ts) (`POST /api/submissions`, `GET
  /api/submissions/my`). Checked the real `SubmissionRequest`/`SubmissionService` source
  first — `language` is a free-form `@NotBlank` string (no enum), `status` is required, and
  the rejection order/exact messages (`"You have not joined this contest"`, `"Contest is not
  currently active"`, `"Problem does not belong to this contest"`) are all plain `400`s with
  distinct text, no field prefix — so the UI just shows `err.message` verbatim rather than
  re-wording backend text into custom copy.
- [src/pages/ProblemDetail.tsx](src/pages/ProblemDetail.tsx): a "Submit Solution" section
  that only renders when the page is reached with a `?contestId=` query param (added to
  [ContestDetail.tsx](src/pages/ContestDetail.tsx)'s problem links). Shows which contest
  it's for (fetches the title, falls back to `#<id>` if that fetch fails), a clear
  disclaimer that status is picked manually (no real judge in v1), and a form for
  language/source code/status. Client-side validation (all three required) blocks
  submission before any network call; every backend rejection shows as its own banner.
- [src/pages/Submissions.tsx](src/pages/Submissions.tsx): a table of the caller's own
  submissions — problem/contest (both linked), language, status (color-coded), score,
  submitted-at — relying entirely on the backend's own newest-first ordering
  (`findByUserIdOrderBySubmittedAtDesc`), no client re-sort.

**Decisions/deviations:**
- Chose a query param (`/problems/:id?contestId=X`) over a new nested route
  (`/contests/:cid/problems/:pid`) to carry contest context onto the existing Problem Detail
  page — reuses the Phase 5 page as-is instead of duplicating it, and needed no routing
  changes.
- The submit form always renders once `contestId` is present, regardless of the contest's
  live status — deliberately not gating it client-side on `ACTIVE`, since the guide
  explicitly wants the "contest not active" rejection handled and displayed, which requires
  the form to actually be reachable in that state (e.g. a joined contest that ended, or an
  upcoming one, both still linked from their own detail pages).
- Verified end-to-end in-browser with a fresh user across three real contests: submitting to
  a joined-but-not-yet-active contest and one where the caller hadn't joined at all produced
  the two distinct messages; navigating to an attached problem via `?contestId=` for an
  *unattached* problem+contest pair returned "Problem does not belong to this contest";
  after joining a genuinely `ACTIVE` contest, a real submission returned `ACCEPTED`/score
  100 for an `EASY` problem (matching the documented 100/200/300-by-difficulty rule) and
  appeared immediately and correctly in My Submissions with working links back to the
  problem and contest; empty-form submission showed all three required-field errors with
  zero network calls; and visiting a problem without `?contestId=` shows no submit section
  at all, matching Phase 5's original "no submit action outside a contest" behavior.

**Next:** Phase 11 — Leaderboard Page (per-contest ranked standings, own-row highlight).

---

## Phase 11: Leaderboard Page

- [x] Done

**Built:**
- `LeaderboardEntry` type added to [src/types/leaderboard.ts](src/types/leaderboard.ts);
  `getContestLeaderboard` added to [src/api/contests.ts](src/api/contests.ts) (`GET
  /api/contests/{id}/leaderboard`).
- [src/pages/Leaderboard.tsx](src/pages/Leaderboard.tsx) at the new `/contests/:id/leaderboard`
  route: rank/username/score table rendered in exactly the order the backend returns it (no
  client-side sort), with the logged-in user's own row (matched by username via `useAuth()`)
  visually highlighted. Fetches the contest title too (same pattern as Phase 10's submission
  section) for the heading, falling back gracefully if that fetch fails. 404/400 → not-found
  state; a genuinely empty contest (no participants) shows its own distinct message
  ("No one has joined this contest yet.") rather than an empty table.
- Added a "View Leaderboard" link on [ContestDetail.tsx](src/pages/ContestDetail.tsx).

**Decisions/deviations:**
- Checked `LeaderboardService` directly rather than assuming: the entry shape is exactly
  `{rank, username, score}`, and the "+10 participating / +50 top-3" rating bonus the API
  reference mentions is guarded per-participant (`participant.isRatingApplied()`) so
  re-fetching after a contest ends is idempotent — confirmed this meant a single fetch on
  mount is correct and sufficient; no polling needed the way contest status is polled, and
  no special guard needed against "viewing it twice."
- Verified end-to-end in-browser: seeded a fresh `ACTIVE` contest, joined it with two real
  accounts, and had each submit an `ACCEPTED` solution to a different-difficulty problem
  (200 and 100 points) — the rendered table matched the backend's own rank order exactly,
  and the logged-in account's row (not the higher-ranked one) carried the highlight class
  while the other row didn't. Also confirmed a contest with zero participants shows the
  distinct empty state, and a nonexistent contest id shows the not-found state without
  crashing.

**Next:** Phase 12 — Profile Page (read-only `GET /api/users/me` stat cards).

---

## Phase 12: Profile Page

- [x] Done

**Built:**
- [src/pages/Profile.tsx](src/pages/Profile.tsx): four read-only stat cards (username,
  rating, problems solved, contests joined) backed by `GET /api/users/me`. No editing —
  matches the endpoint being read-only in v1.

**Decisions/deviations:**
- `getMe()` and the `UserProfile` type already existed from Phase 3 (where `AuthProvider`
  uses them to populate the navbar) — reused as-is, nothing new needed in `src/api` or
  `src/types`.
- Deliberately gives Profile its own fresh fetch on mount rather than just reading
  `useAuth().user` (which `AuthProvider` only refetches on login or a fresh page load, not
  after in-session actions). This page's whole point is showing current stats, so it
  shouldn't risk showing a stale rating/count if the user solved a problem or joined a
  contest earlier in the same session without reloading.
- Verified in-browser: cross-checked a real account's rendered values (username, rating 60,
  1 problem solved, 3 contests joined) directly against a `GET /api/users/me` curl call —
  exact match on all four fields.

**Next:** Phase 13 — Polish: consistent error/loading handling, responsive layout.

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
