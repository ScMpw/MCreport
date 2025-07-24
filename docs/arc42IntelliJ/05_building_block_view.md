# 5. Building Block View

This section describes the static decomposition of the MCreport system into building blocks and their dependencies.

## 5.1 Whitebox Overall System

The MCreport application is a single HTML file that contains all the necessary code (HTML, CSS, and JavaScript) to function. Despite being a single file, the application has a logical structure with distinct components.

### System Overview Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                        MCreport System                      │
│                                                             │
│  ┌─────────────────┐   ┌─────────────────┐   ┌───────────┐  │
│  │                 │   │                 │   │           │  │
│  │  User Interface │   │  Data Fetching  │   │  Storage  │  │
│  │                 │   │                 │   │           │  │
│  └────────┬────────┘   └────────┬────────┘   └─────┬─────┘  │
│           │                     │                  │        │
│           │                     │                  │        │
│           ▼                     ▼                  ▼        │
│  ┌─────────────────┐   ┌─────────────────┐   ┌───────────┐  │
│  │                 │   │                 │   │           │  │
│  │  Rendering      │   │  Monte Carlo    │   │  Export   │  │
│  │                 │   │  Simulation     │   │           │  │
│  └─────────────────┘   └─────────────────┘   └───────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Building Blocks

| Building Block | Description |
|----------------|-------------|
| User Interface | HTML structure and CSS styling for the application interface |
| Data Fetching | JavaScript functions for retrieving data from Jira's REST API |
| Storage | Functions for storing and retrieving historical data using LocalStorage |
| Rendering | Functions for displaying data and generating visual reports |
| Monte Carlo Simulation | Functions for performing probabilistic forecasting |
| Export | Functions for exporting reports to PDF format |

## 5.2 Level 2: Decomposition of Building Blocks

### 5.2.1 User Interface

The User Interface component is responsible for the visual presentation and user interaction.

| Component | Description |
|-----------|-------------|
| HTML Structure | The basic structure of the application, including form elements and containers |
| CSS Styling | Styles for visual presentation, including responsive design |
| Event Handlers | JavaScript functions that respond to user interactions |
| Form Elements | Input fields, buttons, and dropdowns for user input |

### 5.2.2 Data Fetching

The Data Fetching component is responsible for retrieving data from Jira's REST API.

| Component | Description |
|-----------|-------------|
| Sprint Fetching | Functions for retrieving sprint data (`fetchAllSprints`) |
| Epic/Story Fetching | Functions for retrieving epic and story data (`fetchAll`) |
| Velocity Fetching | Functions for retrieving velocity data (`fetchVelocityFromReport`) |
| Team Fetching | Functions for retrieving team data (`fetchBoardTeam`) |
| Error Handling | Logic for handling API errors and providing fallbacks |

### 5.2.3 Storage

The Storage component is responsible for persisting data between sessions.

| Component | Description |
|-----------|-------------|
| Historical Data Storage | Functions for storing and retrieving historical data (`loadHistoricData`, `saveHistoricData`) |
| LocalStorage Interface | Functions for interacting with the browser's LocalStorage API |

### 5.2.4 Rendering

The Rendering component is responsible for displaying data and generating visual reports.

| Component | Description |
|-----------|-------------|
| Epic Summary Rendering | Functions for rendering epic summaries (`renderEpicSummary`) |
| Velocity Rendering | Functions for rendering velocity inputs (`renderVelocityInputs`) |
| Filter Rendering | Functions for rendering filter options (`renderFilterOptions`) |
| Story Map Rendering | Functions for rendering story maps and details |
| Status Indicators | Visual indicators for status (pills, colors) |

### 5.2.5 Monte Carlo Simulation

The Monte Carlo Simulation component is responsible for performing probabilistic forecasting.

| Component | Description |
|-----------|-------------|
| Simulation Engine | Core logic for running Monte Carlo simulations |
| Probability Calculation | Functions for calculating completion probabilities |
| Allocation Analysis | Functions for analyzing resource allocation requirements |

### 5.2.6 Export

The Export component is responsible for exporting reports to PDF format.

| Component | Description |
|-----------|-------------|
| PDF Generation | Functions for generating PDF reports (`exportPDF`) |
| HTML to Canvas | Functions for converting HTML to canvas for PDF export |
| PDF Formatting | Logic for formatting the PDF output |