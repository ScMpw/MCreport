# Copilot Instructions for MCreport

## Architecture

MCreport is a collection of **standalone browser-based HTML dashboards** that visualize Jira project metrics (velocity, throughput, disruption, topic mix, etc.). There is no bundler or transpiler — raw JS is served directly to the browser.

**Data flow:** HTML page → loads shared modules via `<script>` tags (UMD globals) → inline `<script>` blocks in each HTML file orchestrate Jira API calls, data processing, and Chart.js rendering.

### Module system (mixed)

- **UMD (browser globals):** `jira.js` → `Jira`, `logger.js` → `Logger`, `disruption.js` → `Disruption`, `kpis.js` → `Kpis`. These attach to `window` and are loaded via `<script src="src/...">` (never `type="module"`).
- **CommonJS:** `sim.js` — Node-only, uses `require`/`module.exports`.
- **ESM:** `piPlanVsCompleteChart.mjs` — uses `export function`. The `.mjs` extension is significant since `package.json` declares `"type": "commonjs"`.

When creating new shared modules intended for browser use, follow the existing UMD pattern (check `jira.js` or `kpis.js` for the template).

### Jira API integration (`src/jira.js`)

- Uses **REST API v2/v3** and **Agile API v1.0** with `credentials: 'include'` (cookie-based auth — the user must be logged into Jira in the same browser).
- Includes an **in-memory cache** (5-min TTL) and **request deduplication** via shared Promises.
- Batch search uses `POST /rest/api/3/search` with `fields: ['*all']` and `expand: ['changelog']`, 100 issues per request.
- Board filtering uses a hardcoded `DEFAULT_BOARD_IDS` array.

### HTML dashboards

- Each HTML file is self-contained with large inline `<script>` blocks containing dashboard-specific logic.
- CDN dependencies: Chart.js, chartjs-plugin-datalabels, Choices.js, jsPDF, html-to-image, html2canvas.
- A `<select>` element provides navigation between dashboard variants.
- Styling combines Tailwind utility classes (`public/tailwind.css`) with per-page inline `<style>` blocks.

## Build

```bash
# Rebuild Tailwind CSS (run after changing HTML classes or Tailwind config)
npm run build:css
```

There is no JS build step.

## Tests

Tests use **plain Node.js `assert`** with no test framework. There is no `test` script in `package.json`.

```bash
# Run a single test
node test/disruption.test.js

# Run all tests
for %f in (test\*.test.js) do node %f
```

### Test conventions

- Each test file uses IIFEs `(() => { ... })()` to scope individual test cases.
- Jira API tests mock `global.fetch` and restore it after each test.
- ESM modules (`.mjs`) are loaded via dynamic `await import(...)` inside async IIFEs.
- Tests print `'<name> tests passed'` on success.

## Code conventions

- **No linter or formatter** is configured.
- 2-space indentation, `camelCase` for functions/variables.
- File names use `snake_case` (e.g., `issue_insights.js`) or `camelCase` (e.g., `piPlanVsCompleteChart.mjs`).
- Pure computation functions (in `kpis.js`, `disruption.js`, `sim.js`) are kept separate from rendering/DOM logic.
- `src/logger.js` wraps `globalThis.fetch` to measure total fetch time — this is active whenever `Logger` is loaded.
