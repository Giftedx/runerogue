#!/usr/bin/env python3
"""
Advanced GitHub Copilot Agent Assignment Script

This script uses advanced techniques to ensure GitHub Copilot Agent is assigned to issues:
1. Uses the GitHub GraphQL API for more precise control
2. Properly identifies the GitHub Copilot Bot ID
3. Creates a detailed issue with all necessary elements for Copilot to process
4. Verifies the assignment was successful

NOTE: Requires a Personal Access Token with repo scope + workflow scope
"""

import os
import sys
import json
import time
import requests
from datetime import datetime

# Required environment variable
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
if not GITHUB_TOKEN:
    print("ERROR: GITHUB_TOKEN environment variable is not set")
    print("Please set a GitHub Personal Access Token with 'repo' and 'workflow' scopes:")
    print("export GITHUB_TOKEN=your_personal_access_token")
    sys.exit(1)

# Repository configuration
REPO_OWNER = "Giftedx"
REPO_NAME = "runerogue"
GITHUB_API_URL = "https://api.github.com"
GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"

# Headers for REST API requests
REST_HEADERS = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": f"token {GITHUB_TOKEN}",
    "X-GitHub-Api-Version": "2022-11-28"
}

# Headers for GraphQL API requests
GRAPHQL_HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Content-Type": "application/json"
}

def get_github_copilot_bot_id():
    """
    Use the GraphQL API to find the GitHub Copilot Bot's node ID
    This is more reliable than using the login name
    """
    # First, try to find the bot in the repository's collaborators
    query = """
    query FindGitHubCopilotBot($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        collaborators(first: 100) {
          nodes {
            login
            id
            __typename
          }
        }
      }
    }
    """
    
    variables = {
        "owner": REPO_OWNER,
        "name": REPO_NAME
    }
    
    response = requests.post(
        GITHUB_GRAPHQL_URL,
        headers=GRAPHQL_HEADERS,
        json={"query": query, "variables": variables}
    )
    
    if response.status_code == 200:
        data = response.json()
        if "data" in data and data["data"]["repository"]["collaborators"]:
            for user in data["data"]["repository"]["collaborators"]["nodes"]:
                if "github-copilot" in user["login"].lower():
                    print(f"Found GitHub Copilot Bot: {user['login']} (ID: {user['id']})")
                    return user["id"]
    
    # If not found in collaborators, try to search for the user
    query = """
    query FindUser($login: String!) {
      user(login: "github-copilot[bot]") {
        id
        login
        __typename
      }
    }
    """
    
    variables = {
        "login": "github-copilot[bot]"
    }
    
    response = requests.post(
        GITHUB_GRAPHQL_URL,
        headers=GRAPHQL_HEADERS,
        json={"query": query, "variables": variables}
    )
    
    if response.status_code == 200:
        data = response.json()
        if "data" in data and data["data"]["user"]:
            print(f"Found GitHub Copilot Bot: {data['data']['user']['login']} (ID: {data['data']['user']['id']})")
            return data["data"]["user"]["id"]
    
    # If all else fails, try the REST API to search for the bot
    bot_login = "github-copilot[bot]"
    search_url = f"{GITHUB_API_URL}/users/{bot_login}"
    
    response = requests.get(search_url, headers=REST_HEADERS)
    
    if response.status_code == 200:
        user_data = response.json()
        print(f"Found GitHub Copilot Bot: {user_data['login']} (ID: {user_data['id']})")
        return user_data["id"]
    
    # If all attempts fail, return a known fallback ID
    print("Warning: Could not find GitHub Copilot Bot ID. Using fallback ID.")
    return "97300543"  # Common ID for github-copilot[bot]

def ensure_copilot_label_exists():
    """Ensure the 'copilot' label exists in the repository"""
    labels_url = f"{GITHUB_API_URL}/repos/{REPO_OWNER}/{REPO_NAME}/labels"
    
    # Check if label exists
    response = requests.get(f"{labels_url}/copilot", headers=REST_HEADERS)
    
    if response.status_code == 404:
        # Create label
        label_data = {
            "name": "copilot",
            "color": "8a2be2",  # BlueViolet color
            "description": "Tasks for GitHub Copilot Agent"
        }
        
        response = requests.post(labels_url, headers=REST_HEADERS, json=label_data)
        
        if response.status_code >= 200 and response.status_code < 300:
            print("Successfully created 'copilot' label")
        else:
            print(f"Error creating label: {response.status_code}")
            print(response.json())
    else:
        print("'copilot' label already exists")

