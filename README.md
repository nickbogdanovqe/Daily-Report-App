# Daily Report App

A free, browser-only daily status report tool for **Aurora Mobile** mobile QA. Compose tasks, blockers, highlights, and defects; preview the report; copy plain text for Outlook. Your draft auto-saves in `localStorage` — no database, no accounts.

## Features

- Structured sections: summary, tasks, blockers, highlights, defects
- Drag-and-drop reorder for all lists
- Rich live preview with color-coded status, KPI cards, and defect table
- One-click copy as **formatted HTML** for Outlook (colors & tables preserved)
- Plain-text fallback if rich copy is unavailable
- Single auto-saved draft per browser
- **Previous day**: when you open the app on a new day, yesterday’s report is saved for reference and its content is copied into today’s draft so you can update it

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
- `localStorage` for persistence

## License

MIT — use freely.
