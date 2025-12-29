# MCreport

This repository contains HTML reports for velocity and throughput metrics.

Available pages:

- `index.html`: Velocity report.
- `index_throughput.html`: Throughput report.
- `index_throughput_week.html`: Weekly throughput report.
- `index_disruption.html`: Disruption report including a PI vs non-PI chart.
- `issue_insights.html`: Sprint issue insights dashboard with status duration and completion analysis.

No automated tests are included.

## Jira API access note

Jira REST APIs do not allow direct cross-origin requests from GitHub Pages. Serve this dashboard from the same Jira domain or use a proxy that injects the appropriate CORS headers.