def create_issue_with_graphql(title, body):
    """
    Create an issue using GraphQL for better control
    """
    query = """
    mutation CreateIssue($repositoryId: ID!, $title: String!, $body: String!, $labelIds: [ID!]) {
      createIssue(input: {
        repositoryId: $repositoryId,
        title: $title,
        body: $body,
        labelIds: $labelIds
      }) {
        issue {
          id
          number
          url
        }
      }
    }
    """
    
    # First, get the repository ID
    repo_query = """
    query GetRepoId($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        id
        labels(first: 100) {
          nodes {
            id
            name
          }
        }
      }
    }
    """
    
    repo_variables = {
        "owner": REPO_OWNER,
        "name": REPO_NAME
    }
    
    response = requests.post(
        GITHUB_GRAPHQL_URL,
        headers=GRAPHQL_HEADERS,
        json={"query": repo_query, "variables": repo_variables}
    )
    
    if response.status_code != 200:
        print(f"Error getting repository ID: {response.status_code}")
        print(response.json())
        return None
    
    data = response.json()
    repository_id = data["data"]["repository"]["id"]
    
    # Find the copilot label ID
    label_id = None
    for label in data["data"]["repository"]["labels"]["nodes"]:
        if label["name"] == "copilot":
            label_id = label["id"]
            break
    
    if not label_id:
        print("Warning: Could not find 'copilot' label ID")
    
    # Create the issue
    variables = {
        "repositoryId": repository_id,
        "title": title,
        "body": body,
        "labelIds": [label_id] if label_id else []
    }
    
    response = requests.post(
        GITHUB_GRAPHQL_URL,
        headers=GRAPHQL_HEADERS,
        json={"query": query, "variables": variables}
    )
    
    if response.status_code != 200:
        print(f"Error creating issue: {response.status_code}")
        print(response.json())
        return None
    
    data = response.json()
    
    if "errors" in data:
        print("GraphQL errors:")
        for error in data["errors"]:
            print(f"- {error['message']}")
        return None
    
    issue_number = data["data"]["createIssue"]["issue"]["number"]
    issue_url = data["data"]["createIssue"]["issue"]["url"]
    
    print(f"Successfully created issue #{issue_number}: {issue_url}")
    return issue_number

def assign_issue_with_graphql(issue_number, assignee_id):
    """
    Assign an issue using GraphQL
    """
    query = """
    mutation AddAssignees($issueId: ID!, $assigneeIds: [ID!]!) {
      addAssigneesToAssignable(input: {
        assignableId: $issueId,
        assigneeIds: $assigneeIds
      }) {
        assignable {
          assignees(first: 10) {
            nodes {
              login
              id
            }
          }
        }
      }
    }
    """
    
    # First, get the issue ID
    issue_query = """
    query GetIssueId($owner: String!, $name: String!, $number: Int!) {
      repository(owner: $owner, name: $name) {
        issue(number: $number) {
          id
        }
      }
    }
    """
    
    issue_variables = {
        "owner": REPO_OWNER,
        "name": REPO_NAME,
        "number": issue_number
    }
    
    response = requests.post(
        GITHUB_GRAPHQL_URL,
        headers=GRAPHQL_HEADERS,
        json={"query": issue_query, "variables": issue_variables}
    )
    
    if response.status_code != 200:
        print(f"Error getting issue ID: {response.status_code}")
        print(response.json())
        return False
    
    data = response.json()
    issue_id = data["data"]["repository"]["issue"]["id"]
    
    # Assign the issue
    variables = {
        "issueId": issue_id,
        "assigneeIds": [assignee_id]
    }
    
    response = requests.post(
        GITHUB_GRAPHQL_URL,
        headers=GRAPHQL_HEADERS,
        json={"query": query, "variables": variables}
    )
    
    if response.status_code != 200:
        print(f"Error assigning issue: {response.status_code}")
        print(response.json())
        return False
    
    data = response.json()
    
    if "errors" in data:
        print("GraphQL errors:")
        for error in data["errors"]:
            print(f"- {error['message']}")
        return False
    
    assignees = data["data"]["addAssigneesToAssignable"]["assignable"]["assignees"]["nodes"]
    if assignees:
        print(f"Successfully assigned issue to: {', '.join([a['login'] for a in assignees])}")
        return True
    else:
        print("Assignment succeeded but no assignees found in response")
        return False

