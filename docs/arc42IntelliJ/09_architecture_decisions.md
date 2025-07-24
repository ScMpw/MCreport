# 9. Architecture Decisions

This section documents the key architectural decisions that have shaped the MCreport system.

## 9.1 Single HTML File Architecture

### Context
The application needed to be easily deployable and shareable without requiring complex infrastructure or build processes.

### Decision
Implement the entire application as a single HTML file containing all HTML, CSS, and JavaScript code.

### Rationale
- Simplifies deployment - the application can be hosted on any web server or even shared as a file
- Eliminates the need for a build process
- Reduces complexity in development and maintenance
- Ensures all code is in one place, making it easier to understand and modify

### Consequences
- The file size is larger than it would be with separate files
- Code organization is more challenging within a single file
- Updates require replacing the entire file

## 9.2 Client-Side Only Processing

### Context
The application needs to process Jira data and perform Monte Carlo simulations to generate forecasts.

### Decision
Implement all data processing and simulations on the client side using JavaScript.

### Rationale
- Eliminates the need for a backend server
- Reduces infrastructure requirements
- Provides immediate feedback to users
- Leverages the user's device for computation
- Simplifies deployment and maintenance

### Consequences
- Performance depends on the user's device capabilities
- Complex calculations may impact UI responsiveness
- Limited by browser JavaScript engine capabilities
- Data processing is constrained by client-side memory

## 9.3 Direct Jira API Integration

### Context
The application needs to retrieve data from Jira to generate reports.

### Decision
Integrate directly with Jira's REST API from the client-side JavaScript.

### Rationale
- Simplifies architecture by eliminating the need for a backend proxy
- Leverages the user's existing Jira authentication
- Provides real-time access to the latest Jira data
- Reduces infrastructure requirements

### Consequences
- Requires users to be logged into Jira in the same browser
- Subject to CORS limitations
- Dependent on Jira API stability and rate limits
- Security relies on Jira's authentication mechanisms

## 9.4 LocalStorage for Data Persistence

### Context
The application needs to track historical data between sessions to analyze scope changes over time.

### Decision
Use the browser's LocalStorage API to persist historical data.

### Rationale
- Simple to implement without requiring a database
- Data persists between browser sessions
- No server-side storage required
- User data remains on their device

### Consequences
- Limited storage capacity (typically 5-10MB)
- Data is tied to a specific browser on a specific device
- No synchronization between devices
- Data could be lost if the user clears browser data

## 9.5 CDN-hosted Dependencies

### Context
The application requires several external libraries (jsPDF, html2canvas, Choices.js) for functionality.

### Decision
Load external libraries from public CDNs rather than bundling them with the application.

### Rationale
- Reduces the size of the application file
- Leverages browser caching of common libraries
- Ensures libraries are up-to-date
- Simplifies dependency management

### Consequences
- Dependency on external CDN availability
- Potential security risks if CDN is compromised
- No offline functionality without the CDNs
- Version control of dependencies is less direct

## 9.6 Monte Carlo Simulation for Forecasting

### Context
The application needs to provide probabilistic forecasts for epic completion.

### Decision
Implement Monte Carlo simulation techniques for forecasting.

### Rationale
- Provides statistical confidence levels rather than single-point estimates
- Accounts for variability in velocity and delivery
- Gives stakeholders a range of possible outcomes
- More realistic than deterministic forecasting methods

### Consequences
- More complex implementation than simple calculations
- Requires sufficient historical data for accuracy
- Computationally intensive
- May be harder for some users to understand

## 9.7 Responsive Design

### Context
Users may access the application from various devices with different screen sizes.

### Decision
Implement responsive design using CSS media queries.

### Rationale
- Ensures usability across different devices
- Improves user experience on mobile devices
- Follows modern web design practices
- Reaches wider audience

### Consequences
- Additional complexity in CSS
- Testing required across multiple device sizes
- Some compromises in UI density for smaller screens