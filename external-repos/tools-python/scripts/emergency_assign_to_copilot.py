#!/usr/bin/env python3
"""
Emergency script to assign issue to GitHub Copilot bot
"""

import os
import requests
import sys

# Get GitHub token from environment variable
github_token = os.environ.get('GITHUB_TOKEN')
if not github_token:
    print("ERROR: GITHUB_TOKEN environment variable not set")
    sys.exit(1)

# Repository and issue details
owner = "Giftedx"  # Replace with your GitHub username
repo = "runerogue"  # Replace with your repository name
issue_number = 48   # Replace with your issue number

# API endpoint for assigning issues
url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}/assignees"

# Request headers
headers = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": f"token {github_token}",
    "X-GitHub-Api-Version": "2022-11-28"
}

# Request body
data = {
    "assignees": ["github-copilot[bot]"]
}

# Make the API request
response = requests.post(url, headers=headers, json=data)

# Check if successful
if response.status_code >= 200 and response.status_code < 300:
    print(f"Successfully assigned issue #{issue_number} to github-copilot[bot]")
else:
    print(f"Error assigning issue: {response.status_code}")
    print(response.json())

# Create "copilot" label if it doesn't exist
labels_url = f"https://api.github.com/repos/{owner}/{repo}/labels"

# Check if the label exists
label_response = requests.get(
    f"{labels_url}/copilot", 
    headers=headers
)

# If label doesn't exist, create it
if label_response.status_code == 404:
    print("Creating 'copilot' label...")
    create_label_data = {
        "name": "copilot",
        "color": "8a2be2",  # BlueViolet color
        "description": "Tasks for GitHub Copilot Agent"
    }
    
    create_response = requests.post(
        labels_url,
        headers=headers,
        json=create_label_data
    )
    
    if create_response.status_code >= 200 and create_response.status_code < 300:
        print("Successfully created 'copilot' label")
    else:
        print(f"Error creating label: {create_response.status_code}")
        print(create_response.json())
else:
    print("'copilot' label already exists")

# Add the "copilot" label to the issue
issue_labels_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}/labels"
label_data = {
    "labels": ["copilot"]
}

label_add_response = requests.post(
    issue_labels_url,
    headers=headers,
    json=label_data
)

if label_add_response.status_code >= 200 and label_add_response.status_code < 300:
    print(f"Successfully added 'copilot' label to issue #{issue_number}")
else:
    print(f"Error adding label to issue: {label_add_response.status_code}")
    print(label_add_response.json())
