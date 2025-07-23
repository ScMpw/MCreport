# arc42 Template Documentation

## 1. Introduction and Goals
This document provides an overview of the architecture for the Stakeholder PI Status Report web tool. The tool fetches data from Jira, performs Monte Carlo simulations and generates PDF reports summarizing epic progress and required allocations.

Primary goals:
- Offer stakeholders an at‑a‑glance view of epic progress within a program increment.
- Provide Monte Carlo based projections for sprint completion.
- Support exporting concise summaries in PDF format.

## 2. Architecture Constraints
- Implemented entirely as a single-page web application (`index.html`).
- Relies on Jira REST API endpoints for data about sprints, issues and board configuration.
- Uses third‑party libraries loaded from CDN: **jsPDF**, **html2canvas** and **Choices.js**.
- Runs in the client browser and therefore requires the user to be authenticated to Jira in the same session (via cookies).

## 3. System Scope and Context
The tool executes in a browser and interacts directly with Jira Cloud APIs. It does not require a backend server of its own. Data flow:
1. **Browser ↔ Jira API** – fetch sprints, issues and velocity data using authenticated requests.
2. **Browser ↔ User** – display interactive controls for sprint selection, velocity adjustment and filtering of epics/stories.
3. **Browser → PDF** – export selected epic summaries into a PDF file using jsPDF and html2canvas.

## 4. Solution Strategy
- Keep the application lightweight by embedding all code in a single HTML file.
- Use the official Jira REST APIs to obtain sprint and issue data.
- Derive velocity from the Jira "Velocity" report and fall back to per‑sprint reports if necessary.
- Perform Monte Carlo simulations in JavaScript to estimate the number of sprints required to complete each epic based on current allocations.
- Allow users to fine tune velocity history, allocation percentages and filters before generating the report.

## 5. Building Block View
The web tool consists of the following main blocks:

- **User Interface (HTML/CSS)** – Layout of inputs, buttons and dynamic tables presenting epic details. Utilises simple CSS for styling and responsive design.
- **Data Fetch Layer** – Functions `fetchAllSprints`, `fetchAll`, `fetchVelocityFromReport` and `fetchBoardTeam` handle communication with Jira's REST APIs.
- **Calculation Engine** – Functions such as `renderEpicSummary` and `applyStoryFilters` compute backlog sizes, allocations and Monte Carlo results.
- **PDF Exporter** – The `exportPDF` function converts selected summary sections to images via html2canvas and inserts them into a jsPDF document.
- **Local Storage** – `loadHistoricData` and `saveHistoricData` manage small amounts of historical backlog info in the browser's local storage.

## 6. Runtime View
Typical workflow:
1. User enters a Jira domain and board number and clicks **Fetch Sprints**.
2. The tool requests sprint information and populates a sprint selection drop‑down.
3. Upon selecting a sprint and clicking **Load Data**, the tool retrieves issues for that sprint and corresponding epics. Velocity history is fetched and displayed for adjustment.
4. The user tweaks allocation percentages and filters. The tool runs Monte Carlo simulations to estimate completion and renders epic summaries with progress metrics.
5. The user may export the summary section to a PDF file using the **Download PDF Report** button.

## 7. Deployment View
The application is a static HTML file with embedded JavaScript and CSS. It can be served from any static file host (e.g. GitHub Pages) or opened locally in a browser. No server-side deployment is required beyond hosting the HTML file.

## 8. Crosscutting Concepts
- **Security** – Authentication relies on the user's existing Jira login; no credentials are stored by the tool. All requests use the browser's cookie for Jira.
- **Error Handling** – Errors fetching data from Jira are surfaced via `alert` messages and logged to the console.
- **Responsiveness** – A few media queries adjust layout for narrow screens.
- **Browser Storage** – Historic backlog values are stored in `localStorage` for lightweight persistence.

## 9. Architecture Decisions
- **Client-only** implementation eliminates the need for server-side infrastructure and simplifies deployment.
- Using **Monte Carlo** simulations allows the tool to provide probabilistic forecasts with minimal computation overhead in the browser.
- External libraries loaded from CDN are used for PDF generation (jsPDF), DOM capture (html2canvas) and user-friendly drop-downs (Choices.js).

## 10. Quality Requirements
Key scenarios include:
- **Accuracy of Forecasts** – Simulations should provide reliable approximations of sprint counts given backlog size and velocity history.
- **Ease of Use** – Non-technical stakeholders can operate the tool via simple form inputs and see results immediately.
- **Portability** – Because it is a single HTML file, the tool can run in any modern browser without additional setup.

## 11. Risks and Technical Debt
- Jira API changes or authentication issues may break the data retrieval process.
- Monte Carlo parameters (number of iterations, velocity distribution) are fixed in the code and may require tuning for larger datasets.
- Storing historical data solely on the client means switching browsers or clearing storage loses the trend information.

## 12. Glossary
- **Epic** – A large body of work in Jira broken into smaller issues.
- **Sprint** – A fixed time-box of work in Agile methodology, typically 1–2 weeks.
- **Velocity** – Measure of completed story points per sprint.
- **Monte Carlo Simulation** – Computational method using repeated random sampling to compute probable outcomes.
- **Jira** – Atlassian's issue and project tracking system.


## 13. Monte Carlo Simulation Logic
The report estimates how many sprints each epic requires by repeatedly
simulating future sprints using the velocity history provided by the
user. For an epic with backlog `B` story points and allocation `a` (as a
percentage of team capacity), a single simulation run proceeds as:

1. Set remaining backlog `b = B` and sprint counter `s = 0`.
2. While `b > 0` and `s < 100`:
   - Pick a velocity `v` at random from the array of historic velocities.
   - Apply the epic allocation so the effective velocity becomes
     `v_eff = max(v * a / 100, 1)`.
   - Reduce the backlog `b = b - v_eff` and increment `s`.
3. Record the number of sprints `s` for this run.

Eight thousand runs are executed for each epic. After sorting the list of
`s` values, the 50th, 75th and 95th percentiles provide the simulated
sprint counts at different confidence levels. Formally, if `S` is the
sorted vector of results and `N` its length, the estimate for probability
`p` is `S[floor(p * N)]`.

The tool also determines how much capacity an epic needs to finish within
a target sprint count. For each allocation percentage between 1% and
100%, 600 simulations are run as above using that allocation. The
smallest percentage where the 75% or 95% percentile does not exceed the
target is reported as the required allocation (and converted into story
points using the average velocity).

