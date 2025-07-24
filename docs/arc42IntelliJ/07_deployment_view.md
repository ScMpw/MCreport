# 7. Deployment View

This section describes the infrastructure aspects of the MCreport system, including the physical, technical, and organizational environment in which the system is deployed.

## 7.1 Infrastructure Level 1

The MCreport application has a simple deployment model as it is a single HTML file that runs entirely in the user's web browser.

### 7.1.1 Deployment Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      User Environment                       │
│                                                             │
│  ┌─────────────────┐                                        │
│  │                 │                                        │
│  │  Web Browser    │                                        │
│  │                 │                                        │
│  │  ┌─────────┐    │                                        │
│  │  │         │    │                                        │
│  │  │ MCreport│    │                                        │
│  │  │ (HTML)  │    │                                        │
│  │  │         │    │                                        │
│  │  └─────────┘    │                                        │
│  │                 │                                        │
│  └────────┬────────┘                                        │
│           │                                                 │
│           │ HTTPS                                           │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │                 │                                        │
│  │  Jira Instance  │                                        │
│  │                 │                                        │
│  └─────────────────┘                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.1.2 Deployment Elements

| Element | Description |
|---------|-------------|
| Web Browser | The user's web browser (Chrome, Firefox, Safari, Edge) where the application runs |
| MCreport HTML | The single HTML file containing all application code (HTML, CSS, JavaScript) |
| Jira Instance | The Jira server instance that provides data via REST API |

## 7.2 Infrastructure Level 2

### 7.2.1 Web Browser Environment

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                       Web Browser                           │
│                                                             │
│  ┌─────────────────┐   ┌─────────────────┐                  │
│  │                 │   │                 │                  │
│  │  HTML/CSS       │   │  JavaScript     │                  │
│  │  Rendering      │   │  Engine         │                  │
│  │                 │   │                 │                  │
│  └─────────────────┘   └─────────────────┘                  │
│                                                             │
│  ┌─────────────────┐   ┌─────────────────┐                  │
│  │                 │   │                 │                  │
│  │  LocalStorage   │   │  CDN Libraries  │                  │
│  │                 │   │  - jsPDF        │                  │
│  │                 │   │  - html2canvas  │                  │
│  │                 │   │  - Choices.js   │                  │
│  │                 │   │                 │                  │
│  └─────────────────┘   └─────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2.2 Web Browser Environment Elements

| Element | Description |
|---------|-------------|
| HTML/CSS Rendering | The browser's rendering engine that displays the application UI |
| JavaScript Engine | The browser's JavaScript engine that executes the application code |
| LocalStorage | Browser storage mechanism used to persist historical data |
| CDN Libraries | External libraries loaded from CDNs to provide additional functionality |

## 7.3 Deployment Requirements

### 7.3.1 Browser Requirements

| Requirement | Description |
|-------------|-------------|
| Modern Browser | The application requires a modern web browser (Chrome, Firefox, Safari, Edge) |
| JavaScript Enabled | JavaScript must be enabled in the browser |
| LocalStorage Access | The browser must allow access to LocalStorage for data persistence |
| CORS Support | The browser must support Cross-Origin Resource Sharing for API calls |
| PDF Generation | The browser must support the canvas API for PDF generation |

### 7.3.2 Network Requirements

| Requirement | Description |
|-------------|-------------|
| Jira Access | The user must have network access to the Jira instance |
| CDN Access | The browser must have access to CDNs for loading external libraries |
| Authentication | The user must be authenticated with the Jira instance |

## 7.4 Deployment Process

The deployment process for the MCreport application is straightforward:

1. Host the single HTML file on any web server or file sharing system
2. Users access the file via a web browser
3. No installation or configuration is required on the server side
4. Users must have access to and be authenticated with the Jira instance

## 7.5 Scaling and Performance Considerations

| Consideration | Description |
|---------------|-------------|
| Client-side Processing | All processing occurs on the client side, so server scaling is not a concern |
| Browser Performance | The application's performance depends on the user's browser and device capabilities |
| Data Volume | Large numbers of epics and stories may impact performance |
| API Rate Limiting | Jira API rate limits may affect data retrieval for large datasets |