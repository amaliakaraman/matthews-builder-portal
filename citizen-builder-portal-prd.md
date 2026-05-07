# Citizen Builder Portal — Product Requirements Document

**Version:** 1.1
**Status:** Draft for build
**Owner:** Platform Experience (Matthews CRE)
**Target build environment:** Cursor (Next.js + TypeScript recommended)
**Source documents:** Responsibility Model (Internal v1.0), App Classification Reference, Matthews Visual Identity Guidelines v1.0 (Feb 2026)

---

## 1. Overview

### 1.1 What this is

The Citizen Builder Portal is the operational system that powers Matthews CRE's Citizen Builder Program. It turns two policy documents — the **Responsibility Model** and the **App Classification Reference** — into a working registry, intake flow, and PMO tracking surface.

Today, project tracking for these efforts lives in Wrike. This portal will pull from Wrike during a transition phase, then replace Wrike as the primary source of truth for citizen-built apps at Matthews.

### 1.2 Why it exists

Matthews CRE operates as a single product organization. Every department is a product area, and every internal app belongs somewhere in that product. Without a central registry and a disciplined intake process, four failure modes emerge:

1. **Effort overlap** — multiple teams build the same thing
2. **Ownership ambiguity** — no one is accountable long-term
3. **Data & IP exposure** — undisciplined building creates security risk
4. **Engineering overhead** — uncoordinated platform involvement consumes engineering capacity

The portal prevents all four by forcing every new build through a classification flow, recording the result in a browsable registry, and routing each project to the correct level of Platform Experience (PX) and engineering involvement.

### 1.3 Who uses it

Two primary audiences, each with distinct needs:

**Builders** (citizen developers across all departments)
- Register new projects
- Walk through the classification wizard
- Track their project's status, milestones, and approvals
- Browse the registry to check for overlap before starting

**Platform Experience team** (admins)
- Triage incoming registrations
- Provide coaching for Consumer-tier projects
- Coordinate engineering alignment for Contributor-tier projects
- Manage the registry, override classifications when needed, and report on portfolio health

A secondary audience — **Executive Sponsors and department heads** — needs read access to the registry and approval surfaces for projects under their jurisdiction.

---

## 2. Core concepts

These concepts come directly from the source policy documents and must be modeled faithfully in the data layer.

### 2.1 The three dimensions

Every registered project resolves three independent dimensions:

| Dimension | Question | Determines |
|---|---|---|
| **App Classification** | How is it built, and what process does it follow? | Tier (Personal / Consumer / Contributor), tooling requirements, PX involvement level |
| **Product Owner** | What does it do, and which department owns that job? | Which department controls the roadmap and has final call on sequencing |
| **Executive Sponsor** | Who uses it, and who approves its deployment? | Who signs off on deployments within their audience's jurisdiction |

These dimensions are independent. A single project always has all three, and they often point to different departments — that is by design, not a conflict.

### 2.2 The three tiers (App Classification)

| Tier | Audience | Data behavior | PX involvement |
|---|---|---|---|
| **Tier 1: Personal Project** | Personal use only | None required | None — fully self-serve |
| **Tier 2: Platform Consumer** | Department use | Pulls from platform; new data lives in app-owned DB | Early direction + coaching, then self-directed |
| **Tier 3: Platform Contributor** | Cross-department use | Edits or pushes back to existing Artemis fields | Involved from start; engineering alignment required before build |

**Tier 3 requires both conditions:** writes back to Artemis fields AND creates cross-department value. If only one is true, it is not a Contributor app.

**Edge cases the wizard must handle:**
- Write-back to Artemis fields → forces Contributor classification *regardless of audience scope*
- Requires *new schema* added to the platform → not a Contributor app at all; this is platform feature work that must be scoped and shipped by the platform team before any dependent Consumer app can be built. Route to a "platform feature request" path.
- Builder is unsure → route to PX for manual classification

### 2.3 Product Owner options

The owning department is determined by the *primary job* the product performs, not by who built it. A marketing tool built by an agent is still owned by Marketing.

Initial seed list (extensible by PX admins):
- Marketing — external brand and deal collateral
- Legal — contracts, documents, legal agreements
- Finance — performance data, reporting, metrics
- Other departments by their core jobs

