# Builder Portal

The operational system for Matthews CRE's **Citizen Builder Program** — a single
front door for every internal app at Matthews. Built per the
[Citizen Builder Portal PRD v1.1](./citizen-builder-portal-prd.md).

> **Naming.** The product/app is named **Builder Portal**. The underlying
> *program* (per PRD §1) is the *Citizen Builder Program*. Everywhere the user
> sees it — the top-nav lockup, the login screen, page titles, this README —
> we use "Builder Portal".

---

## What's in v1

All four PRD phases (§9) are implemented:

| Phase | Surface | Path |
|---|---|---|
| 1 | Registry (browse / filter / search) | `/registry` |
| 1 | Classification wizard (5 steps, edge-case interrupts) | `/register` |
| 1 | Project detail (3-column on desktop) | `/projects/[id]` |
| 1 | My Projects | `/my-projects` |
| 2 | PX admin triage queue (bulk approve / revise / reject) | `/triage` |
| 2 | Classification override modal + audit log | `/projects/[id]` |
| 2 | Sponsor + department CRUD | `/sponsors`, `/departments` |
| 2 | Resource assignment (PM / design / eng / PX coach) | `/projects/[id]` |
| 2 | Email notifications via Resend (no-op fallback) | — |
| 3 | Wrike manual import + scheduled cron sync | `/wrike-import` + `/api/wrike/sync` |
| 3 | Portfolio dashboard + CSV export | `/portfolio` |
| 3 | Status / milestone transitions | `/projects/[id]` |
| 3 | Immutable audit log UI | `/audit-log` |
| 4 | Provisioning hook (stub-backed, swappable) | `/projects/[id]` provisioning panel |
| 4 | Sponsor sign-off queue | `/sign-off` |
| 4 | RLS policies for Builder / PX Admin / Sponsor / Read-only | `supabase/migrations/0001_rls.sql` |

The **classification function** (`lib/classification/classify.ts`) is a pure
function that mirrors PRD §6.2 rules in the documented order, with full unit
tests in `lib/classification/classify.test.ts`.

---

## Stack

- **Next.js 15** (App Router) + **TypeScript**, React 19
- **Tailwind v4** with the Matthews token system in `app/globals.css`
- **Supabase** (Postgres + Auth) with magic-link sign-in
- **Prisma** ORM
- **shadcn/ui** primitives styled to Matthews tokens (no stock styles)
- **Recharts** for portfolio data viz
- **Resend** for email (optional)
- **Vitest** for unit tests
- **Vercel Cron** for the daily Wrike sync (`vercel.json`)

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

> If you don't have Node.js + npm, install Node 20+ from <https://nodejs.org>
> first. Bun, pnpm, and yarn all work too.

### 2. Set up Supabase

1. Create a project at <https://supabase.com>.
2. From **Project Settings → API**, copy the URL, anon key, and service-role
   key into a new `.env.local` file (start from `.env.example`).
3. From **Project Settings → Database**, copy the **Transaction pooler**
   connection string for `DATABASE_URL` and the **Direct connection** string
   for `DIRECT_URL`.

### 3. Generate, push schema, seed

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

`db:seed` creates a PX admin (`px-admin@matthews.test`), a sponsor for each of
the five PRD audiences, a couple of builders, and the seven seed departments.
Use **Sign in** on `/login` with any of those emails — Supabase will magic-link
you in (you'll need to add them as users in the Supabase Auth tab, or just
sign in with your real Matthews email and update the role in the Supabase
table editor).

### 4. (Optional) Install RLS policies

```bash
psql "$DATABASE_URL" -f supabase/migrations/0001_rls.sql
```

RLS is the second line of defense for direct Supabase API access. The portal
itself reads/writes through Prisma using your Postgres connection string.

### 5. Run the app

```bash
npm run dev
```

Open <http://localhost:3000>. You'll be redirected to `/login`.

### 6. Run tests

```bash
npm test
```

The classification rules have full branch coverage in
`lib/classification/classify.test.ts`.

---

## Optional integrations

### Email (Resend)

Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. If unset, every email is logged
to stdout and the in-app notification still fires — the portal works without
email configured.

### Wrike

Set `WRIKE_TOKEN` (Bearer token). With no token the Wrike client is a
deterministic stub that emits two fake projects so the import UI is testable.

For scheduled sync, set `WRIKE_SYNC_FOLDER_ID` and `CRON_SECRET`. The cron
route at `/api/wrike/sync` will refuse calls without the matching
`x-cron-secret` header. `vercel.json` triggers it daily at 06:00 UTC.

---

## Using with Lovable

