# 2. Architecture Constraints

This section describes the constraints that influence the architecture of the MCreport application.

## 2.1 Technical Constraints

| Constraint | Description |
|------------|-------------|
| Browser Compatibility | The application must work in modern web browsers (Chrome, Firefox, Safari, Edge) |
| No Backend Required | The application is designed to run entirely in the browser without requiring a dedicated backend server |
| Jira API Dependency | The application relies on Jira's REST API for data retrieval, which imposes limitations on data access and structure |
| CORS Limitations | Browser security policies may restrict direct API calls to Jira, requiring users to be logged into Jira in the same browser |
| Client-side Processing | All data processing, including Monte Carlo simulations, must be performed client-side in JavaScript |
| PDF Generation | PDF reports are generated client-side using jsPDF and html2canvas libraries |

## 2.2 Organizational Constraints

| Constraint | Description |
|------------|-------------|
| Single Developer | The application appears to be maintained by a single developer or small team |
| No Build Process | The application is delivered as a single HTML file without a build process |
| Minimal Dependencies | External dependencies are limited to CDN-hosted libraries (jsPDF, html2canvas, Choices.js) |

## 2.3 Conventions

| Convention | Description |
|------------|-------------|
| Code Structure | JavaScript functions are organized by feature area (data fetching, rendering, simulation) |
| Styling | CSS is embedded in the HTML file using a single style block |
| Error Handling | Simple error handling with console logging and alert messages |
| Data Storage | Local storage is used for persisting historical data between sessions |