### 2.4 Executive Sponsor options

The Executive Sponsor represents the key audience and holds deployment sign-off authority for projects directed at that audience.

Audience types (per the Responsibility Model):
- Agents
- Market Leaders
- Financiers & Accountants
- Marketers
- Sales Operations Facilitators

**Implementation note:** Each audience type maps to a named Executive Sponsor person, maintained in a `sponsors` table managed by PX admins. The wizard asks the builder to identify the audience; the system resolves the named sponsor.

### 2.5 Project lifecycle states

```
Draft → Submitted → Under PX Review → Approved → In Build → MVP Ready → In Test → PX Sign-Off → Deployed → Active
                                   ↘ Needs Revision ↗
                                   ↘ Rejected (terminal)
                                   ↘ Archived (terminal)
```

Tier-specific variations:
- **Personal Projects** skip PX review entirely; they go Draft → Acknowledged → Active.
- **Consumer apps** require PX review before broad rollout (after MVP + test audience).
- **Contributor apps** add an "Engineering Alignment" gate between Submitted and Approved.

---

## 3. User stories

### 3.1 Builder stories

- As a builder, I want to search the registry before I start so I don't duplicate an existing effort.
- As a builder, I want a guided wizard that tells me which tier I'm in and what's required of me, so I don't have to interpret policy docs.
- As a builder, I want to register my project and have a database + endpoint provisioned automatically (Consumer tier) so I can start building immediately.
- As a builder, I want to see the status of my project's review, milestones, and approvals in one place.
- As a builder, I want to be told *upfront* if my use case requires platform feature work, so I don't waste time scoping a build that can't happen yet.

### 3.2 PX admin stories

- As a PX admin, I want a triage queue of new registrations sorted by tier and submission date.
- As a PX admin, I want to override a builder's self-classification when I disagree, with a recorded reason.
- As a PX admin, I want to assign coaching sessions, PMs, and design resources to Contributor projects.
- As a PX admin, I want a portfolio dashboard showing active projects by tier, owner, sponsor, and status.
- As a PX admin, I want to import existing project records from Wrike during the transition.

### 3.3 Sponsor / department head stories

- As a Product Owner department head, I want to see every project owned by my department, regardless of who built it.
- As an Executive Sponsor, I want a sign-off queue showing projects awaiting my deployment approval for my audience.

---

## 4. Feature scope (v1)

### 4.1 Builder-facing surfaces

#### 4.1.1 Registry (browse / search)
A public-to-Matthews catalog of every registered project. Filterable by tier, Product Owner, Executive Sponsor, status, and free-text search. Each row links to a project detail page showing all three dimensions, current status, builder, and milestone history.

#### 4.1.2 Classification wizard (intake flow)
A multi-step form that resolves all three dimensions in order:

**Step 1 — App Classification (the tier wizard)**
A series of guiding questions matching the App Classification Reference table:

*Audience questions:*
- Is this for your own use only — not intended for teammates or department deployment?
- Will this be used by people in your department?
- Will the value this creates serve people outside your department?

*Data questions:*
- Does your use case only require reading data from the platform?
- Does your use case require storing new data?
- Does your use case require editing or pushing back to existing Artemis data fields?
- Does your use case require new schema added to the platform?

*Process questions:*
- Are you prepared to use approved Matthews tools, accounts, and brand standards?
- Are you prepared to ship an MVP to a test audience before broad rollout?
- Are you prepared to work within platform engineering's timeline?

The wizard computes the tier from the answers using the rules in §2.2. Edge cases (Artemis write-back → Contributor; new schema → platform feature work) are surfaced with explanatory copy at the moment they're triggered, not at the end.

**Step 2 — Product Owner**
Single question: "What is the primary job this product performs?" Builder selects from the seeded department list. A help tooltip explains that ownership follows function, not the builder, and that PX may reassign if the answer doesn't match the dominant job.

**Step 3 — Executive Sponsor**
Single question: "Who are the primary people interfacing with this product?" Builder selects from audience types. The system resolves the named sponsor and displays who that is for confirmation.

**Step 4 — Project metadata**
Name, description, intended start date, problem statement, expected users, links to existing scoping docs.

