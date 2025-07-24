# 3. System Scope and Context

## 3.1 Business Context

The MCreport application operates within the context of agile project management, specifically for teams using Jira for tracking work. The application serves as a specialized reporting and forecasting tool that complements Jira's native reporting capabilities.

### Business Context Diagram

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                     Business Context                     │
│                                                          │
│  ┌─────────────┐          ┌───────────────────────┐      │
│  │             │          │                       │      │
│  │  Project    │◄────────►│                       │      │
│  │  Managers   │          │                       │      │
│  │             │          │                       │      │
│  └─────────────┘          │                       │      │
│                           │                       │      │
│  ┌─────────────┐          │                       │      │
│  │             │          │                       │      │
│  │  Team       │◄────────►│      MCreport         │      │
│  │  Leads      │          │                       │      │
│  │             │          │                       │      │
│  └─────────────┘          │                       │      │
│                           │                       │      │
│  ┌─────────────┐          │                       │      │
│  │             │          │                       │      │
│  │  Executives/│◄────────►│                       │      │
│  │  Stakeholders│         │                       │      │
│  │             │          │                       │      │
│  └─────────────┘          └───────────┬───────────┘      │
│                                       │                  │
│                                       │                  │
│                                       ▼                  │
│                           ┌───────────────────────┐      │
│                           │                       │      │
│                           │         Jira          │      │
│                           │                       │      │
│                           └───────────────────────┘      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### External Systems and Interfaces

| System/Interface | Description |
|------------------|-------------|
| Jira | The application fetches sprint, epic, and story data from Jira's REST API |
| User's Browser | The application runs entirely in the user's web browser |
| PDF Export | The application can export reports to PDF format for sharing |

## 3.2 Technical Context

The MCreport application is a single-page web application that runs entirely in the browser. It interacts with Jira's REST API to fetch data and uses client-side JavaScript for all processing and rendering.

### Technical Context Diagram

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│                     Technical Context                     │
│                                                           │
│  ┌─────────────┐          ┌───────────────────────┐      │
│  │             │          │                       │      │
│  │  Web        │          │  ┌─────────────────┐  │      │
│  │  Browser    │ contains │  │ HTML/CSS        │  │      │
│  │             │          │  └─────────────────┘  │      │
│  │             │          │                       │      │
│  │             │          │  ┌─────────────────┐  │      │
│  │             │          │  │ JavaScript      │  │      │
│  │             │          │  │ - Data Fetching │  │      │
│  │             │          │  │ - Rendering     │  │      │
│  │             │          │  │ - Monte Carlo   │  │      │
│  │             │          │  │   Simulation    │  │      │
│  │             │          │  └─────────────────┘  │      │
│  │             │          │                       │      │
│  │             │          │  ┌─────────────────┐  │      │
│  │             │          │  │ External Libs   │  │      │
│  │             │          │  │ - jsPDF         │  │      │
│  │             │          │  │ - html2canvas   │  │      │
│  │             │          │  │ - Choices.js    │  │      │
│  │             │          │  └─────────────────┘  │      │
│  └─────────────┘          └───────────┬───────────┘      │
│                                       │                  │
│                                       │                  │
│                                       ▼                  │
│                           ┌───────────────────────┐      │
│                           │                       │      │
│                           │  Jira REST API        │      │
│                           │  - Sprint Data        │      │
│                           │  - Epic Data          │      │
│                           │  - Story Data         │      │
│                           │                       │      │
│                           └───────────────────────┘      │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Technical Interfaces

| Interface | Description |
|-----------|-------------|
| Jira REST API | Used to fetch sprint, epic, and story data |
| Jira Greenhopper API | Used to fetch velocity data from Jira's velocity reports |
| Browser LocalStorage | Used to store historical data between sessions |
| PDF Export | Uses jsPDF and html2canvas to generate PDF reports |