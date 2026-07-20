# IAM Access Atlas — Claude Code Briefing

> This file is read automatically by Claude Code on session start. It captures the project's purpose, current state, decisions already made, and where to find the actionable roadmap. **Read `ROADMAP.md` next** for phase-by-phase tasks.

---

## 1. What this project is

**IAM Access Atlas** is a single-page static web application that gives Clover Health managers and staff a self-service way to look up application roles and access levels. It is the front-end reference site that supports the User Access Review (UAR) cycle and day-to-day access questions.

- **Owner:** Sanjay Sharma Josyula, Identity & Access Management, Clover Health
- **Primary use cases:**
  1. Managers verifying roles during UAR campaigns
  2. Staff looking up what their own role grants them
- **Hosting model:** Public site (Amazon Web Services), broadly shareable URL — no auth by design, so it works inside campaign emails and onboarding messages. Live at `https://documentation.cloverhealth.com/iamaccessatlas/`
- **Data source:** Manual export from ServiceNow CMDB Dashboard (`Applications.csv`, `Roles.csv`) → `build_from_csv.py` → embedded `data.js`
- **Refresh cadence:** Manual, run by Sanjay when CMDB role pages change

---

## 2. Architecture at a glance

```
IAM Access Atlas/
├── index.html              # 346 lines — landing hero, stats counters, mode picker, app view, modals
├── styles.css              # 1,657 lines — custom CSS, Open Sans, lavender/sage/off-white palette
├── app.js                  # 1,063 lines — vanilla JS, IIFE, no framework, no build step
├── data.js                 # ~9,500 lines, ~300 KB — generated; 167 apps; do not hand-edit
├── build_from_csv.py       # CSV → data.js generator (CURRENT generator)
├── README.md               # ⚠️ STALE — references a Confluence-based build_data.py that no longer exists
├── CLAUDE.md               # This file
└── ROADMAP.md              # Phase-by-phase production-readiness plan
```

**Stack philosophy:** Zero-build, zero-framework, zero-dependency static site. This is intentional — keeps the deploy story trivial (AWS static hosting), keeps maintenance burden near zero, and avoids supply-chain surface area. **Any new dependencies must be vendored into the repo, not pulled from a CDN at runtime.**

---

## 3. Personas & feature inventory

**Landing page**
- Hero section (full-viewport, fades on scroll)
- Animated stat counters: total apps, total roles, PHI-covered apps
- Stat cards are clickable → open drill-in modals
- Mode picker: Manager / Staff

**Manager view**
- App dropdown + role search
- Filter pills: All / Admin only / PHI-covered only
- Manager actions row: Print, Copy table (TSV to clipboard), Compare with another app, "What's changed" changelog modal
- UAR status strip (currently dormant — see §5)
- Announcements banner (currently empty in data)

**Staff view**
- App dropdown + role search
- Risk badge column (Standard / Sensitive / Elevated / High Risk — derived from `admin` + `covered`)
- Compare two roles panel
- PHI awareness alert (dismissible, session-scoped)

**Global**
- Floating "Request Access" FAB linking to the ServiceNow catalog item
- Footer with "Last updated" timestamp from `APP_DATA.generated`

---

## 4. Data shape

```js
const APP_DATA = {
  generated: "2026-05-08",        // ISO date string
  total: 167,
  applications: [
    {
      name: "1Password",
      draft: false,                // optional; renders DRAFT badge if true
      roles: [
        {
          role: "Administrator",
          description: "…",
          admin: true|false|null,   // null = unknown
          covered: true|false|null  // null = PHI status unknown; column hidden if all roles null
        }
      ]
    }
  ],
  announcements: [],               // {id, date, text, type: 'info'|'warning'}
  changelog: []                    // {date, appName, role, change, type: 'added'|'updated'|'removed'}
};
```

A separate `UAR_DATA` constant is referenced by `app.js` (`findUarReview`, `renderUarStatus`) but is **not defined anywhere yet**. The strip silently no-ops when undefined.

---

## 5. Known issues (catalogued, not yet fixed)