**Step 5 — Review & submit**
Summary screen showing all three resolved dimensions, tier-specific requirements (e.g., "You'll need to use approved tooling and ship an MVP to a test audience"), and an explicit acknowledgment checkbox before submission.

#### 4.1.3 My Projects
A view of all projects the current builder owns or contributes to, with status, next required action, and links to detail pages.

#### 4.1.4 Project detail page
For any registered project: all three dimensions, status, milestone timeline, builder, assigned PX coach (if any), assigned PM/design (if Contributor), database/endpoint info (if Consumer), comment thread, and approval log.

### 4.2 PX admin surfaces

#### 4.2.1 Triage queue
List of newly submitted registrations awaiting review, sorted by tier and submission date. Bulk actions: approve, request revision, reject, reassign tier.

#### 4.2.2 Portfolio dashboard
Aggregate view of all registered projects with breakdowns by tier, Product Owner, Executive Sponsor, and status. Filters and CSV export. Highlights overdue reviews and stalled projects.

#### 4.2.3 Classification override
On any project, PX admins can change the Tier, Product Owner, or Executive Sponsor. Every change is logged with author, timestamp, and required reason field. The builder is notified.

#### 4.2.4 Resource assignment
For Contributor projects: assign PM, design resource, and engineering coordinator. For Consumer projects: assign PX coach.

#### 4.2.5 Sponsors & departments admin
CRUD for the Product Owner department list and the Executive Sponsor directory (audience type → named person).

#### 4.2.6 Wrike sync
- Manual import: paste a Wrike folder/project ID; portal pulls metadata and creates portal records flagged "imported, needs classification."
- Scheduled sync (optional v1): periodic pull of changes from a designated Wrike workspace.
- Fields imported: project name, description, status, owner, dates, links. Classification dimensions are *not* imported; they must be resolved via the wizard or by PX admin.

### 4.3 System behavior

#### 4.3.1 Auto-provisioning (Consumer tier only)
On approval of a Consumer-tier registration, the system provisions a dedicated database and endpoint (per the App Classification Reference: "Registration provisions a dedicated database and endpoint automatically"). For v1, this can be a stub that records the provisioning request and surfaces credentials placeholder fields for PX admins to fill in manually if real provisioning isn't wired yet. The UX should not require the real backend to exist on day one.

#### 4.3.2 Notifications
Email + in-app for: submission received, classification approved/changed, MVP review requested, sponsor sign-off requested, milestone updates.

#### 4.3.3 Audit log
Every classification change, status change, approval, and override is logged immutably with actor, timestamp, before/after values, and reason.

---

## 5. Out of scope (v1)

- Real-time database/endpoint provisioning (stub only — see §4.3.1)
- Two-way Wrike sync (read-only import only)
- SSO integration (use email/password or basic auth for v1; SSO is a fast-follow)
- Mobile-native apps (responsive web is sufficient)
- Public/external-facing views — this is internal-only
- Automated classification via LLM — wizard is rule-based deterministic logic
- Granular role-based permissions beyond Builder / PX Admin / Sponsor / Read-only

---

## 6. Data model

### 6.1 Core entities

```
Project
  id                      uuid (pk)
  name                    text
  description             text
  problem_statement       text
  builder_user_id         uuid (fk → User)
  tier                    enum [personal, consumer, contributor]
  product_owner_dept_id   uuid (fk → Department, nullable for Personal)
  audience_type           enum [agents, market_leaders, financiers, marketers, sales_ops]
  executive_sponsor_id    uuid (fk → Sponsor, nullable for Personal)
  status                  enum (see lifecycle in §2.5)
  intake_answers          jsonb (raw answers from wizard for audit)
  database_url            text (nullable, populated on Consumer approval)
  endpoint_url            text (nullable, populated on Consumer approval)
  wrike_id                text (nullable, set if imported from Wrike)
  created_at              timestamp
  updated_at              timestamp

User
  id                      uuid (pk)
  email                   text (unique)
  name                    text
  role                    enum [builder, px_admin, sponsor, read_only]
  department_id           uuid (fk → Department, nullable)

Department
  id                      uuid (pk)
  name                    text
  core_jobs_description   text
  is_active               boolean

Sponsor
  id                      uuid (pk)
  user_id                 uuid (fk → User)
  audience_type           enum [agents, market_leaders, financiers, marketers, sales_ops]
  is_active               boolean

Milestone
  id                      uuid (pk)
  project_id              uuid (fk → Project)
  type                    enum [submitted, px_review, eng_alignment, approved,
                                mvp_ready, test_started, px_signoff, deployed]
  completed_at            timestamp (nullable)
  notes                   text

Assignment
  id                      uuid (pk)
  project_id              uuid (fk → Project)
  user_id                 uuid (fk → User)
  role                    enum [px_coach, pm, design, eng_coordinator]
  assigned_at             timestamp

AuditLogEntry
  id                      uuid (pk)
  project_id              uuid (fk → Project)
  actor_user_id           uuid (fk → User)
  action                  text (e.g., "tier_changed", "status_changed", "sponsor_overridden")
  before                  jsonb
  after                   jsonb
  reason                  text (required for overrides)
  created_at              timestamp

Comment
  id                      uuid (pk)
  project_id              uuid (fk → Project)
  author_user_id          uuid (fk → User)
  body                    text
  created_at              timestamp
```

