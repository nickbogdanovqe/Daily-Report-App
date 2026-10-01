# Daily Report App

A free, browser-only daily status report tool for **Aurora Mobile** mobile QA. Compose tasks, blockers, highlights, and defects; preview the report; copy plain text for Outlook. Your draft auto-saves in `localStorage` — no database, no accounts.

## Features

- Structured sections: summary, scope, key highlights, optional test summary tables, defects
- **Key Highlights in Markdown**: bullets, nested bullets, numbered lists, bold, italic, links; Jira keys auto-link
- **Defects from Jira**: one command exports Aurora Mobile defects for a release, one click imports them with Production grouped first
- Drag-and-drop reorder for all lists
- Rich live preview with color-coded status, KPI cards, and defect table
- One-click copy as **formatted HTML** for Outlook (colors & tables preserved)
- Plain-text fallback if rich copy is unavailable
- Single auto-saved draft per browser
- **Previous day**: when you open the app on a new day, yesterday’s report is saved for reference and its content is copied into today’s draft so you can update it

## Key Highlights syntax

The highlights box accepts a small Markdown subset. The toolbar inserts the markers for you; `Tab` / `Shift+Tab` indent and outdent, `Enter` continues a list, and `Cmd/Ctrl+B` / `Cmd/Ctrl+I` toggle bold / italic.

```markdown
- **Smoke** passed on build 1.4.2 (iOS + Android)
  - DIGENG-32482 verified in Production
  - _Pending_: Bill Pay payee load
1. Regression: 120 / 180 executed
2. Automation run green, see [dashboard](https://example.com/run/42)
```

Jira keys such as `DIGENG-123` turn into links when the **JIRA base URL** is set in report details.

## Defects from Jira

Defects are pulled with the [`twg` CLI](https://developer.atlassian.com/cloud/twg-cli/getting-started/installation/), which is already authenticated on your machine, so no API tokens live in this repo or on Vercel.

```bash
npm run sync:jira                               # Aurora Mobile bugs on "Aurora Gatlinburg"
npm run sync:jira -- --release "Aurora Hoover"  # another fixVersion
npm run sync:jira -- --open-only                # skip Done / Cancelled
npm run sync:jira -- --jql '<custom JQL>'       # full override
```

The script writes `jira-defects.json` (gitignored), copies it to the clipboard on macOS, and prints a summary. In the app open **Defects -> Import from Jira**, paste the JSON or choose the file, then pick:

- **Merge (keep my notes)** (default): refreshes title / status / priority on matching Jira IDs, keeps the notes you typed, adds new defects, removes Jira-sourced defects no longer returned, keeps manual defects.
- **Replace all**: discards the current defect list.

Imported defects arrive with an empty **Notes** field (priority and Jira status are shown as chips on the card instead). The report prints a **Defects by Status and Priority** count matrix (rows = Jira status, columns = Blocker / Critical / Major / Minor / Trivial) above the detailed table.

Production defects (label `aurora_production_issue` or `| Production |` in the summary) are grouped first in the report, then ordered by priority. Toggle **PROD** on any card to move it between groups. Jira statuses map to report statuses as Backlog -> New, Ready -> Open, In Progress / Peer Review -> In progress, Testing / Acceptance -> Fixed, Done -> Verified, Cancelled -> Won't fix.

## Local development

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel (free)

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Use the default settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Deploy. No environment variables required.

Or with the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS
- `@dnd-kit` for reordering
- `zod` for validating imported Jira data
- `localStorage` for persistence

## License

MIT — use freely.