| # | Issue | Severity | Notes |
|---|---|---|---|
| 1 | `README.md` references a non-existent `build_data.py` (Confluence flow); actual script is `build_from_csv.py` | Medium | Confuses future maintainers |
| 2 | `UAR_DATA` referenced by `app.js` but never defined → UAR status strip is dead code | Medium | Decision: scaffold a stub file Sanjay can hand-edit per cycle (see ROADMAP §Phase 1) |
| 3 | No favicon, no Open Graph tags, no theme-color | Low | Hurts shareability and polish |
| 4 | Inline SVG icons duplicated across hero/nav (logo lock icon) | Low | Could be consolidated into `<symbol>` defs |
| 5 | Color contrast not audited; lavender accents (`#7C8EC8`, `#9AAED8`) on light backgrounds may be marginal vs WCAG 2.1 AA | Medium | Phase 2 |
| 6 | No focus trap in modals, no `Escape` global, no skip-to-content link, no `prefers-reduced-motion` handling | Medium | Phase 2 |
| 7 | Print stylesheet exists but is basic; not optimized for UAR reviewer hand-out | Low | Phase 2 |
| 8 | No analytics/insights view — currently nothing in the app helps the IAM team see catalog hygiene, risk distribution, or PHI coverage at a glance | Medium (opportunity) | Phase 3 |
| 9 | No deep-link routing — can't share `?app=Okta&mode=manager` | Low | Phase 4 |
| 10 | No tests, no linter, no CI | Low | Acceptable for a 1K-line vanilla JS static site — defer unless team grows |

---

## 6. Decisions already made (do not re-litigate)

- **Hosting model:** Public, broadly shareable. Not behind Okta SSO. This is a conscious trade-off (usability inside campaign emails > exposing the application catalog).
- **Data refresh:** Stay manual (CSV → script → push). No GitHub Action / scheduled automation in scope right now.
- **Charting library:** **Vendored Chart.js** in the repo. No CDN, no build step. Download once, commit, reference locally.
- **UAR data:** Add a stub `uar_data.js` file Sanjay can hand-edit per cycle. Activates the existing visual immediately; no Jira API integration in scope yet.
- **Scope:** Execute **all four phases** of the roadmap (see `ROADMAP.md`).
- **No framework, no build step.** Vanilla JS only. If JS file grows past ~1,500 lines, consider splitting into modules via native ESM `<script type="module">` — still no bundler.

---

## 7. Coding conventions observed in the codebase

- Single IIFE wrapping all app logic (`(function () { 'use strict'; … })();`)
- DOM refs cached at top of IIFE
- All event listeners attached in `init()` after `DOMContentLoaded`
- BEM-ish CSS class naming (`.modal-app-item`, `.compare-card-title`)
- Section dividers in CSS use a consistent comment style: `/* ── Section name ────── */`
- 2-space indentation throughout
- Semantic ARIA attributes already present in places (`role="button"`, `aria-label`, `aria-modal`) — extend, don't replace
- Pastel palette: lavender `#7C8EC8` / `#9AAED8`, dark `#12121A`, off-white `#F7F5F2`, sage `#D5E8D0`, rose `#F5DADA`, amber `#FBE8C3`

**Follow these conventions in any new code.** Do not introduce a framework, a CSS preprocessor, or a bundler.

---

## 8. Where to find things

- **Production-readiness roadmap:** `ROADMAP.md` in this folder (read this next)
- **Data refresh procedure:** `build_from_csv.py --help` (and section in roadmap about README rewrite)
- **ServiceNow source:** CMDB Dashboard → Applications + Roles tables → CSV export to `~/Downloads/`
- **Helpdesk request link (already in FAB):** `https://helpdesk.cloverhealth.com/esc?id=sc_cat_item&sys_id=1b2608399798b21003efff7c1253aff0`

---

## 9. What to do first when you (Claude Code) open this folder

1. Read this file and `ROADMAP.md`
2. Confirm scope with Sanjay before writing code (he prefers clarifying questions when ambiguous — see his user preferences)
3. Start with **Phase 1** unless he directs otherwise
4. Maintain a task list as you go
5. Verify acceptance criteria after each phase (cross-browser smoke, no console errors, no broken links)

Sanjay's working style: professional/corporate tone, structured output, headings/tables/bullets where useful, separate facts/assumptions/recommendations, no fluff. He values strategic framing alongside execution.
