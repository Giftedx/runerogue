# GitHub Copilot SWE Agent Integration Guide

This document explains how to properly integrate with the GitHub Copilot SWE Agent (Software Engineering Agent) for the RuneRogue project.

## Overview

GitHub Copilot SWE Agent is an advanced AI assistant that can handle complex software engineering tasks like creating and managing Pull Requests. This is different from the standard GitHub Copilot bot that provides code suggestions.

## Key Differences

There are two different GitHub Copilot entities:

1. **GitHub Copilot [bot]** (`github-copilot[bot]`, ID: 97300543)

   - The standard GitHub Copilot suggestion bot
   - Limited to code completion and issue responses

2. **GitHub Copilot SWE Agent** (`Copilot`, ID: 198982749)
   - Advanced Software Engineering Agent
   - Can create and manage Pull Requests
   - Self-assigns to issues and PRs
   - Can handle complex engineering tasks

## Proper Integration

To properly integrate with GitHub Copilot SWE Agent:

### 1. Use the correct assignee format

When assigning issues to GitHub Copilot SWE Agent, use:

```yaml
assignees: ["Copilot"] # Not 'github-copilot[bot]'
```

### 2. Proper mention format

When mentioning GitHub Copilot SWE Agent in comments:

```
@Copilot Please process this task.
```

### 3. In GitHub Action workflows

```yaml
- name: Assign to GitHub Copilot SWE Agent
  uses: actions/github-script@v6
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    script: |
      await github.rest.issues.addAssignees({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issueNumber,
        assignees: ['Copilot']
      });
```

## PR Creation Process

The GitHub Copilot SWE Agent can create PRs automatically:

1. Create an issue with detailed instructions
2. Assign the issue to `Copilot`
3. The agent will:
   - Create a new branch
   - Make necessary changes
   - Create a PR
   - Self-assign to the PR
   - Continue working on the PR until completion

## Troubleshooting

If GitHub Copilot SWE Agent doesn't respond:

1. Confirm your repository has the GitHub Copilot app installed
2. Verify you're using the correct assignee format (`Copilot`)
3. Check GitHub Actions permissions
4. Ensure the issue description provides clear instructions

## Security Considerations

- GitHub Copilot SWE Agent needs appropriate permissions to create branches and PRs
- Use branch protection rules to ensure PR reviews before merging
- Always review changes made by the agent

## Example Issue Format

For best results, follow this format:

```markdown
## Task Description

[Clear description of what needs to be done]

## Success Criteria

- [List measurable success criteria]

## Implementation Guidelines

- [Any specific guidelines to follow]

## Related Code

- [List relevant files or directories]
```

## References

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [GitHub Copilot SWE Agent API](https://docs.github.com/en/rest/reference/apps#github-copilot)