### 6.2 Classification rules (deterministic)

Implement as a pure function `classify(answers) → { tier, edge_case }`:

```
INPUT: answers = {
  personal_only: boolean,
  department_use: boolean,
  cross_department: boolean,
  read_only: boolean,
  store_new_data: boolean,
  edit_artemis: boolean,
  new_schema: boolean,
  approved_tooling_ok: boolean,
  mvp_test_ok: boolean,
  eng_timeline_ok: boolean,
}

LOGIC (evaluate in order, first match wins):

1. IF answers.new_schema → return { tier: null, edge_case: "PLATFORM_FEATURE_WORK" }
   // This is platform team work, not a citizen build. Route to feature request.

2. IF answers.edit_artemis → return { tier: "contributor", edge_case: null }
   // Write-back to Artemis is always Contributor regardless of scope.

3. IF answers.cross_department AND answers.edit_artemis → { tier: "contributor" }
   // (Already covered by rule 2, but keep explicit for clarity.)

4. IF answers.personal_only AND NOT answers.department_use AND NOT answers.cross_department
   → return { tier: "personal", edge_case: null }

5. IF answers.department_use AND NOT answers.cross_department AND NOT answers.edit_artemis
   → return { tier: "consumer", edge_case: null }

6. ELSE → return { tier: null, edge_case: "UNCLEAR_ROUTE_TO_PX" }
```

The wizard surfaces edge cases (PLATFORM_FEATURE_WORK, UNCLEAR_ROUTE_TO_PX) immediately on the question that triggered them, with explanatory copy and a clear next action.

### 6.3 Provisioning hook (Consumer approval)

On `Project.status` transition to `Approved` for a Consumer-tier project, fire a `provisionConsumerApp(project_id)` job. v1 implementation: write a row to a `provisioning_requests` table and email PX admins; they fill in `database_url` and `endpoint_url` manually. The interface must support swapping in real provisioning later without UI changes.

---

## 7. UX & design system

### 7.1 Tone

Professional, direct, internal-tool sober. Matches the policy docs' voice — declarative, numbered sections, no marketing fluff. The portal should feel **confident, tech-forward, and uncluttered** (the same descriptors Matthews uses for its brand backgrounds).

### 7.2 Brand foundation

The portal must conform to **Matthews™ Visual Identity Guidelines v1.0 (Feb 2026)**. The conventions below are pulled directly from that document. Do not deviate without Creative Director approval.

#### 7.2.1 Color tokens

Set up the design system in RGB. Define these as CSS custom properties / Tailwind theme tokens:

**Primary (foundational — most prominent)**
```
--matthews-deep-blue:    #0e1a34    /* primary background */
--matthews-deepest-blue: #0f111b    /* contrast on Deep Blue, institutional */
```

**Secondary (energy + accents — 20–30% of any surface)**
```
--electric-blue-dark-bg:  #4e8eff    /* CTAs, buttons, links on dark backgrounds */
--electric-blue-light-bg: #2b77fc    /* CTAs, buttons, links on light backgrounds */
--platinum-grey:          #f3f3f4    /* neutral, breathing room, text panels */
```

