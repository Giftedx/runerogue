#!/usr/bin/env python3
"""
Create a new test issue for GitHub Copilot Agent with multiple assignment attempts
"""

import os
import requests
import sys
import json
import time

# Get GitHub token from environment variable
github_token = os.environ.get('GITHUB_TOKEN')
if not github_token:
    print("ERROR: GITHUB_TOKEN environment variable not set")
    sys.exit(1)

# Repository details
owner = "Giftedx"
repo = "runerogue"

# API endpoints
repo_url = f"https://api.github.com/repos/{owner}/{repo}"
issues_url = f"{repo_url}/issues"
labels_url = f"{repo_url}/labels"

# Request headers
headers = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": f"token {github_token}",
    "X-GitHub-Api-Version": "2022-11-28"
}

# Step 1: Ensure 'copilot' label exists
print("Checking if 'copilot' label exists...")
label_response = requests.get(f"{labels_url}/copilot", headers=headers)

if label_response.status_code == 404:
    print("Creating 'copilot' label...")
    label_data = {
        "name": "copilot",
        "color": "8a2be2",  # BlueViolet color
        "description": "Tasks for GitHub Copilot Agent"
    }
    
    create_label_response = requests.post(labels_url, headers=headers, json=label_data)
    
    if create_label_response.status_code >= 200 and create_label_response.status_code < 300:
        print("Successfully created 'copilot' label")
    else:
        print(f"Error creating label: {create_label_response.status_code}")
        print(create_label_response.json())
        sys.exit(1)
else:
    print("'copilot' label already exists")

# Step 2: Create a new issue
print("Creating new test issue...")
timestamp = int(time.time())
issue_data = {
    "title": f"[AGENT TASK] Test GitHub Copilot Agent Assignment - {timestamp}",
    "body": """## Task Type
- [x] Testing - Write or run tests

## Priority
- [x] Low

## Description
This is a test issue to verify that GitHub Copilot Agent can be properly assigned to issues.

Please perform a simple task:
1. Echo back "Hello, I am GitHub Copilot Agent"
2. List all the files in the economy_models directory

## Acceptance Criteria
- [x] Respond to this issue
- [x] Demonstrate that assignment is working

## Environment
- [x] Development
""",
    "labels": ["copilot"]
}

create_issue_response = requests.post(issues_url, headers=headers, json=issue_data)

if create_issue_response.status_code >= 200 and create_issue_response.status_code < 300:
    issue = create_issue_response.json()
    issue_number = issue["number"]
    print(f"Successfully created issue #{issue_number}: {issue['html_url']}")
else:
    print(f"Error creating issue: {create_issue_response.status_code}")
    print(create_issue_response.json())
    sys.exit(1)

# Step 3: Try different ways to assign to GitHub Copilot
assignees_url = f"{issues_url}/{issue_number}/assignees"

# Attempt 1: Try with 'github-copilot'
print("\nAttempt 1: Assigning with 'github-copilot'...")
assign_data_1 = {
    "assignees": ["github-copilot"]
}
assign_response_1 = requests.post(assignees_url, headers=headers, json=assign_data_1)
print(f"Response: {assign_response_1.status_code}")
print(assign_response_1.json())

# Attempt 2: Try with 'github-copilot[bot]'
print("\nAttempt 2: Assigning with 'github-copilot[bot]'...")
assign_data_2 = {
    "assignees": ["github-copilot[bot]"]
}
assign_response_2 = requests.post(assignees_url, headers=headers, json=assign_data_2)
print(f"Response: {assign_response_2.status_code}")
print(assign_response_2.json())

# Attempt 3: Get apps and try with app ID
print("\nAttempt 3: Finding GitHub Copilot app and trying app ID...")
apps_url = "https://api.github.com/apps"
apps_response = requests.get(apps_url, headers=headers)
print(f"Apps response: {apps_response.status_code}")
if apps_response.status_code == 200:
    apps = apps_response.json()
    for app in apps:
        if "github-copilot" in app.get("name", "").lower():
            print(f"Found GitHub Copilot app: {app['name']} (ID: {app['id']})")
            
            # Try with app ID format
            app_id = app['id']
            assign_data_3 = {
                "assignees": [f"app/{app_id}"]
            }
            assign_response_3 = requests.post(assignees_url, headers=headers, json=assign_data_3)
            print(f"Response: {assign_response_3.status_code}")
            print(assign_response_3.json())
else:
    print("Could not retrieve apps list")

print("\nPlease check the issue and manually assign it to GitHub Copilot if needed.")
print(f"Issue URL: {issue['html_url']}")
