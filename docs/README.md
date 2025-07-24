# MCreport Documentation

This directory contains the documentation for the MCreport application.

## Documentation Structure

The documentation follows the [arc42](https://arc42.org/) template for architecture documentation, which is a widely-used standard for documenting software architectures.

### Arc42 Documentation

The complete arc42 documentation is located in the [arc42](./arc42) directory. The main entry point is [index.md](./arc42/index.md), which provides links to all sections of the documentation.

The arc42 documentation is structured into 12 standard sections:

1. [Introduction and Goals](./arc42/01_introduction_and_goals.md)
2. [Architecture Constraints](./arc42/02_architecture_constraints.md)
3. [System Scope and Context](./arc42/03_system_scope_and_context.md)
4. [Solution Strategy](./arc42/04_solution_strategy.md)
5. [Building Block View](./arc42/05_building_block_view.md)
6. [Runtime View](./arc42/06_runtime_view.md)
7. [Deployment View](./arc42/07_deployment_view.md)
8. [Cross-cutting Concepts](./arc42/08_crosscutting_concepts.md)
9. [Architecture Decisions](./arc42/09_architecture_decisions.md)
10. [Quality Requirements](./arc42/10_quality_requirements.md)
11. [Risks and Technical Debt](./arc42/11_risks_and_technical_debt.md)
12. [Glossary](./arc42/12_glossary.md)

## How to Use This Documentation

### For New Users

If you're new to the MCreport application, start with the [Introduction and Goals](./arc42/01_introduction_and_goals.md) section to understand the purpose and main features of the application.

### For Developers

If you're a developer looking to understand or modify the application:

1. Start with the [Building Block View](./arc42/05_building_block_view.md) to understand the structure of the code
2. Review the [Architecture Decisions](./arc42/09_architecture_decisions.md) to understand why certain approaches were chosen
3. Check the [Risks and Technical Debt](./arc42/11_risks_and_technical_debt.md) section for known issues and improvement opportunities

### For Deployment

If you're deploying the application, refer to the [Deployment View](./arc42/07_deployment_view.md) section for requirements and instructions.

## Viewing the Documentation

The documentation is written in Markdown format. You can:

1. View it directly on GitHub or any Git platform that renders Markdown
2. Use a Markdown viewer or editor
3. Convert it to HTML or PDF using tools like Pandoc or a Markdown converter

## Updating the Documentation

When making changes to the application, please update the relevant sections of the documentation to keep it current. This is especially important for:

- New features or significant changes to existing features
- Changes to the architecture or design
- New dependencies or deployment requirements
- Resolved risks or technical debt items

## Documentation Date

This documentation was created on: 2025-07-23