**Tertiary (specialty — data viz, layered storytelling, <5% of any surface)**
```
--nexus-indigo:     #3b2997
--ion-aqua:         #4ec4cf
--horizon-lavender: #a5a0ff
```

**Proportion rules (must be respected in layout decisions):**
- Deep Blues prominent for core brand surfaces; white balances backgrounds where appropriate.
- Secondary colors at 20–30% to guide the eye and add vibrancy.
- Tertiary colors capped at <5% per design board to prevent brand dilution. Reserve them for data visualization and differentiation moments.

**Default background:** Matthews Deep Blue (`#0e1a34`). Light surfaces use white or Platinum Grey for breathing room.

#### 7.2.2 Typography

**Primary — Satoshi (~90% of all communication, the "workhorse")**
- Use for body, UI labels, navigation, table data, form fields, the wizard.
- **Never set in all caps.** Use Title Case or Sentence Case.
- Body: 12pt / 16pt leading, tracking 0.

**Secondary — Kallisto (~10%, the "brand voice amplifier")**
- Use only for hero/impact statements (H1, occasional H2 in sentence case).
- **Only Heavy weight.** No other Kallisto weights.
- Reserve for moments needing boldness or personality — landing screens, empty states with character, section headers on the dashboard.

**Heading scale (skip a level for contrast — H1 + H3, H2 + H4):**
- H1 — Kallisto Heavy or Satoshi Black, hero only
- H2 — Satoshi Bold, page titles
- H3 — Satoshi Bold or Kallisto Heavy (sentence case OK)
- H4 — Satoshi Medium, sub-sections
- H6 — Satoshi Regular small caps for eyebrows/labels

**Paragraphs:** never span the full page width — use columns or constrained max-width for readability.

**Font sourcing for Cursor build:**
- Satoshi: available via Fontshare (`https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`).
- Kallisto: licensed font — Matthews must provide WOFF2 files for self-hosting. **Open question for §11.**

#### 7.2.3 Logo usage

- Use **Matthews Blue logo** on light backgrounds, **Matthews White logo** on dark backgrounds (Deep Blue / Deepest Blue).
- Always include the ™ mark.
- Minimum clear space around the logo = the height/width of the "M".
- Favicon: the standalone "M" mark (per spec, favicon is approved for website favicon use).
- **Never** change colors, warp, add letters, outline, tilt, or place without the trademark or adequate negative space.

#### 7.2.4 Iconography

- Use icons **sparingly and functionally** — never decorative. The visual identity guidelines explicitly restrict icon use to approved cases.
- For an internal portal UI, icons are functional necessities (status indicators, action buttons, filters) — this falls within "serving clarity, not decoration."
- Pull from the Matthews Iconography set (CC Library, "Iconography"). For v1, if those aren't available as web assets, use a minimal-weight icon library (e.g. **Lucide** at stroke-width 1.5) and theme strokes to Matthews Deep Blue or Electric Blue depending on background.

#### 7.2.5 Design support elements

**Vertical H1 support line** (signature Matthews device — see the blue bar at the top-left of every section title in their guidelines):
- 2pt line, Electric Blue.
- Distance from line to title = height of 2 text lines.
- Space above and below the title = 25% of title height.
- **Use this device** at the top of every major page heading in the portal — it's a high-recognition brand cue.

**Horizontal lines:** 2pt Electric Blue, used to separate sections.

**Rectangle containers** (for tags, status chips, property/project identifiers):
- Rounded corners: 0.0625 in (≈ 1px at 16px base — implement as `border-radius: 4px`).
- Add slightly more inset spacing on top than bottom.
- Variants: solid Electric Blue with white text, outlined Electric Blue with Electric Blue text, solid Deep Blue with white text.

#### 7.2.6 Data visualization (registry charts, portfolio dashboard)

Per the visual identity Data Visualization spec:

**Charts (bars and lines)**
- Title: Satoshi Bold, 12pt, 16pt leading, color Deep Blue (`#0e1a34`).
- Source/caption: Helvetica Italic 10pt, 60% black (`#808285`).
- Axis labels: Helvetica Regular 8pt, Deep Blue.
- Axis numbers: Helvetica Regular 8pt, 80% black.
- X-axis baseline: 1pt, Deep Blue.
- Vertical period dividers: 50% black.

