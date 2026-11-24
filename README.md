# Fab QA Scheduler

A collaborative weekly QA-coverage planner for a microchip manufacturer
(Nexsil Microsystems). React + Vite + TypeScript implementation of the
**Fab QA Scheduler** design handed off from Claude Design.

## Running

```bash
npm install
npm run dev      # Vite-only development with browser-local data/auth; sign up locally
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

The deployed Worker verifies passwords, issues an HttpOnly session cookie,
and requires that session for scheduler API access. “Remember me” keeps a
server session for up to 30 days; regular sessions expire after 12 hours.
Account registration requires the Worker secret `REGISTRATION_CODE`.
Password changes require the current password. Vite-only authentication is a
development fallback and does not provide server-backed access control. Vite-only signup creates a browser-local account and does not need the staff code.

## What's included

- **Login** — User ID/password sign-in, server-verified sessions, optional Remember me, staff-code-gated registration, and password changes verified against the current password.
- **Schedule** — a Week / Month scale toggle plus four grouping views
  (By QA / By internal / By customer / By sub-department). The weekly scale is a sticky grid
  with drag-and-drop staffing from the unstaffed-order pool,
  drag-to-reschedule, live conflict detection (double-booking), week navigation with "copy week", Employee/Customer
  filters and per-site visibility toggles, presence avatars, and an
  activity feed.
- **Month view** — a 7-column calendar (today outlined, weekends dimmed)
  with per-day appointment/conflict badges and order chips; click any weekday to
  drill into that week. Below the grid, a "Customer orders · {month}"
  card section summarises appointments / days / engineers / conflicts per order.
  Month navigation and the period label/tag follow the active scale.
- **Detail panel** — order/customer info, department + sub-department, day/night
  toggle, notes thread, duplicate/remove.
- **Create-appointment modal** — pick an order + engineer side-by-side with live
  busy validation and a conflict-warning banner; also opens prefilled
  from an empty grid cell.
- **Create-order modal** — open a new customer order (code, product,
  customer with suggestions, internal site, priority) into the
  unstaffed pool.
- **Create engineer / fab site / customer** — modal forms (opened from the
  user menu, plus the Manage tabs for engineers and sites) that add real
  records: a new engineer joins the roster and grids; a new fab site flows
  into the sidebar, site filter/visibility, By-site view and order form; a
  new customer appears in the By-customer view, filter and order
  suggestions. Each logs to the activity feed.
- **Leave / time-off** — log per-day leave (Vacation / Sick / Personal /
  Training) for an engineer across the viewed week, so the team sees who's
  unavailable. Leave days show as striped tags in the By-engineer grid
  (click to clear) and count as conflicts when an engineer is staffed on a
  day they're off — surfaced in the chip, day header, conflict pill, detail
  panel, create-appointment validation, and month badges. Opened from the
  schedule toolbar's "Leave" button or the user menu. On the mobile
  single-day layout, an "Away" banner lists who's off on the selected day
  and the day strip dots the days that have absences.
- **Profile** — banner header, planning stats, account details, sites under
  coverage, and a personal activity feed.
- **Manage (admin)** — stat cards plus Engineers / Fab sites / Customer
  orders tabs.
- **Responsive** — below ~860px the app reflows to a hamburger drawer,
  single-day card list, compact month calendar, full-screen modal/detail,
  and a stacked login.

API writes are optimistic for a fast interface. If a save fails, the app
shows a warning; after reloading, authenticated server data replaces the
browser snapshot so an unsuccessful change is not presented as saved.
`npm run dev` uses browser-local development accounts and data. The Cloudflare
Worker + D1 deployment provides shared persistence and protected API access.

## Structure

| Path | Purpose |
| --- | --- |
| `src/types.ts` | Domain types (Engineer, Order, Assignment, …) |
| `src/data.ts` | Constants + seeded initial state |
| `src/useScheduler.ts` | Scheduler state and actions; restores the server session, hydrates from `/api/state`, and reports failed mutations |
| `src/api.ts` | Fetch client for the `/api/*` endpoints |
| `src/ui.tsx` | `css()` style-string parser + hover/focus helper components |
| `src/components/*` | Login, Header, Schedule, DetailPanel, CreateModal, EditModal, AppointmentFormFields (shared Customer/Internal Audit fields), OrderModal, EngineerModal, SiteModal, Admin, Profile |
| `worker/index.ts` | Cloudflare Worker — serves the SPA, verifies sessions, protects `/api/*`, and stores shared data in D1 |
| `migrations/0001_init.sql` | D1 schema + seed data (base fab sites only) |
| `migrations/0018_sessions.sql` | Server-side session table for hashed session tokens |
| `migrations/0019_remove_demo_users.sql` | Removes legacy accounts with published demo credentials |
| `wrangler.toml` | Cloudflare Worker + static assets + D1 binding config |

Styling mirrors the design prototype's inline styles verbatim (parsed via
`css()`) to stay pixel-accurate.

## Backend & deployment (Cloudflare Workers + static assets + D1)

The Cloudflare project here (`utac-qa-calendar`) is a **Worker**, not a
classic Pages project. `worker/index.ts` handles `/api/*` requests itself
and serves everything else from the built `dist/` folder via the `[assets]`
binding in `wrangler.toml` — so the same Worker serves both the SPA and its
API, backed by a D1 (SQLite) database shared across everyone using the
deployed URL.

First-time setup (run these yourself — they touch your own Cloudflare
account):

```bash
npx wrangler login
npx wrangler d1 create calendar-qa-db
# paste the returned database_id into wrangler.toml
npx wrangler secret put REGISTRATION_CODE
npm run migrate:remote
npm run deploy
```

Apply migrations before opening registration. On a fresh database, the first
account registered with the staff code receives the `admin` role; subsequent
accounts receive the `user` role. Keep the code private and share it only with
staff who should have access. Migration `0019_remove_demo_users.sql` deletes
the published demo accounts and promotes the earliest remaining account if no
admin account exists.

To develop against a local D1 instance instead of plain Vite:

```bash
npm run migrate:local
npm run dev:worker
```

For local Worker signups, put `REGISTRATION_CODE=your-local-code` in an
untracked `.dev.vars` file. Do not commit that file or the production secret.

Alternatively, connect the GitHub repo in the Cloudflare dashboard (Workers
& Pages → your project → Settings → Builds & deployments) for auto-deploy
on every push to `main`. Set the **Deploy command** there to
`npx wrangler deploy` (no `--project-name` needed for Workers — that flag is
Pages-only) and make sure **Build command** is `npm run build` — the D1
binding is read from `wrangler.toml` automatically for Workers deploys,
unlike Pages, so no separate dashboard binding step is needed.
