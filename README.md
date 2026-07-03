# Spreadsheet Diff

A single-page web app that compares two CSV or Excel files and produces a
detailed, filterable discrepancy report — entirely in your browser. No
backend, no build step, no files ever leave the user's machine.

**Live demo:** _add your deployed URL here once you publish it (see [Deploying](#deploying-to-a-free-host) below)_

---

## Features

- Upload a `.csv` or `.xlsx` file for **Source A** and **Source B** (drag-and-drop or click to browse)
- Comparison runs **automatically** as soon as both files are uploaded — no setup step
- Detects:
  - **Missing in A** — a row exists in Source B but not at that position in Source A
  - **Missing in B** — a row exists in Source A but not at that position in Source B
  - **Value Mismatch** — same row position, but one or more column values differ
- Options (live-update the results, no "apply" step):
  - Case-sensitive / case-insensitive text comparison
  - Ignore specific columns from the comparison
  - Whitespace is always trimmed; blank/null values are treated consistently
- If the two files don't share every column, the mismatched ones are called out and excluded from comparison automatically
- Results view:
  - Summary bar: total rows in A/B, matched, mismatched, missing
  - Filter tabs: All / Missing rows / Mismatched values
  - Free-text search across row, column name, and both values
  - Visual highlighting of changed values (red for A, green for B)
  - Results are sorted by row number, so you can scan top-to-bottom in the same order as your files
  - **Export CSV** — the discrepancy list (respects the current filter/search)
  - **Export Excel (side by side)** — a workbook with Source A and Source B columns placed next to each other for every row; rows missing from one side are filled solid orange, mismatched cell pairs filled light amber, with a legend at the bottom
- Validates that both files have proper, unique, non-blank headers, with clear error messages for invalid files

## How rows are matched

Rows are compared **by position** — row 1 of Source A against row 1 of
Source B, row 2 against row 2, and so on. This is what makes the app
require zero setup, but it's a deliberate tradeoff worth understanding:

- Works great when both files list the same rows in the same order (the
  common case for two exports of the same data).
- If a row is inserted, removed, or reordered in the middle of one file,
  every row after that point will be lined up against the wrong row on
  the other side and will look mismatched, even if it isn't. In that
  case, sort or align both files the same way before comparing (or see
  [Ideas for future development](#ideas-for-future-development) for
  notes on adding key-based matching back in as an option).

---

## Getting started (local use)

This app has **no build step for end users** — `index.html` is a single,
fully self-contained file (all CSS and JS inlined into it), so it works
straight off disk.

### Option 1 — Open directly

Double-click `index.html` (or open it with your browser's File → Open).

### Option 2 — Run a local server (optional)

```bash
# Python 3
cd spreadsheet-diff
python3 -m http.server 8080
# then open http://localhost:8080

# or, with Node.js installed
npx serve .
```

An internet connection is needed the first time the page loads, since
React, Babel, PapaParse, SheetJS, and ExcelJS are loaded from public CDNs
(unpkg.com and cdnjs.cloudflare.com). No npm install, API keys, or
accounts are required.

## Using the app

1. **Upload files** — drop or select a CSV/XLSX file for Source A and Source B.
2. The comparison runs immediately and results appear below.
3. **Adjust options** if needed — toggle case sensitivity or ignore specific columns. Results update live.
4. **Review results** — use the tabs, search box, and summary bar to explore discrepancies.
5. **Export** — CSV for the discrepancy list, or the side-by-side Excel workbook for a full visual comparison.
6. Click **Start a new comparison** to reset and try different files.

## Sample data

`sample-data/` contains matching CSV and XLSX pairs you can use to try
the app immediately:

- `source_a.csv` / `source_a.xlsx`
- `source_b.csv` / `source_b.xlsx`

Both list the same 9 employees in the same order, with Source A having
one extra trailing row:

| Row | What it tests |
|---|---|
| 1 | Value mismatch (`Salary`) |
| 2 | Perfect match |
| 3 | Value mismatch (`Email`) |
| 4 | Perfect match |
| 5 | Case difference in `Name`/`Department` (matches when case-insensitive, mismatches when case-sensitive) |
| 6 | Case difference in `Email` only |
| 7, 8, 9 | Perfect match |
| 10 | Only in Source A (Source B has 9 rows) → missing in B |

Upload `source_a.csv` as Source A and `source_b.csv` as Source B to see
these discrepancy types with no configuration needed.

---

## Deploying to a free host

Since this is a fully static site (no server, no environment variables,
no database), any static host works. A few good free options:

### GitHub Pages

1. Create a new GitHub repository and push this project to it:
   ```bash
   cd spreadsheet-diff
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. On GitHub, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. Save. GitHub will publish the site at `https://<your-username>.github.io/<your-repo>/` within a minute or two.
5. No GitHub Actions workflow is needed for this — `index.html` at the repo root is all GitHub Pages requires.

### Netlify

- Drag-and-drop the project folder onto [app.netlify.com/drop](https://app.netlify.com/drop) for an instant URL, or
- "Import from Git" and point it at your GitHub repo (leave the build command empty and publish directory as `.` / repo root, since there's no build step).

### Vercel

- Import the GitHub repo at [vercel.com/new](https://vercel.com/new). Framework preset: "Other". No build command needed; output directory is the repo root.

### Cloudflare Pages

- Connect the GitHub repo at [pages.cloudflare.com](https://pages.cloudflare.com). Build command: none. Build output directory: `/`.

All four are free for a project this size and will auto-redeploy when you push changes to the connected branch (GitHub Pages redeploys on every push to the configured branch automatically; the others watch the repo the same way once connected).

---

## Architecture & how it's built

The app is plain HTML/CSS/JS with React loaded from a CDN and JSX
transformed in the browser by Babel Standalone — there's no bundler,
no npm install, and no build step required to *run* it.

However, `index.html` is a **generated file**. The actual source of
truth is:

- `styles.css` — all styling
- `js/parsers.js` — file parsing
- `js/compareEngine.js` — comparison logic
- `js/exportCsv.js` / `js/exportExcel.js` — export logic
- `js/app.js` and `js/components/*.js` — the React UI

`build.py` reads all of these and inlines them directly into
`index.html` (CSS into a `<style>` tag, JS into `<script>` tags), rather
than `index.html` loading them via `<link>`/`<script src="...">`. This
is intentional: a single self-contained file:

- works when double-clicked straight from disk (external `<script src>`
  references to local files can silently fail to load under `file://`
  in some browsers, since Babel Standalone fetches `src=` files via XHR,
  which browsers block for local files), and
- still renders correctly if `index.html` is ever copied, shared, or
  previewed on its own, separated from the rest of the project folder.

**If you edit anything in `styles.css` or `js/`, you must re-run the
build script to regenerate `index.html`:**

```bash
python3 build.py
```

This has no dependencies beyond Python 3's standard library, and is the
only "build step" in this project — it exists purely for our own
development convenience, not for end users.

### Module responsibilities

| File | Responsibility |
|---|---|
| `js/parsers.js` | Reads a `File` object (CSV via PapaParse, XLSX via SheetJS) into `{ fileName, headers, rows }`. Validates that headers exist and are non-blank/unique. |
| `js/compareEngine.js` | Pure functions, no DOM/React. `compareDatasets(...)` takes two parsed datasets + options and returns `{ discrepancies, commonColumns, columnNotice, summary }`. This is the file to read first to understand the matching logic, and the easiest one to unit test in isolation. |
| `js/exportCsv.js` | Turns a discrepancy list into a downloadable CSV. |
| `js/exportExcel.js` | Uses ExcelJS to build the styled, side-by-side comparison workbook (colored fills). |
| `js/components/*.js` | Presentational React components — upload cards, options bar, summary stat cards, and the results table. |
| `js/app.js` | Top-level state: holds the parsed files and options, recomputes the comparison via `useMemo` whenever they change, and lays out the page. |

### Why ExcelJS *and* SheetJS

SheetJS (`xlsx`) is used to **read** uploaded `.xlsx` files — it's fast
and well-supported. But SheetJS's free/community build can only *write*
plain, unstyled spreadsheet data; cell fills/colors require their paid
Pro tier. Since the side-by-side Excel export needs colored cells,
[ExcelJS](https://github.com/exceljs/exceljs) is used instead purely for
**writing** that one file. Both libraries are loaded from CDNs in
`index.html` (via `build.py`'s template).

---

## Known limitations & ideas for future development

- **Positional matching only.** As described above, rows are matched by
  index, not by a key/identifier column. A natural next feature would be
  an *optional* "match by key column(s)" mode for datasets that may be
  reordered — the original key-based matching logic (composite keys,
  duplicate-key detection) was removed for simplicity but the approach
  is straightforward to reintroduce as an opt-in toggle rather than a
  required step.
- **First sheet only.** Excel workbooks with multiple sheets only have
  their first sheet read. A sheet picker would be a reasonable addition.
- **Everything runs in memory in the browser tab.** There's no
  streaming/chunking, so very large files (very roughly, high hundreds
  of thousands of rows) may be slow to parse, compare, or render. The
  results table also renders every row into the DOM rather than
  virtualizing, which is the more likely bottleneck for huge diffs.
- **No automated tests.** `compareEngine.js`, `parsers.js`, and
  `exportCsv.js` are pure functions with no DOM dependency, so they're
  straightforward to unit test (e.g. with a simple Node test runner) if
  this project grows. None exist yet.
- **Excel export is unfiltered.** The CSV export respects the active
  filter/search; the Excel side-by-side export always includes the full
  comparison. Worth aligning if that's ever confusing in practice.
- **Column matching is exact.** Headers are compared by exact string
  match (after trimming) — `"Email"` and `"email "` are treated as
  different columns. Case-insensitive header matching could be added.
- **No dark/light mode toggle.** The UI is dark-themed only.

## Tech stack

- [React 18](https://react.dev/) (UMD build, no bundler)
- [Babel Standalone](https://babeljs.io/docs/babel-standalone) — transforms JSX in the browser at runtime
- [PapaParse](https://www.papaparse.com/) — CSV parsing
- [SheetJS (xlsx)](https://sheetjs.com/) — Excel *parsing*
- [ExcelJS](https://github.com/exceljs/exceljs) — Excel *writing* with cell styles/fills
- Plain CSS (no framework), custom design tokens in `styles.css`

## Project structure

```
spreadsheet-diff/
├── index.html                     # Generated — do not hand-edit; run build.py after changing sources below
├── build.py                       # Regenerates index.html from styles.css + js/**/*.js
├── styles.css                     # All styling (source of truth)
├── js/
│   ├── parsers.js                 # CSV/XLSX file parsing (PapaParse + SheetJS)
│   ├── compareEngine.js           # Row-by-row & column-by-column discrepancy detection
│   ├── exportCsv.js               # Builds and downloads the CSV discrepancy report
│   ├── exportExcel.js             # Builds and downloads the side-by-side Excel workbook
│   ├── app.js                     # Main <App> component (state + layout)
│   └── components/
│       ├── FileUploadCard.js      # Drag-and-drop upload box
│       ├── OptionsPanel.js        # Case sensitivity + ignored columns
│       ├── SummaryBar.js          # Summary stat cards
│       └── ResultsTable.js        # Filter tabs, search, results table, export buttons
├── sample-data/
│   ├── source_a.csv / .xlsx
│   └── source_b.csv / .xlsx
├── LICENSE
└── .gitignore
```

## License

MIT — see [LICENSE](./LICENSE). Update the copyright name in that file
before publishing if you'd like it attributed to you.