**Color sequence for series (use in this order, do not skip):**
1. Electric Blue — `#2b77fc` on light backgrounds, `#4e8eff` on dark
2. Deep Blue — `#0e1a34`
3. Horizon Lavender — `#a5a0ff`
4. Nexus Indigo — `#3b2997`
5. Ion Aqua — `#4ec4cf`

**Line charts:** 1pt thickness, default Deep Blue; additional series follow the sequence above.

**Tables (registry, portfolio, triage queue)**
- Table title: Satoshi Bold 12pt / 16pt leading, Deep Blue.
- Source line: Satoshi Italic 10pt, 60% black, with 0.125 in gap before header row.
- Column titles: Satoshi Regular 10pt / 12pt leading, Deep Blue. **Left column left-aligned; all other columns center-aligned.**
- Data: Satoshi Regular 9pt / auto leading, 100% black.
- Numbered list column (when shown): Satoshi Regular 9pt, right-aligned.
- Header row variants for emphasis: Electric Blue (white text) or Deep Blue (white text). Default is no fill.

#### 7.2.7 Imagery

The portal is a tool, not marketing collateral — imagery use will be minimal (empty states, login screen, possibly the dashboard hero). When imagery is used:
- Real, authentic Matthews photography only — no generic stock.
- Architecture/office shots favor bold angles, strong contrast, negative space.
- Apply the Matthews Lightroom filter (linked in CC Library).
- **Avoid** posed group shots, handshakes, or cluttered compositions.

### 7.3 Surface-specific UX

**Wizard UX:**
- One question per screen on mobile, grouped by step on desktop.
- Progress indicator across the top using Electric Blue fill / Platinum Grey track.
- Always-visible "Save draft and exit."
- Edge cases (Artemis write-back, new schema requirement) interrupt the flow with a full-screen explanatory panel — Deep Blue background, white Kallisto Heavy headline, Satoshi body — explaining what to do next, rather than a buried error.
- Vertical H1 support line on every step title.

**Registry UX:**
- Default to dense table view (per §7.2.6 table spec). Card view toggle for browsing.
- Filters in a top-of-table row: tier (chip group), Product Owner (dropdown), Executive Sponsor (dropdown), status (chip group), free-text search.
- Every row is a deep link to the project detail page.
- Empty state: Kallisto headline ("Nothing here yet."), Satoshi explanatory copy, Electric Blue CTA button.

**Project detail UX:**
- Three-column layout on desktop — left: dimension summary card (Deep Blue background, white text, vertical support line on the project name); center: timeline/status/comments (white surface); right: assigned people + resources (Platinum Grey panel).
- Single-column stacked on mobile.
- Status chips use the rectangle container spec (§7.2.5).

**Admin (PX) surfaces:**
- Default to dark mode (Deep Blue base) — these are institutional, internal-facing tools that match the "corporate and institutional materials" use case in the brand guidelines.
- Triage queue uses the table spec with Electric Blue header variant.
- Portfolio dashboard charts follow the data viz spec strictly.

**Empty states:** every list view explains what the list is for and links to the relevant action (e.g., empty registry → "No projects registered yet. Start a registration →" with an Electric Blue CTA).

### 7.4 Implementation notes for Cursor

When scaffolding the design system in code:

```ts
// tailwind.config.ts — extend with Matthews tokens
theme: {
  extend: {
    colors: {
      'matthews-deep': '#0e1a34',
      'matthews-deepest': '#0f111b',
      'electric-dark': '#4e8eff',
      'electric-light': '#2b77fc',
      'platinum': '#f3f3f4',
      'nexus-indigo': '#3b2997',
      'ion-aqua': '#4ec4cf',
      'horizon-lavender': '#a5a0ff',
    },
    fontFamily: {
      sans: ['Satoshi', 'system-ui', 'sans-serif'],
      display: ['Kallisto', 'Satoshi', 'sans-serif'],
    },
    borderRadius: {
      'matthews': '4px', // 0.0625in equivalent
    },
  }
}
```

Build a `<SectionHeading>` component that always renders the vertical support line + title pairing — this is the most reused brand device and should be a single primitive.

---

## 8. Technical recommendations (Cursor-friendly stack)

