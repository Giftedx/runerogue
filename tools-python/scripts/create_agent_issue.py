#!/usr/bin/env python3
"""
AI Agent Issue Creator

This script allows AI agents to programmatically create GitHub issues,
either by directly using the GitHub API or by triggering a GitHub Actions workflow.

Examples:
    # Create an issue using GitHub API
    python create_agent_issue.py --title "Fix bug in parser" --body "The parser fails when..." --api
    
    # Create an issue using GitHub Actions workflow
    python create_agent_issue.py --title "Update documentation" --body "Update docs for..." --workflow
"""

import argparse
import json
import os
import subprocess
import sys
from typing import Dict, List, Optional
import requests
from pathlib import Path


def create_issue_using_api(
    title: str,
    body: str,
    labels: List[str] = None,
    assignees: List[str] = None,
    token: Optional[str] = None
) -> Dict:
    """
    Create a GitHub issue using the GitHub REST API.
    
    Args:
        title: Issue title
        body: Issue body content in markdown
        labels: List of labels to apply
        assignees: List of users to assign
        token: GitHub token (optional, will use GITHUB_TOKEN env var if not provided)
    
    Returns:
        Dict containing the created issue data
    """
    token = token or os.environ.get('GITHUB_TOKEN')
    if not token:
        raise ValueError("GitHub token not provided and GITHUB_TOKEN environment variable not set")
    
    # Determine the repository from the git remote URL
    repo_info = subprocess.check_output(
        ["git", "config", "--get", "remote.origin.url"], 
        universal_newlines=True
    ).strip()
    
    # Handle different URL formats
    if repo_info.startswith("git@github.com:"):
        repo_info = repo_info.split("git@github.com:")[1].split(".git")[0]
    elif repo_info.startswith("https://github.com/"):
        repo_info = repo_info.split("https://github.com/")[1].split(".git")[0]
    
    owner, repo = repo_info.split("/")
    
    url = f"https://api.github.com/repos/{owner}/{repo}/issues"
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "title": title,
        "body": body,
    }
    
    if labels:
        data["labels"] = labels
    
    if assignees:
        data["assignees"] = assignees
    
    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()
    
    issue_data = response.json()
    print(f"Issue created: {issue_data['html_url']}")
    
    return issue_data


def create_issue_using_workflow(
    title: str,
    body: str,
    labels: str = "copilot",
    assignees: str = "github-copilot[bot]",
    token: Optional[str] = None
) -> Dict:
    """
    Create a GitHub issue by triggering the ai-agent-issue-creator workflow.
    
    Args:
        title: Issue title
        body: Issue body content in markdown
        labels: Comma-separated list of labels
        assignees: Comma-separated list of assignees
        token: GitHub token (optional, will use GITHUB_TOKEN env var if not provided)
    
    Returns:
        Dict containing the workflow run information
    """
    token = token or os.environ.get('GITHUB_TOKEN')
    if not token:
        raise ValueError("GitHub token not provided and GITHUB_TOKEN environment variable not set")
    
    # Determine the repository from the git remote URL
    repo_info = subprocess.check_output(
        ["git", "config", "--get", "remote.origin.url"], 
        universal_newlines=True
    ).strip()
    
    # Handle different URL formats
    if repo_info.startswith("git@github.com:"):
        repo_info = repo_info.split("git@github.com:")[1].split(".git")[0]
    elif repo_info.startswith("https://github.com/"):
        repo_info = repo_info.split("https://github.com/")[1].split(".git")[0]
    
    owner, repo = repo_info.split("/")
    
    url = f"https://api.github.com/repos/{owner}/{repo}/actions/workflows/ai-agent-issue-creator.yml/dispatches"
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "ref": "main",  # Use the appropriate branch
        "inputs": {
            "title": title,
            "body": body,
            "labels": labels,
            "assignees": assignees
        }
    }
    
    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()
    
    print(f"Workflow triggered. Check GitHub Actions for progress.")
    return {"status": "workflow_triggered"}


def main():
    parser = argparse.ArgumentParser(description="Create GitHub issues for AI agents")
    parser.add_argument("--title", required=True, help="Issue title")
    parser.add_argument("--body", required=True, help="Issue body content in markdown")
    parser.add_argument("--labels", default="copilot", help="Comma-separated list of labels")
    parser.add_argument("--assignees", default="github-copilot[bot]", help="Comma-separated list of assignees")
    parser.add_argument("--token", help="GitHub token (optional, will use GITHUB_TOKEN env var if not provided)")
    
    # Add mutually exclusive group for API vs Workflow
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--api", action="store_true", help="Use GitHub API directly")
    group.add_argument("--workflow", action="store_true", help="Trigger GitHub Actions workflow")
    
    args = parser.parse_args()
    
    try:
        if args.api:
            labels_list = [label.strip() for label in args.labels.split(",") if label.strip()]
            assignees_list = [assignee.strip() for assignee in args.assignees.split(",") if assignee.strip()]
            create_issue_using_api(args.title, args.body, labels_list, assignees_list, args.token)
        else:
            create_issue_using_workflow(args.title, args.body, args.labels, args.assignees, args.token)
    except Exception as e:
        print(f"Error creating issue: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
