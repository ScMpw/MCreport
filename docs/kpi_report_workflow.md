# KPI Report workflow (UML)

```mermaid
flowchart TD
    U([User in KPI_Report.html])
    Init[Page loads\npopulateBoards()]
    Boards[Fetch Jira boards\nJira.fetchBoardsByJql]
    Selection[Choices.js multi-select\nboard/group IDs ready]
    Load[loadDisruption()]
    Fetch[fetchDisruptionData(domain, boards)]
    Velocity[Fetch velocity/sprint list\nrapid/charts APIs\nfallback agile sprint list]
    SprintReports[Iterate closed sprints\nrapid/charts/sprintreport]
    Events[Build sprint events\ncompleted/added/removed\nPI label detection]
    Issues[Fetch issue details + changelog\nblocked periods, cycle time,\ninitial/completed SP]
    Metrics[Disruption.calculateDisruptionMetrics\nper sprint]
    Aggregate[Aggregate per board/group\nDISPLAY_SPRINT_COUNT window]
    RenderTable[renderTable() rows + details\nrenderSprintList()]
    Charts[renderCharts() -> renderBoardCharts()]
    ChartJS[Chart.js visualizations\nrating zones, throughput,\ncycle time, disruption]
    Stats[renderVelocityStats()\nthroughput & cycle time]
    PDF[exportPDF()]
    Prep[Enable datalabels & filtered legends\ncollect chart canvases]
    Output[Write per-board charts to PDF\nsvg2pdf fallback JPEG\nsave KPI_Report_<date>.pdf]

    U --> Init
    Init --> Boards
    U -->|select domain & boards| Boards
    Boards --> Selection
    U -->|click Load Data| Load
    Load --> Fetch
    Fetch --> Velocity
    Velocity --> SprintReports
    SprintReports --> Events
    Events --> Issues
    Issues --> Metrics
    Metrics --> Aggregate
    Aggregate --> RenderTable
    Aggregate --> Charts
    Charts --> ChartJS
    Aggregate --> Stats
    U -->|Download PDF options| PDF
    PDF --> Prep
    Prep --> Output
```

**Key interactions**
- **populateBoards()** fires on load and when the Jira domain changes, pulling available boards into a Choices.js multi-select. Board shortcuts (e.g., SCO, MCO, ACOSS) expand into predefined board ID groups.  
- **loadDisruption()** reads the selected boards, fetches sprint and issue data from Jira, calculates disruption metrics, and renders the metrics table, sprint chips, throughput/cycle stats, and all charts.  
- **exportPDF()** honors the “Include in PDF” toggles, temporarily turns on chart data labels, renders each chart to SVG (with JPEG fallback), and saves the combined report.  

This diagram reflects the workflow implemented in `KPI_Report.html`, including data acquisition, metric computation, visualization, and PDF export paths.