def verify_issue_assignment(issue_number):
    """
    Verify that the issue is correctly assigned to GitHub Copilot
    """
    url = f"{GITHUB_API_URL}/repos/{REPO_OWNER}/{REPO_NAME}/issues/{issue_number}"
    
    max_attempts = 5
    for attempt in range(max_attempts):
        response = requests.get(url, headers=REST_HEADERS)
        
        if response.status_code != 200:
            print(f"Error checking issue: {response.status_code}")
            return False
        
        issue_data = response.json()
        
        if issue_data["assignee"] and "github-copilot" in issue_data["assignee"]["login"].lower():
            print(f"Verified: Issue #{issue_number} is assigned to {issue_data['assignee']['login']}")
            return True
        
        if attempt < max_attempts - 1:
            print(f"Assignment not verified yet. Waiting and retrying... ({attempt+1}/{max_attempts})")
            time.sleep(2)  # Wait before retrying
    
    print(f"Failed to verify assignment after {max_attempts} attempts")
    return False

def backup_fallback_assignment(issue_number):
    """
    Use direct REST API assignment as a fallback method
    Try multiple ways to assign the issue
    """
    assignees_url = f"{GITHUB_API_URL}/repos/{REPO_OWNER}/{REPO_NAME}/issues/{issue_number}/assignees"
    
    # Try all possible variations of the bot username
    possible_assignees = [
        ["github-copilot[bot]"],
        ["github-copilot"],
        ["github-copilot-bot"],
        ["copilot[bot]"]
    ]
    
    for assignees in possible_assignees:
        print(f"Trying to assign with: {assignees}")
        response = requests.post(
            assignees_url,
            headers=REST_HEADERS,
            json={"assignees": assignees}
        )
        
        if response.status_code >= 200 and response.status_code < 300:
            print(f"Received success response with assignees: {assignees}")
            
            # Verify the assignment was successful
            if verify_issue_assignment(issue_number):
                return True
    
    return False

