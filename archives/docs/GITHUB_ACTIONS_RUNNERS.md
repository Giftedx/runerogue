# GitHub Actions and Self-Hosted Runners

This document provides information about GitHub Actions and self-hosted runners used in the RuneRogue project, including how they integrate with GitHub Copilot Agents.

## Table of Contents

- [Overview](#overview)
- [Self-Hosted Runner Setup](#self-hosted-runner-setup)
- [Integration with GitHub Copilot Agents](#integration-with-github-copilot-agents)
- [Workflow Configuration](#workflow-configuration)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Overview

GitHub Actions provides automation capabilities for the RuneRogue project, including CI/CD pipelines, testing, and deployment. Self-hosted runners allow us to run these workflows on our own infrastructure, providing more control over the environment and resources.

Key benefits:

- Custom hardware resources tailored to our needs
- Access to specific software and tools required for RuneRogue
- Ability to access internal resources securely
- Improved performance for resource-intensive tasks

## Self-Hosted Runner Setup

Our project uses self-hosted runners with the following labels:

- `self-hosted`
- `Windows`
- `X64`

### Installation Process

The self-hosted runner has been set up with the following steps:

1. Downloaded the runner from GitHub
2. Configured authentication with GitHub
3. Registered the runner with our repository
4. Started the runner service

### Runner Configuration

The runner is configured with default settings and runs in the default work folder. It is set up as a standalone runner rather than a service, which means it needs to be manually started using `./run.cmd`.

## Integration with GitHub Copilot Agents

GitHub Copilot Agents can leverage self-hosted runners to execute tasks that require specific environments or resources. This integration provides several advantages:

### Automated Task Execution

When GitHub Copilot Agents are assigned tasks via GitHub Issues, they can trigger workflows that run on our self-hosted runners. This allows the agents to:

1. Execute code in a controlled environment
2. Access project-specific resources
3. Perform automated testing
4. Deploy changes to development environments

### Workflow Customization for Agents

To optimize GitHub Copilot Agents' performance with self-hosted runners, we can:

1. Create specialized workflows for common agent tasks
2. Pre-install necessary dependencies and tools
3. Configure environment variables for agent access
4. Set up caching to improve performance

## Workflow Configuration

To specify that a workflow should use our self-hosted runner, use the following configuration in your workflow YAML file:

```yaml
jobs:
  build:
    runs-on: [self-hosted, Windows, X64]
    steps:
      # Your workflow steps here
```

### Example: Agent-Triggered Workflow

```yaml
name: Copilot Agent Task

on:
  issues:
    types: [assigned]

jobs:
  process-agent-task:
    # Only run if assigned to GitHub Copilot
    if: github.event.assignee.login == 'github-copilot[bot]'
    runs-on: [self-hosted, Windows, X64]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up environment
        run: |
          # Setup environment for the agent task
          echo "Setting up environment for Copilot Agent task"

      # Additional steps for the specific task type
```

## Security Considerations

When using self-hosted runners with GitHub Copilot Agents, consider the following security aspects:

1. **Access Control**: Limit what the runner can access on your system
2. **Secrets Management**: Use GitHub Secrets for sensitive information
3. **Code Validation**: Review code changes proposed by agents before merging
4. **Runner Isolation**: Consider running in containers or isolated environments
5. **Regular Updates**: Keep the runner software updated

## Troubleshooting

Common issues and solutions:

### Runner Connection Issues

If the runner disconnects from GitHub:

1. Check your network connection
2. Verify GitHub's status at [status.github.com](https://status.github.com)
3. Restart the runner using `./run.cmd`

### Workflow Failures

If workflows fail on the self-hosted runner:

1. Check the runner's logs in the `_diag` folder
2. Verify that all required dependencies are installed
3. Ensure the runner has sufficient permissions

### Agent Integration Issues

If GitHub Copilot Agents cannot properly use the runner:

1. Verify the workflow YAML configuration
2. Check that the agent has appropriate permissions
3. Review the issue description for specific requirements
