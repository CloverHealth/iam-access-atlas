# IAM Access Atlas — Clover Health IAM

A publicly accessible reference site for Clover Health application roles. Used during User Access Review (UAR) campaigns and for day-to-day "what does my role grant me?" questions.

- **Managers** look up every role, its description, admin flag, and PHI coverage for any application.
- **Staff** search for their own role to confirm their access level.

The site is a zero-build, zero-framework, vanilla-JS static page. Open `index.html` in any browser — no dev server required.

---

## Reviewer's Quick-Start (3 steps)

1. Open the shared URL (or `index.html` locally).
2. Pick **Manager** or **Staff** mode, then choose the application from the dropdown.
3. Use the filter pills (All / Admin only / PHI-covered only) and the search box to narrow the role list. Use **Print** or **Copy table** in Manager view to attach evidence to a UAR ticket.

---

## Shareable URL

```
https://documentation.cloverhealth.com/iamaccessatlas/
```

The site is hosted in Amazon Web Services (AWS).

---

## File map

| File | Purpose |
|---|---|
| `index.html` | Main page (entry point) |
| `styles.css` | Stylesheet — custom CSS, no preprocessor |
| `app.js` | All client-side logic — single IIFE, vanilla JS |
| `data.js` | Generated role data — **do not hand-edit** |
| `uar_data.js` | UAR cycle status — hand-edited per cycle (see below) |
| `build_from_csv.py` | Script that regenerates `data.js` from CSV exports |
| `CLAUDE.md` | Project briefing for Claude Code sessions |
| `ROADMAP.md` | Phase-by-phase production-readiness plan |

---

## Refreshing the role data

The site's data comes from the ServiceNow CMDB Dashboard — manually exported, then run through a local Python script. There is no scheduled job; refresh on demand when application or role records change.

### One-time setup

Python 3.8+ with no third-party dependencies (uses only the standard library).

### Each refresh

1. In ServiceNow, open the **CMDB Dashboard** and export both:
   - `Applications.csv`
   - `Roles.csv`

   Save both to `~/Downloads/` (the default path the script looks for).

2. From this directory, run:

   ```bash
   python build_from_csv.py
   ```

   Optional flags:

   ```bash
   python build_from_csv.py \
     --apps   ~/Downloads/Applications.csv \
     --roles  ~/Downloads/Roles.csv \
     --output ./data.js
   ```

   The script prints the counts of apps and roles written, and warns about any apps with no roles.

3. Commit and push the regenerated `data.js`.

---

## Refreshing the UAR status strip

The yellow strip at the top of the app view (showing "current UAR cycle in progress / due date / reviewer") is driven by `uar_data.js`. This file is **hand-edited each cycle**, not generated.

Open `uar_data.js`, update the `cycle`, `generated` date, and the `reviews` array, then commit. The strip auto-renders on next page load and is silently hidden when there is no matching review for the selected app.

---

## Hosting

The site is hosted in **Amazon Web Services (AWS)** at:

```
https://documentation.cloverhealth.com/iamaccessatlas/
```

Share that URL in UAR campaign emails and onboarding messages.

---

## Local preview

Open `index.html` directly in any browser — no server required. All assets are local; nothing is loaded from a CDN at runtime.

---

## Where to file bugs and suggestions

- **Data inaccuracies** (wrong role, missing app, bad admin/PHI flag): fix the source record in ServiceNow CMDB, then re-run `build_from_csv.py`. The site is a mirror — never patch `data.js` by hand.
- **Site bugs / feature requests**: message Sanjay Sharma Josyula (sanjaysharma.josyula@cloverhealth.com) directly, or post in `#iam-team` on Slack.
- **UAR-specific questions**: see the current Confluence runbook for the UAR cycle, or ask the IAM team.

---

## Security notes

- The GitHub repo is **private** — source and data are not publicly browsable.
- Data is embedded in `data.js` (not a raw `.json` endpoint).
- The site itself is intentionally public — no authentication, designed to be shared broadly inside campaign emails.
- `<meta name="robots" content="noindex">` prevents search-engine indexing.
- Role data reflects ServiceNow CMDB as of the `Generated` date shown in the site footer.
