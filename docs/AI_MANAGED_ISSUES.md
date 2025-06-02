# AI-Managed Issue Creation System

This document describes the self-managed issue creation system for GitHub Copilot Agent and other AI agents in the RuneRogue project.

## Overview

The AI-Managed Issue Creation System allows AI agents to create and manage GitHub issues programmatically, without requiring manual user intervention. This system enables:

1. Creation of GitHub issues via GitHub Actions workflows
2. Custom MCP tools for issue creation
3. Automatic label creation and assignment
4. Python scripts for programmatic issue management

## Components

### 1. GitHub Actions Workflow

The `ai-agent-issue-creator.yml` workflow enables AI agents to create issues via workflow dispatch:

```yaml
name: AI Agent Issue Creator

on:
  workflow_dispatch:
    inputs:
      title:
        description: 'Issue title'
        required: true
      body:
        description: 'Issue body (markdown format)'
        required: true
      labels:
        description: 'Comma-separated list of labels'
        required: false
        default: 'copilot'
      assignees:
        description: 'Comma-separated list of assignees'
        required: false
        default: 'github-copilot[bot]'
```

This workflow automatically creates any required labels and assigns the issue to GitHub Copilot.

### 2. Custom MCP Tool

The `runerogue_create_issue` MCP tool enables GitHub Copilot Agent to create issues directly from within the agent environment:

```json
{
  "name": "runerogue_create_issue",
  "description": "Create a GitHub issue with specified title, body, labels, and assignees",
  "parameters": {
    "title": "Issue title",
    "body": "Issue body content in markdown",
    "labels": "Comma-separated list of labels (default: copilot)",
    "assignees": "Comma-separated list of assignees (default: github-copilot[bot])"
  }
}
```

### 3. Python Script

The `create_agent_issue.py` script provides a command-line interface for creating issues:

```bash
python scripts/create_agent_issue.py --title "Issue Title" --body "Issue Body" --workflow
```

Or using the GitHub API directly:

```bash
python scripts/create_agent_issue.py --title "Issue Title" --body "Issue Body" --api
```

## How to Use

### For GitHub Copilot Agent

GitHub Copilot Agent can create issues using the custom MCP tool:

```
## Task

Please create a new issue to track the implementation of feature X.

## Expected Output

GitHub Copilot Agent will use the runerogue_create_issue tool to create an issue
with appropriate title, description, and labels.
```

### For Other AI Agents

Other AI agents can create issues by:

1. Running the Python script via the terminal
2. Triggering the GitHub Actions workflow via the GitHub API
3. Using the custom MCP tool if they have access to the MCP server

### For Developers

Developers can manually trigger the workflow from the GitHub Actions tab or use the Python script to create issues programmatically.

## Security Considerations

- The `GITHUB_TOKEN` used must have appropriate permissions to create issues
- The workflow runs with the permissions of the user who triggered it
- API tokens should be kept secure and not exposed in logs or code

## Examples

### Creating a Bug Report

```bash
python scripts/create_agent_issue.py \
  --title "[BUG] Parser fails on malformed HTML" \
  --body "## Description\n\nThe OSRS parser fails when encountering malformed HTML..." \
  --labels "copilot,bug" \
  --workflow
```

### Creating a Feature Request

```bash
python scripts/create_agent_issue.py \
  --title "[FEATURE] Add support for OSRS Grand Exchange API" \
  --body "## Description\n\nImplement support for the OSRS Grand Exchange API..." \
  --labels "copilot,feature" \
  --workflow
```

## Troubleshooting

- If the issue creation fails, check the GitHub Actions logs for details
- Ensure the GitHub token has the necessary permissions
- Verify that the repository name and owner are correctly detected
- Check that the issue title and body are properly formatted

## GitHub Copilot SWE Agent Integration

Starting June 2025, we've updated our approach to use the GitHub Copilot SWE Agent (`Copilot`) instead of the standard GitHub Copilot bot (`github-copilot[bot]`). The SWE Agent provides advanced capabilities, including:

1. Automatic PR creation and management
2. Self-assignment to issues and PRs
3. Complex code changes across multiple files
4. Branch creation and management

When creating issues for the GitHub Copilot SWE Agent:

- Use `Copilot` as the assignee (not `github-copilot[bot]`)
- Use the `@Copilot` mention format in comments
- Provide clear, detailed task descriptions
- Reference the [GitHub Copilot SWE Agent guide](/docs/GITHUB_COPILOT_SWE_AGENT.md) for more details

Example workflow code for assigning to the SWE Agent:

```yaml
await github.rest.issues.addAssignees({
  owner: context.repo.owner,
  repo: context.repo.repo,
  issue_number: issue.data.number,
  assignees: ['Copilot']  // Not 'github-copilot[bot]'
});
```
