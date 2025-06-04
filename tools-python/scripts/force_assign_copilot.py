#!/usr/bin/env python3
"""
Force assign issue to GitHub Copilot bot using direct API call
"""

import os
import requests
import sys
import json

# Get GitHub token from environment variable
github_token = os.environ.get('GITHUB_TOKEN')
if not github_token:
    print("ERROR: GITHUB_TOKEN environment variable not set")
    sys.exit(1)

# Repository and issue details
owner = "Giftedx"
repo = "runerogue"
issue_number = 48

# API endpoint for assigning issues
url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}"

# Request headers
headers = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": f"token {github_token}",
    "X-GitHub-Api-Version": "2022-11-28"
}

# Get current issue data
response = requests.get(url, headers=headers)
if response.status_code != 200:
    print(f"Error getting issue data: {response.status_code}")
    print(response.json())
    sys.exit(1)

issue_data = response.json()
print(f"Current issue data: {json.dumps(issue_data, indent=2)}")

# Request body - update the issue with assignees
data = {
    "assignees": ["github-copilot[bot]"]
}

# Make the API request to update the issue
update_response = requests.patch(url, headers=headers, json=data)

# Check if successful
if update_response.status_code >= 200 and update_response.status_code < 300:
    print(f"Successfully assigned issue #{issue_number} to github-copilot[bot]")
    print(f"Response: {json.dumps(update_response.json(), indent=2)}")
else:
    print(f"Error assigning issue: {update_response.status_code}")
    print(update_response.json())
