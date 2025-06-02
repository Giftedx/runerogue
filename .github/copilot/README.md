# GitHub Copilot Agent Setup for RuneRogue

This document explains how to set up and troubleshoot the GitHub Copilot Agent integration for the RuneRogue project.

## Overview

GitHub Copilot Agent is an AI assistant that can be assigned to issues in your repository. When properly configured, it can:

1. Automatically respond to issues labeled with `copilot` or `ai-task`
2. Perform code analysis and suggest solutions
3. Help with routine tasks and questions

## Setup Requirements

To ensure that GitHub Copilot Agent works properly with your repository, you need:

1. **GitHub Copilot for Business** subscription
2. **GitHub Copilot Agent** enabled for your organization
3. **Proper workflow configuration** for automatic assignment

## Configuration Steps

### 1. Use the GitHub Actions workflow

The repository includes a consolidated workflow file that handles GitHub Copilot Agent assignment:
- `/.github/workflows/github-copilot-assignment.yml`

This workflow is triggered when:
- A new issue is created with `copilot` or `ai-task` label
- An existing issue gets one of these labels added
- The workflow is manually triggered for a specific issue

### 2. Enable GitHub Copilot Agent for your repository

Ensure that GitHub Copilot Agent is enabled for your organization and that it has access to this repository.

## Usage

To create a task for GitHub Copilot Agent:

1. Create a new issue in the repository
2. Add the `copilot` label to the issue
3. The workflow will automatically attempt to assign GitHub Copilot Agent
4. If assignment is successful, GitHub Copilot Agent will respond to the issue

You can also use the create-copilot-task workflow to create and assign issues in one step:
```
Workflow: create-copilot-task
Inputs:
- title: The issue title
- task_type: Type of task (Testing, Documentation, etc.)
- priority: Priority level
- description: Detailed description of the task
- acceptance_criteria: Comma-separated list of criteria
```

## Troubleshooting

If GitHub Copilot Agent isn't being assigned properly:

### Check GitHub Copilot Agent activation
- Confirm that GitHub Copilot Agent is enabled for your organization
- Verify that it has access to this repository

### Manual assignment
If automatic assignment fails, you can:
1. Go to the issue
2. Click on the gear icon in the "Assignees" section
3. Type "github-copilot" and select the bot user

### Manual workflow trigger
You can manually trigger the assignment workflow:
1. Go to the "Actions" tab in GitHub
2. Select "GitHub Copilot Assignment" workflow
3. Click "Run workflow"
4. Enter the issue number you want to assign
5. Click "Run workflow"

## Correct Assignee Format

The key to successful assignment is using the correct format for the GitHub Copilot bot. 
In GitHub API calls and GitHub Actions workflows, the correct format is:

```yaml
assignees: ['github-copilot[bot]']
```

Not `@github/copilot` or other variations.

## Additional Resources

For more information about GitHub Copilot Agent integration, see the following documents:
- [GitHub Copilot Agents Integration Guide](/docs/GITHUB_COPILOT_AGENTS.md)
- [AI-Managed Issue Creation System](/docs/AI_MANAGED_ISSUES.md)
