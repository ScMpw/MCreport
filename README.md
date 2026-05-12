# MCreport

A browser-based KPI reporting and forecasting toolkit for Jira-backed teams.
Uses Monte Carlo simulation to predict sprint completion, measures disruption
metrics, and visualises planned-vs-completed story points across Program Increments.

## Available pages

| Page | Description |
|------|-------------|
| `index.html` | PI status report using **story-point velocity** and Monte Carlo forecasting. |
| `index_throughput.html` | PI status report using **issue-count throughput**. |
| `index_throughput_week.html` | PI status report using **weekly throughput**. |
| `index_disruption.html` | Sprint disruption report (pulled-in, blocked, moved-out metrics). |
| `index_topicmix.html` | Topic mix chart (Main Driver / PI Topics / Other). |
| `issue_insights.html` | Sprint issue insights — status durations, completion rates, transitions. |
| `KPI_Report.html` | Combined KPI dashboard with multiple chart types and PDF export. |
| `KPI_Report_Refactored.html` | Refactored KPI report with demo data and accessible markup. |
| `kpi_report_manual.html` | Manual data entry KPI chart (no Jira required). |
| `target_release_dashboard.html` | PI & target version planning timeline. |
| `team_progression_mock.html` | Epic progression tracker with cycle-time analysis. |
| `team_progression_mock_token.html` | Same as above with API-token authentication. |

## Source modules (`src/`)

| Module | Purpose |
|--------|---------|
| `sanitize.js` | HTML escaping, domain validation, issue key validation. |
| `jira.js` | Jira REST API client with caching and request deduplication. |
| `sim.js` | Monte Carlo simulation engine for sprint forecasting. |
| `kpis.js` | KPI math utilities — velocity (mean), standard deviation, work-day counting. |
| `disruption.js` | Sprint disruption metric aggregation. |
| `piPlanVsCompleteChart.mjs` | PI planned-vs-completed chart computation and rendering. |
| `issue_insights.js` | UI controller for the Sprint Issue Insights dashboard. |
| `logger.js` | Centralized logging with configurable levels and optional fetch timing. |

## Running tests

```bash
# Run all tests
node --test test/

# Run a specific test file
node test/kpis.test.js
```

Tests use the built-in Node.js `assert` module. No external test framework is required.

## Jira API access note

Jira REST APIs do not allow direct cross-origin requests from GitHub Pages.
Serve this dashboard from the same Jira domain or use a proxy that injects
the appropriate CORS headers.

## Security notes

- All Jira data rendered into the DOM is escaped via `Sanitize.escapeHtml()`
  to prevent XSS.
- The `jiraDomain` URL parameter is validated against `*.atlassian.net`.
- Issue keys are validated before being interpolated into JQL queries.
- The logger module's global `fetch` instrumentation can be disabled by
  setting `globalThis.MC_REPORT_SKIP_FETCH_WRAP = true` before import.
