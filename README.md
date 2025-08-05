# MCreport

This repository contains HTML reports and related documentation.

## Running Tests

Tests are written with [Jest](https://jestjs.io/). To execute the tests:

```bash
npm install    # install dev dependencies (requires internet access)
npm test
```

The `npm test` command will run all unit tests located in the `test/` directory.

## Overview CLI

A small Node.js script (`src/overview.js`) provides aggregated metrics for issues.
It calculates average cycle time, throughput per week and velocity per week.

Usage:
```bash
node src/overview.js <issues.json> --team Alpha
```
Provide a JSON file exported from Jira as `<issues.json>` and metrics will be printed for the selected team.

## Overview Web Page

An HTML page (`index_overview.html`) displays the same metrics in the browser.
Enter your Jira domain and a JQL query to load issues directly from Jira. The page lets you filter by team, product and project and shows average cycle time, weekly throughput, velocity and lists the issues grouped by resolution week.
