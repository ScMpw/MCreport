# KPI Report workflow (UML)

```mermaid
flowchart TD
    U(["User in KPI_Report.html"])
    Init["Page loads<br/>populateBoards()"]
    Boards["Fetch Jira boards<br/>Jira.fetchBoardsByJql"]
    Selection["Choices.js multi-select<br/>board/group IDs ready"]
    Load["loadDisruption()"]
    Fetch["fetchDisruptionData(domain, boards)"]
    Velocity["Fetch velocity/sprint list<br/>rapid/charts APIs<br/>fallback agile sprint list"]
    SprintReports["Iterate closed sprints<br/>rapid/charts/sprintreport"]
    Events["Build sprint events<br/>completed/added/removed<br/>PI label detection"]
    Issues["Fetch issue details + changelog<br/>blocked periods, cycle time,<br/>initial/completed SP"]
    Metrics["Disruption.calculateDisruptionMetrics<br/>per sprint"]
    Aggregate["Aggregate per board/group<br/>DISPLAY_SPRINT_COUNT window"]
    RenderTable["renderTable() rows + details<br/>renderSprintList()"]
    Charts["renderCharts() → renderBoardCharts()"]
    ChartJS["Chart.js visualizations<br/>rating zones, throughput,<br/>cycle time, disruption"]
    Stats["renderVelocityStats()<br/>throughput & cycle time"]
    PDF["exportPDF()"]
    Prep["Enable datalabels & filtered legends<br/>collect chart canvases"]
    Output["Write per-board charts to PDF<br/>svg2pdf fallback JPEG<br/>save KPI_Report_&lt;date&gt;.pdf"]

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
