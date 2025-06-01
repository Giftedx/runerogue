# GitHub Copilot Agents Integration Guide

This document provides comprehensive guidance on how to use GitHub Copilot Agents within the RuneRogue project.

## Table of Contents
- [Overview](#overview)
- [Setting Up GitHub Copilot Agents](#setting-up-github-copilot-agents)
- [Task Assignment Process](#task-assignment-process)
- [Effective Usage Patterns](#effective-usage-patterns)
- [MCP Configuration](#mcp-configuration)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Security Considerations](#security-considerations)

## Overview

GitHub Copilot Agents is an AI assistant that helps with:
1. Code generation and completion
2. Debugging assistance
3. Code review and improvements
4. Documentation generation
5. Test writing

The agents are triggered via GitHub Issues and require explicit task assignment to work effectively.

## Setting Up GitHub Copilot Agents

### Prerequisites
- GitHub account with access to the repository
- Proper repository permissions
- GitHub Copilot subscription

### Configuration Steps
1. Ensure the `.github/copilot` directory exists with proper configuration
2. Copy `mcp_config.example.json` to `mcp_config.json` and update with your tokens
3. Set up environment variables in your repository secrets

## Task Assignment Process

### Creating Tasks
- Create GitHub Issues with clear titles
- Use labels for categorization
- Assign to `@github/copilot`

### Task Format
- Clear description of the task
- Expected behavior/output
- Relevant code references
- Dependencies/constraints

### Task Management
- Track progress through issue comments
- Use GitHub Projects for organization
- Close issues when complete

## Effective Usage Patterns

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

## MCP Configuration

MCP (Model Control Plane) allows extending agent capabilities through custom tools and configurations.

### Custom Tools
- Extend agent capabilities
- Add repository-specific commands
- Integrate with internal systems

### Configuration
- Define in `mcp_config.json`
- Set up environment variables
- Configure API endpoints

### Security
- Manage API keys securely
- Set access controls
- Monitor usage

### Example Configuration
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${MCP_GITHUB_TOKEN}"
      },
      "tools": ["*"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_SEARCH_API_KEY}"
      },
      "tools": ["*"]
    }
  }
}
```

## Common Issues and Solutions

### Agent Not Responding
- Verify `@github/copilot` is assigned
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

## Security Considerations

When configuring MCP for GitHub Copilot Agents:

1. Never commit API keys directly in `mcp_config.json`
2. Use environment variables for sensitive data
3. Regularly rotate API keys
4. Use the minimum required permissions for each service
5. Consider using a secrets manager for production environments

## Automation Capabilities

- GitHub Copilot Agents can be assigned tasks via GitHub Issues to trigger their agent mode
- GitHub Issues can be created programmatically via GitHub API or `gh` CLI
- In the Windsurf IDE extension, issues can be automatically assigned to GitHub Copilot using GitHub Actions
- This allows for fully automated workflows where issues can be created and assigned to Copilot without manual intervention
- Our repository includes an auto-assignment workflow in `.github/workflows/auto-assign-to-copilot.yml`

### Auto-Assignment Workflow

We've implemented a GitHub Actions workflow that automatically assigns issues with specific labels to GitHub Copilot:

```yaml
name: Auto-Assign to GitHub Copilot

on:
  issues:
    types: [opened, labeled]

jobs:
  assign-to-copilot:
    runs-on: ubuntu-latest
    if: contains(github.event.issue.labels.*.name, 'copilot') || contains(github.event.issue.labels.*.name, 'ai-task')
    
    steps:

      - name: Assign to GitHub Copilot
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            await github.rest.issues.addAssignees({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              assignees: ['github-copilot[bot]']
            });
```

## Self-Hosted Runners Integration

RuneRogue now uses GitHub self-hosted runners to enhance GitHub Copilot Agents' capabilities. This integration provides several benefits:

### Benefits

1. **Custom Environment**: Agents can execute code in a controlled environment with all necessary dependencies pre-installed
2. **Resource Access**: Runners provide access to local resources that may not be available in GitHub-hosted runners
3. **Performance**: Faster execution for resource-intensive tasks like testing and building
4. **Specialized Tools**: Access to project-specific tools and configurations

### Runner Configuration

Our self-hosted runner is configured with the following labels:

- `self-hosted`
- `Windows`
- `X64`

### Using with Copilot Agents

To leverage self-hosted runners with GitHub Copilot Agents:

1. Create GitHub Issues with clear instructions
2. Assign to `@github/copilot`
3. The agent can trigger workflows that run on our self-hosted runner

### Workflow Example

```yaml
name: Copilot Agent Task

on:
  issues:
    types: [assigned]

jobs:
  process-agent-task:
    if: github.event.assignee.login == 'github-copilot[bot]'
    runs-on: [self-hosted, Windows, X64]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      # Additional steps for the specific task
```

For more detailed information about self-hosted runners and GitHub Actions, see [GITHUB_ACTIONS_RUNNERS.md](./GITHUB_ACTIONS_RUNNERS.md).
- GitHub Actions can be used by the Copilot Agent to perform its work once triggered, but not to initiate the trigger itself
