# 6. Runtime View

This section describes the dynamic aspects of the MCreport system, focusing on the runtime behavior and interactions between components.

## 6.1 Key Runtime Scenarios

The following scenarios represent the most important runtime behaviors of the MCreport application.

### 6.1.1 Initial Data Loading

This scenario describes the process of loading sprint data from Jira.

```
┌──────────┐          ┌──────────────┐          ┌────────────┐
│          │          │              │          │            │
│   User   │          │   MCreport   │          │    Jira    │
│          │          │              │          │            │
└────┬─────┘          └──────┬───────┘          └─────┬──────┘
     │                       │                        │
     │ Enter Jira Domain     │                        │
     │ and Board Number      │                        │
     │─────────────────────>│                        │
     │                       │                        │
     │                       │ Fetch Sprints          │
     │                       │───────────────────────>│
     │                       │                        │
     │                       │ Return Sprint Data     │
     │                       │<───────────────────────│
     │                       │                        │
     │                       │ Fetch Board Team       │
     │                       │───────────────────────>│
     │                       │                        │
     │                       │ Return Team Data       │
     │                       │<───────────────────────│
     │                       │                        │
     │ Display Sprint        │                        │
     │ Selection Dropdown    │                        │
     │<─────────────────────│                        │
     │                       │                        │
```

### 6.1.2 Loading Epic and Story Data

This scenario describes the process of loading epic and story data for a selected sprint.

```
┌──────────┐          ┌──────────────┐          ┌────────────┐
│          │          │              │          │            │
│   User   │          │   MCreport   │          │    Jira    │
│          │          │              │          │            │
└────┬─────┘          └──────┬───────┘          └─────┬──────┘
     │                       │                        │
     │ Select Sprint         │                        │
     │ and Click Load Data   │                        │
     │─────────────────────>│                        │
     │                       │                        │
     │                       │ Fetch Sprint Stories   │
     │                       │───────────────────────>│
     │                       │                        │
     │                       │ Return Story Data      │
     │                       │<───────────────────────│
     │                       │                        │
     │                       │ For Each Epic:         │
     │                       │ Fetch Epic Stories     │
     │                       │───────────────────────>│
     │                       │                        │
     │                       │ Return Epic Stories    │
     │                       │<───────────────────────│
     │                       │                        │
     │                       │ Fetch Velocity Data    │
     │                       │───────────────────────>│
     │                       │                        │
     │                       │ Return Velocity Data   │
     │                       │<───────────────────────│
     │                       │                        │
     │                       │ Process Data           │
     │                       │ Run Monte Carlo        │
     │                       │ Simulations            │
     │                       │                        │
     │ Display Epic          │                        │
     │ Summaries and         │                        │
     │ Forecasts             │                        │
     │<─────────────────────│                        │
     │                       │                        │
```

### 6.1.3 Updating Report Parameters

This scenario describes the process of updating report parameters and regenerating forecasts.

```
┌──────────┐          ┌──────────────┐
│          │          │              │
│   User   │          │   MCreport   │
│          │          │              │
└────┬─────┘          └──────┬───────┘
     │                       │
     │ Edit Velocity Values  │
     │─────────────────────>│
     │                       │
     │ Change Target Sprints │
     │─────────────────────>│
     │                       │
     │ Click Update Report   │
     │─────────────────────>│
     │                       │
     │                       │ Recalculate Monte Carlo
     │                       │ Simulations with New
     │                       │ Parameters
     │                       │
     │ Display Updated       │
     │ Forecasts and         │
     │ Allocations           │
     │<─────────────────────│
     │                       │
```

### 6.1.4 Exporting PDF Report

This scenario describes the process of exporting the report to PDF format.

```
┌──────────┐          ┌──────────────┐
│          │          │              │
│   User   │          │   MCreport   │
│          │          │              │
└────┬─────┘          └──────┬───────┘
     │                       │
     │ Select Epics to       │
     │ Include in PDF        │
     │─────────────────────>│
     │                       │
     │ Click Download PDF    │
     │ Report Button         │
     │─────────────────────>│
     │                       │
     │                       │ Convert HTML to Canvas
     │                       │ for Each Selected Epic
     │                       │
     │                       │ Generate PDF Document
     │                       │ with Canvas Images
     │                       │
     │ Download PDF File     │
     │<─────────────────────│
     │                       │
```

### 6.1.5 Filtering Story Display

This scenario describes the process of filtering stories in the report.

```
┌──────────┐          ┌──────────────┐
│          │          │              │
│   User   │          │   MCreport   │
│          │          │              │
└────┬─────┘          └──────┬───────┘
     │                       │
     │ Select Status Filters │
     │ (Done, In Progress,   │
     │ Open, etc.)           │
     │─────────────────────>│
     │                       │
     │ Select Team Filters   │
     │─────────────────────>│
     │                       │
     │                       │ Apply Filters to
     │                       │ Story Display
     │                       │
     │                       │ Update Status Counts
     │                       │ Based on Filters
     │                       │
     │ Display Filtered      │
     │ Stories and Updated   │
     │ Status Counts         │
     │<─────────────────────│
     │                       │
```

## 6.2 Important Runtime Details

### 6.2.1 Monte Carlo Simulation Process

The Monte Carlo simulation is a key runtime process in the application:

1. For each epic, the application takes the current backlog points and team allocation percentage
2. It runs thousands of simulations using historical velocity data
3. For each simulation run:
   - It randomly selects a velocity value from historical data
   - It applies the team allocation percentage to that velocity
   - It simulates sprint-by-sprint completion until the backlog is exhausted
   - It records the number of sprints needed to complete the backlog
4. The results are sorted and analyzed at different confidence levels (50%, 75%, 95%)
5. The application also calculates the required allocation to complete the epic within a target number of sprints

### 6.2.2 Data Persistence

The application uses LocalStorage to persist historical data between sessions:

1. When a report is generated, the current epic backlogs are stored in LocalStorage
2. When the application loads, it retrieves this historical data
3. The historical data is used to analyze scope changes over time

### 6.2.3 Error Handling

The application includes error handling for API calls:

1. If the velocity report API fails, the application attempts to fetch velocity data from sprint reports
2. If API calls fail due to authentication issues, the user is prompted to log in to Jira
3. If data fetching fails, appropriate error messages are displayed to the user