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
node src/overview.js sample-issues.json --team Alpha
```
This reads issues from `sample-issues.json` and prints metrics for the selected team.
