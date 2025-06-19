# GitHub Copilot Agents Integration Guide

This guide provides comprehensive instructions on how to use GitHub Copilot Agents with RuneRogue's custom MCP tools and automated workflows.

## Table of Contents

- [Overview](#overview)
- [Automated Task Assignment](#automated-task-assignment)
- [Custom MCP Tools](#custom-mcp-tools)
- [Creating Effective Tasks](#creating-effective-tasks)
- [Using Workflow Dispatch](#using-workflow-dispatch)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## Overview

RuneRogue integrates GitHub Copilot Agents with custom MCP (Model Control Plane) tools to automate development tasks. This integration enables:

1. Automated issue creation and assignment to GitHub Copilot
2. Self-hosted runner execution of Copilot-assigned tasks
3. Custom tools for testing, linting, and documentation generation
4. Structured task templates for consistent results

## Automated Task Assignment

GitHub Copilot Agents can be assigned tasks via GitHub Issues. We've automated this process using GitHub Actions workflows:

### Auto-Assignment Workflow

The `auto-assign-to-copilot.yml` workflow automatically assigns issues with the `copilot` or `ai-task` label to GitHub Copilot.

To use this workflow:

1. Create a new issue in the repository
2. Add the `copilot` or `ai-task` label
3. The workflow will automatically assign the issue to `github-copilot[bot]`

### Create and Assign Workflow

The `create-copilot-task.yml` workflow allows programmatic creation of issues with detailed inputs and automatic assignment to GitHub Copilot.

To use this workflow:

1. Go to the Actions tab in the repository
2. Select "Create Copilot Task" workflow
3. Click "Run workflow"
4. Fill in the required inputs:
   - Title
   - Task type
   - Priority
   - Description
   - Acceptance criteria
5. Click "Run workflow"

## Custom MCP Tools

RuneRogue extends GitHub Copilot's capabilities with custom MCP tools defined in `.github/copilot/mcp_config.json`:

### Testing Tool

```json
{
  "name": "runerogue_run_tests",
  "description": "Run tests for the RuneRogue project with specified modules or test paths",
  "parameters": {
    "testPath": "Optional path to specific test file or directory",
    "markers": "Optional pytest markers to filter tests",
    "verbose": "Whether to run tests in verbose mode"
  }
}
```

Example usage in an issue:

```
## Custom MCP Tool Options

### For Testing Tasks

1. Test Path: tests/test_economy_models.py
2. Markers: unit
3. Verbose: true
```

### Linting Tool

```json
{
  "name": "runerogue_lint_code",
  "description": "Run linting on the codebase or specified files",
  "parameters": {
    "filePath": "Optional path to specific file or directory to lint",
    "fix": "Whether to automatically fix linting issues when possible"
  }
}
```

Example usage in an issue:

```
## Custom MCP Tool Options

### For Linting Tasks

1. File Path: economy_models/
2. Auto-fix: true
```

### Documentation Tool

```json
{
  "name": "generate_docs",
  "description": "Generate documentation for RuneRogue modules",
  "parameters": {
    "module_path": "Path to the module to document",
    "output_format": "Output format (markdown or rst)"
  }
}
```

Example usage in an issue:

```
## Custom MCP Tool Options

### For Documentation Tasks

- Module Path: agents/osrs_agent_system.py
- Output Format: markdown
```

### Issue Creation Tool

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

Example usage in an issue:

```
## Custom MCP Tool Options

### For Issue Creation

- Title: "[BUG] Fix parsing error in OSRS parser"
- Body: "## Description\n\nThe parser fails when processing certain item pages with special characters."
- Labels: "copilot,bug"
- Assignees: "github-copilot[bot]"
```

For more details on the AI-managed issue creation system, see [AI_MANAGED_ISSUES.md](AI_MANAGED_ISSUES.md).

## Creating Effective Tasks

To get the best results from GitHub Copilot Agents, follow these guidelines:

### Task Structure

- Break down large tasks into smaller, focused issues
- Provide clear acceptance criteria
- Include relevant code context

### Prompt Engineering

- Be specific and detailed
- Include example inputs/outputs when relevant
- Specify the programming language and frameworks

### Context Provision

- Reference specific files/functions
- Include error messages for debugging
- Provide sample data formats

## Using Workflow Dispatch

You can programmatically create and assign tasks to GitHub Copilot using workflow dispatch. Here's an example:

```yaml
name: Document OSRS Agent System

on:
  workflow_dispatch:
    inputs:
      output_format:
        description: "Documentation format (markdown or rst)"
        required: true
        default: "markdown"
        type: choice
        options:
          - markdown
          - rst

jobs:
  create-documentation-task:
    runs-on: ubuntu-latest
    steps:
      - name: Create documentation issue and assign to Copilot
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            // Create issue with template
            const issue = await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: "[AGENT TASK] Generate OSRS Agent System Documentation",
              body: `## Task Type
              - [x] Documentation
              
              ## Description
              Generate documentation for the OSRS agent system.
              
              ## Custom MCP Tool Options
              
              ### For Documentation Tasks
              
              - Module Path: agents/osrs_agent_system.py
              - Output Format: ${context.payload.inputs.output_format}
              `,
              labels: ['copilot', 'documentation']
            });

            // Assign to GitHub Copilot
            await github.rest.issues.addAssignees({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issue.data.number,
              assignees: ['github-copilot[bot]']
            });
```

To use this workflow:

1. Go to the Actions tab in the repository
2. Select the workflow
3. Click "Run workflow"
4. Select the desired options
5. Click "Run workflow"

## Troubleshooting

### Agent Not Responding

- Verify `github-copilot[bot]` is assigned
- Check repository permissions
- Ensure issue is properly formatted

### Performance Issues

- Break down complex tasks
- Provide more context if needed
- Check for rate limits

### Unexpected Outputs

- Review and refine prompts
- Add more specific constraints
- Provide example outputs

### Integration Problems

- Verify MCP configuration
- Check environment setup
- Review logs for errors

## Security Best Practices

When working with MCP configuration and GitHub Copilot Agents:

1. Never commit API keys directly in mcp_config.json
2. Use environment variables for sensitive data
3. Regularly rotate API keys
4. Use the minimum required permissions for each service
5. Consider using a secrets manager for production environments

## Example: Generating Documentation

Here's a complete example of using GitHub Copilot Agents to generate documentation for the OSRS agent system:

1. Create a new issue with the following content:

```markdown
title: [AGENT TASK] Generate OSRS Agent System Documentation

## Task Type

- [x] Documentation - Generate or update documentation

## Priority

- [x] Medium

## Description

Generate comprehensive documentation for the OSRS agent system module. The documentation should include:

1. Overview of the module's purpose and architecture
2. Description of each agent's role and functionality
3. Explanation of the agent communication flow
4. Examples of how to use the system
5. API reference for public functions and classes

## Relevant Code References

- agents/osrs_agent_system.py
- economy_models/osrs_parser.py (for the fetch_wiki_data function)

## Custom MCP Tool Options

### For Documentation Tasks

- Module Path: agents/osrs_agent_system.py
- Output Format: markdown

## Acceptance Criteria

- [ ] Documentation includes overview of module purpose
- [ ] All agents are documented with their roles
- [ ] Agent communication flow is explained
- [ ] Usage examples are provided
- [ ] API reference is complete

## Environment

- [x] Development
```

2. Add the `copilot` label to the issue

3. The auto-assignment workflow will assign the issue to GitHub Copilot

4. The self-hosted runner will process the task using the custom MCP tools

5. The documentation will be generated and saved to `docs/generated/osrs_agent_system.md`

6. GitHub Copilot will comment on the issue with the results and mark the task as complete