def create_issue_with_advanced_technique():
    """
    Create an issue with a comprehensive approach:
    1. Create a detailed issue with the proper format for Copilot
    2. Use GraphQL to assign the issue
    3. Fall back to REST API if needed
    4. Verify the assignment was successful
    """
    # Step 1: Ensure the 'copilot' label exists
    ensure_copilot_label_exists()
    
    # Step 2: Create a new issue with a timestamp to make it unique
    timestamp = int(time.time())
    title = f"[AGENT TASK] Programmatic Assignment Test - {timestamp}"
    body = f"""---
name: Copilot Agent Task
about: Create a task for GitHub Copilot Agent
title: "{title}"
labels: copilot
assignees: github-copilot[bot]
---

## Task Type
- [x] Testing - Write or run tests

## Priority
- [x] Low

## Description
This is a test issue created programmatically to verify that GitHub Copilot Agent can be assigned automatically.

Please perform these simple tasks:
1. Respond to this issue with "Hello, I am GitHub Copilot Agent"
2. List all files in the `economy_models` directory
3. Confirm that programmatic assignment is working properly

## Relevant Code References
- `economy_models/` - Directory to list
- `scripts/agentic_copilot.py` - Script that created this issue

## Acceptance Criteria
- [x] Respond to this issue
- [x] List files in the economy_models directory
- [x] Confirm that assignment is working

## Environment
- [x] Development
- Python Version: 3.10+
- Other relevant environment details: Created programmatically at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Test ID
{timestamp}
"""
    
    # Create the issue using GraphQL
    issue_number = create_issue_with_graphql(title, body)
    
    if not issue_number:
        print("Failed to create issue with GraphQL. Falling back to REST API.")
        
        # Fallback to REST API
        issues_url = f"{GITHUB_API_URL}/repos/{REPO_OWNER}/{REPO_NAME}/issues"
        issue_data = {
            "title": title,
            "body": body,
            "labels": ["copilot"]
        }
        
        response = requests.post(issues_url, headers=REST_HEADERS, json=issue_data)
        
        if response.status_code >= 200 and response.status_code < 300:
            issue_data = response.json()
            issue_number = issue_data["number"]
            print(f"Successfully created issue #{issue_number} with REST API: {issue_data['html_url']}")
        else:
            print(f"Error creating issue with REST API: {response.status_code}")
            print(response.json())
            return False
    
    # Step 3: Get the GitHub Copilot Bot ID
    bot_id = get_github_copilot_bot_id()
    
    # Step 4: Assign the issue using GraphQL
    assignment_success = assign_issue_with_graphql(issue_number, bot_id)
    
    # Step 5: If GraphQL assignment fails, try using REST API
    if not assignment_success:
        print("GraphQL assignment failed. Trying REST API assignment...")
        assignment_success = backup_fallback_assignment(issue_number)
    
    # Step 6: Verify the assignment was successful
    if assignment_success:
        print(f"Successfully assigned issue #{issue_number} to GitHub Copilot")
        print(f"Issue URL: https://github.com/{REPO_OWNER}/{REPO_NAME}/issues/{issue_number}")
        
        # Create a comment to trigger the Copilot bot
        comments_url = f"{GITHUB_API_URL}/repos/{REPO_OWNER}/{REPO_NAME}/issues/{issue_number}/comments"
        comment_data = {
            "body": "@github-copilot[bot] Please process this task."
        }
        
        requests.post(comments_url, headers=REST_HEADERS, json=comment_data)
        
        return True
    else:
        print(f"Failed to assign issue #{issue_number} to GitHub Copilot")
        print(f"Please manually assign the issue: https://github.com/{REPO_OWNER}/{REPO_NAME}/issues/{issue_number}")
        return False

def trigger_workflow_for_issue(issue_number):
    """Trigger the GitHub Actions workflow to assign the issue"""
    workflow_dispatch_url = f"{GITHUB_API_URL}/repos/{REPO_OWNER}/{REPO_NAME}/actions/workflows/assign-copilot.yml/dispatches"
    
    payload = {
        "ref": "main",
        "inputs": {
            "issue_number": str(issue_number)
        }
    }
    
    response = requests.post(workflow_dispatch_url, headers=REST_HEADERS, json=payload)
    
    if response.status_code == 204:
        print(f"Successfully triggered workflow for issue #{issue_number}")
        return True
    else:
        print(f"Error triggering workflow: {response.status_code}")
        try:
            print(response.json())
        except:
            print(response.text)
        return False

def assign_existing_issue(issue_number):
    """Assign an existing issue to GitHub Copilot"""
    # Get the GitHub Copilot Bot ID
    bot_id = get_github_copilot_bot_id()
    
    # Try GraphQL assignment
    assignment_success = assign_issue_with_graphql(issue_number, bot_id)
    
    # If GraphQL fails, try REST API
    if not assignment_success:
        print("GraphQL assignment failed. Trying REST API assignment...")
        assignment_success = backup_fallback_assignment(issue_number)
    
    # If direct API calls fail, try triggering the workflow
    if not assignment_success:
        print("API assignment failed. Triggering GitHub Actions workflow...")
        assignment_success = trigger_workflow_for_issue(issue_number)
    
    return assignment_success

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        # If an issue number is provided, try to assign that issue
        issue_number = int(sys.argv[1])
        print(f"Attempting to assign issue #{issue_number} to GitHub Copilot...")
        success = assign_existing_issue(issue_number)
    else:
        # Otherwise, create a new issue and assign it
        print("Creating a new issue and assigning it to GitHub Copilot...")
        success = create_issue_with_advanced_technique()
    
    if success:
        print("\n✅ SUCCESS: GitHub Copilot Agent task created and assigned successfully!")
        sys.exit(0)
    else:
        print("\n❌ ERROR: Failed to create or assign GitHub Copilot Agent task.")
        print("Please check the error messages above for more details.")
        sys.exit(1)

if __name__ == "__main__":
    main()