[Lovable](https://lovable.dev) does not offer a separate “import ZIP” flow for
this codebase. Per [their FAQ](https://lovable.dev/faq/github/import-github-repo),
you **connect GitHub to a Lovable project** and **select this repository** so
Lovable reads and syncs the existing code (two-way with GitHub).

**Recommended workflow**

1. **Push this repo to GitHub** (see “Git repository” below if you have not
   initialized Git yet).
2. In Lovable, **create a new project** (or open project settings) and **Connect
   GitHub**.
3. When prompted, **choose this repository**. Grant access if GitHub asks
   (private repos and orgs may need extra OAuth scopes).
4. In Lovable’s **environment / secrets** UI (and/or your host), copy values
   from `.env.example`: Supabase URL and keys, `DATABASE_URL`, `DIRECT_URL`,
   optional `RESEND_*`, `WRIKE_*`, `CRON_SECRET`, etc. Never commit real secrets.
5. Run **`npm install`**, **`npx prisma generate`**, and **`prisma db push`**
   (or your migration pipeline) against your Supabase DB when deploying —
   Lovable edits UI quickly; **Next.js + Prisma + Supabase** still needs a real
   database and env vars to run fully.

**Note:** If build fails in Lovable’s preview, compare Node version (use **Node
20+**), ensure `postinstall` / Prisma generate runs, and check that server-side
routes have required env vars.

---

## Git repository

This folder ships **initialized as a Git repo** with an initial commit so you
can **add a GitHub remote** and push:

```bash
git remote add origin https://github.com/YOUR_ORG/builder-portal.git
git branch -M main
git push -u origin main
```

Replace the URL with your actual GitHub repository.

---

## Architecture notes

### Project layout

```
/app
  /(auth)/login                — magic-link sign-in
  /(app)/registry              — public-to-Matthews catalog
  /(app)/register              — the wizard (Phase 1)
  /(app)/projects/[id]         — three-column project detail
  /(app)/my-projects           — builder's own list
  /(app)/triage                — PX admin (Deep Blue surface)
  /(app)/portfolio             — charts + CSV export
  /(app)/sponsors              — admin CRUD
  /(app)/departments           — admin CRUD
  /(app)/wrike-import          — Wrike manual import
  /(app)/audit-log             — immutable history
  /(app)/sign-off              — sponsor queue
  /api/auth/...                — Supabase callback + signout
  /api/wrike/sync              — scheduled cron
  /api/portfolio/export        — CSV export
/lib
  /classification/classify.ts  — pure function (heart of the app)
  /db                          — Prisma client + queries
  /supabase                    — server/browser/middleware
  /auth                        — session + role guards
  /projects                    — server actions for wizard/detail/triage
  /admin                       — server actions for CRUD
  /wrike                       — Wrike REST client + import
  /email                       — Resend wrapper + Notification persistence
  /audit                       — writeAuditLog()
  /notifications               — in-app bell server actions
/components
  /brand                       — SectionHeading, StatusChip, DataTable, …
  /ui                          — shadcn-style primitives (Matthews-tokened)
  /wizard                      — 5-step classification flow
  /registry, /project, /admin  — surface-specific components
  /app-shell                   — top nav + notification bell
/prisma                        — schema + seed
/supabase/migrations           — RLS policies
```

### Visual identity

The design system is locked to **Matthews™ Visual Identity Guidelines v1.0
(Feb 2026)** as documented in PRD §7. The most reused brand device — the
2pt Electric Blue **vertical support line** next to every page heading — is
encoded once in `<SectionHeading>` and used everywhere.

The portfolio dashboard, registry table, triage queue, and project detail
all conform to the table + chart specs in PRD §7.2.6: 12pt Satoshi Bold
titles, 10pt italic source lines, 9pt body, left-aligned first column, and
the 5-color series sequence (Electric → Deep → Horizon Lavender → Nexus
Indigo → Ion Aqua) in `components/brand/chart-theme.ts`.

### Roles

Four roles per PRD §5:

| Role | Sees | Can do |
|---|---|---|
| `builder` | Registry, My Projects, Wizard, own projects | Register, edit drafts, comment |
| `px_admin` | Everything | Triage, override classification, transition status, assign resources, fulfil provisioning, manage sponsors + departments, run Wrike imports |
| `sponsor` | Registry + Sign-off queue (own audience) | Comment, sign off |
| `read_only` | Registry, project detail | Read |

Role guards live in `lib/auth/session.ts`; `requireAdmin()` redirects
non-admins back to the registry.

---

## Open questions (PRD §11)

The PRD itself flags a number of items as needing Matthews to confirm. The
build picks defensible defaults so the app boots end-to-end; you'll want to
revisit these before cutover:

| # | Question | Default in this build |
|---|---|---|
| 1 | Sponsor directory | Five seeded sponsors (one per audience type), `*@matthews.test` |
| 2 | Wrike scope | Set `WRIKE_SYNC_FOLDER_ID` to the workspace/folder you want synced |
| 3 | Approved tooling list | Wizard requires acknowledgment; list itself is a placeholder |
| 4 | Real provisioning backend | Stub: writes a `ProvisioningRequest`, PX fills DB/endpoint URLs manually |
| 5 | Departments seed list | Marketing, Legal, Finance, Sales Operations, Underwriting, Operations, Platform Experience |
| 6 | Department-head read access | Implemented as yes (registry is signed-in-readable) |
| 7 | Kallisto font | Falls back to Satoshi Black (PRD-permitted) until Matthews provides WOFF2 |
| 8 | Logo assets | Text lockup + "M" favicon — replace `public/favicon.svg` and update `BrandLogo` once real assets are in CC Library |
| 9 | Imagery | Login screen uses no photography; add the Matthews Lightroom-filtered set when CC Library access is wired |
| 10 | Icon set | Lucide stroke-1.5 themed to Deep / Electric Blue |
| 11 | Admin background | Flat Deep Blue — no abstract asset (would require Alfonso Lomeli approval) |

---

## Phasing

The plan in [`/.cursor/plans`](./.cursor/plans/) maps each implementation step
to PRD §9 phases. All four phases are in v1.

---

Matthews™ confidential. Internal use only.