These are recommendations, not mandates. Adjust to fit Matthews' existing stack.

- **Framework:** Next.js (App Router) + TypeScript
- **UI:** Tailwind + shadcn/ui
- **Database:** Postgres (Supabase or Neon for fast scaffolding)
- **ORM:** Prisma or Drizzle
- **Auth:** NextAuth (email magic link for v1; swap to SSO later)
- **Email:** Resend or Postmark
- **File structure:**
  ```
  /app
    /(builder)        # builder-facing routes
      /registry
      /register       # the wizard
      /projects/[id]
      /my-projects
    /(admin)          # PX admin routes, gated by role
      /triage
      /portfolio
      /sponsors
      /departments
      /wrike-import
    /api              # route handlers
  /lib
    /classification   # the pure classify() function + tests
    /db               # prisma/drizzle client
    /auth
    /wrike            # wrike API client
  /components
    /wizard
    /registry
    /project
    /admin
  ```

---

## 9. Build phasing (suggested)

**Phase 1 — Core registry + wizard (MVP)**
- Auth (basic email/password)
- Data model migrations
- Classification wizard end-to-end (all three dimensions)
- Project create / detail / list (registry)
- My Projects view
- Hardcoded sponsor + department seed data

**Phase 2 — PX admin tools**
- Triage queue
- Classification override with audit log
- Sponsor + department CRUD
- Resource assignment
- Notifications (email)

**Phase 3 — Wrike + PMO depth**
- Wrike manual import
- Portfolio dashboard
- CSV export
- Status transition workflows + milestone tracking
- Audit log UI

**Phase 4 — Polish + cutover**
- Real provisioning hook (replace stub)
- SSO
- Scheduled Wrike sync (if still needed)
- Decommission Wrike for Citizen Builder tracking

---

## 10. Success criteria

- 100% of new citizen builds at Matthews are registered through the portal within 90 days of launch.
- Average time from registration to PX classification decision < 3 business days.
- Zero net-new projects logged in Wrike for Citizen Builder work after Phase 4.
- PX admins report (via survey) that the portal reduces time spent on classification triage versus the prior process.
- Builders report (via survey) that they can self-classify confidently without contacting PX in the majority of cases.

---

## 11. Open questions (resolve before / during build)

1. **Sponsor directory:** confirm the named individuals for each of the five audience types, or confirm the model is "audience type → role group" (multiple sponsors per audience).
2. **Wrike scope:** which Wrike workspace(s) are in scope for import? Is there a tag, folder, or project type that identifies Citizen Builder work today?
3. **Approved tooling list:** the wizard asks "Are you prepared to use approved Matthews tools, accounts, and brand standards?" — should the portal *display* the list, or just confirm the builder accepts the requirement?
4. **Real provisioning backend:** what does "provisions a dedicated database and endpoint automatically" actually mean in Matthews' infrastructure? Confirm before Phase 4.
5. **Departments seed list:** Marketing, Legal, and Finance are named explicitly in the policy docs ("+ other departments by their core jobs"). What's the full initial list?
6. **Permission model:** does a department head get auto-read-access to every project where their department is the Product Owner? Recommended yes — confirm.
7. **Kallisto font files:** Kallisto is a licensed font and must be self-hosted. Matthews needs to provide WOFF2 / WOFF / TTF files for the build, plus confirmation of the license terms (web embedding scope, domains).
8. **Logo assets:** confirm where to pull the Matthews Blue logo, Matthews White logo, and "M" favicon from for the build (CC Library is referenced in the visual identity guidelines but isn't accessible from a code repo).
9. **Lightroom filter / image library access:** if the login screen or dashboard hero will use real Matthews photography, confirm the source (Box library is referenced in the visual identity guidelines).
10. **Icon set:** confirm whether Matthews-approved iconography is available as SVGs/web font, or whether Lucide (with Matthews color theming) is acceptable as a v1 substitute.
11. **Background asset for institutional surfaces:** the brand guidelines reference abstract Deep Blue backgrounds in CC Library. For the admin/PX dark-mode surfaces, do we use a flat Deep Blue, or pull one of the approved abstract backgrounds? Note: per the guidelines, new background usage requires Alfonso Lomeli approval.
