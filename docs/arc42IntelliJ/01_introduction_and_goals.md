# 1. Introduction and Goals

## 1.1 Requirements Overview

The MCreport (Monte Carlo Report) is a web application designed to generate Stakeholder PI Status Reports with Monte Carlo simulations and resource allocation analysis. The primary requirements include:

- Fetch sprint and epic data from Jira
- Calculate and display velocity metrics
- Perform Monte Carlo simulations to forecast epic completion
- Analyze resource allocation across epics
- Generate visual reports for stakeholders
- Export reports to PDF format

## 1.2 Quality Goals

| Priority | Quality Goal | Motivation |
|----------|--------------|------------|
| 1 | Usability | The application should be intuitive for project managers and stakeholders to use without extensive training |
| 2 | Performance | Monte Carlo simulations and data processing should be fast enough for interactive use |
| 3 | Reliability | Data fetched from Jira should be accurately processed and displayed |
| 4 | Portability | The application should work in modern browsers without requiring installation |

## 1.3 Stakeholders

| Role | Expectations |
|------|--------------|
| Project Managers | Use the tool to track progress, allocate resources, and generate reports for stakeholders |
| Team Leads | View team allocation and sprint forecasts to plan work |
| Executives/Stakeholders | Receive clear, visual reports on project status and forecasts |
| Developers | View story status and allocation within epics |

## 1.4 Special Requirements

- The application requires authentication with Jira to fetch data
- Users must have appropriate permissions in Jira to access board and sprint data
- The application uses client-side processing to perform Monte Carlo simulations
- No server-side components are required beyond serving the static HTML file