# KPI Report workflow (UML)

```mermaid
flowchart TD
    U[User in KPI_Report.html] --> Init[Page loads<br/>populateBoards()]
    Init --> Boards[Fetch Jira boards<br/>Jira.fetchBoardsByJql]
    U --> |select domain & boards| Boards
    Boards --> Selection[Choices.js multi-select<br/>board/group IDs ready]
    U --> |click Load Data| Load[loadDisruption()]
    Load --> Fetch[fetchDisruptionData(domain, boards)]
    Fetch --> Velocity[Fetch velocity/sprint list<br/>rapid/charts APIs<br/>fallback agile sprint list]
    Velocity --> SprintReports[Iterate closed sprints<br/>rapid/charts/sprintreport]
    SprintReports --> Events[Build sprint events<br/>completed/added/removed<br/>PI label detection]
    Events --> Issues[Fetch issue details + changelog<br/>blocked periods, cycle time,<br/>initial/completed SP]
    Issues --> Metrics[Disruption.calculateDisruptionMetrics<br/>per sprint]
    Metrics --> Aggregate[Aggregate per board/group<br/>DISPLAY_SPRINT_COUNT window]
    Aggregate --> RenderTable[renderTable() rows + details<br/>renderSprintList()]
    Aggregate --> Charts[renderCharts() → renderBoardCharts()]
    Charts --> ChartJS[Chart.js visualizations<br/>rating zones, throughput,<br/>cycle time, disruption]
    Aggregate --> Stats[renderVelocityStats()<br/>throughput & cycle time]
    U --> |Download PDF options| PDF[exportPDF()]
    PDF --> Prep[Enable datalabels & filtered legends<br/>collect chart canvases]
    Prep --> Output[Write per-board charts to PDF<br/>svg2pdf fallback JPEG<br/>save KPI_Report_<date>.pdf]
```

**Key interactions**
- **populateBoards()** fires on load and when the Jira domain changes, pulling available boards into a Choices.js multi-select. Board shortcuts (e.g., SCO, MCO, ACOSS) expand into predefined board ID groups.  
- **loadDisruption()** reads the selected boards, fetches sprint and issue data from Jira, calculates disruption metrics, and renders the metrics table, sprint chips, throughput/cycle stats, and all charts.  
- **exportPDF()** honors the “Include in PDF” toggles, temporarily turns on chart data labels, renders each chart to SVG (with JPEG fallback), and saves the combined report.  

This diagram reflects the workflow implemented in `KPI_Report.html`, including data acquisition, metric computation, visualization, and PDF export paths.
