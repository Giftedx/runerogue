# GitHub Workflows

This directory contains all the GitHub Actions workflows for the RuneRogue project.

## Active Workflows

- **`ci.yml`**: The main Continuous Integration (CI) pipeline. It runs on every push and pull request to the `main` and `develop` branches. Its jobs include:

  - `lint`: Lints and formats the code.
  - `test`: Runs the full test suite.
  - `build`: Builds the application packages.
  - `godot-build`: Builds the Godot client.
  - `deploy-staging` / `deploy-production`: Placeholder deployment jobs.
  - `notification`: Reports the status of the pipeline.

- **`copilot-agent-tasks.yml`**: A workflow for managing tasks assigned to the AI agent.

- **`auto-assign-copilot.yml`**: Automatically assigns the `github-copilot[bot]` to issues with specific labels.

- **`create-copilot-task.yml`**: A workflow for creating a new Copilot agent task.

- **`mcp-server-ci.yml`**: A CI pipeline specifically for MCP (Model Context Protocol) servers.

- **`doc-memory-hygiene.yml`**: A workflow for maintaining the hygiene of documentation and memory files.

## Legacy & Archived Workflows

The `archive/` and `legacy-archive/` directories contain older or experimental workflows that are no longer in use but are kept for historical reference. They are not triggered and should not be modified.
