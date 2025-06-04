#!/usr/bin/env python3
"""
GitHub Copilot Agent Setup Verification Test

This script verifies that the GitHub Copilot Agent is properly set up and can create issues.
It creates a test issue asking the agent to analyze the OSRS parser.
"""

import argparse
import os
import sys
import time
import uuid
from pathlib import Path

# Add the project root to sys.path
project_root = Path(__file__).parent.parent.absolute()
sys.path.append(str(project_root))

# Import the create_agent_issue module
sys.path.append(str(project_root / "scripts"))
from create_agent_issue import create_issue_using_workflow


def main():
    """Create a test issue to verify GitHub Copilot Agent setup"""
    parser = argparse.ArgumentParser(description="Test GitHub Copilot Agent Setup")
    parser.add_argument("--token", help="GitHub token (optional, will use GITHUB_TOKEN env var if not provided)")
    args = parser.parse_args()
    
    token = args.token or os.environ.get('GITHUB_TOKEN')
    
    if not token:
        print("ERROR: GitHub token not provided. Please provide a token with --token or set GITHUB_TOKEN environment variable.")
        sys.exit(1)
    
    # Generate a unique identifier for this test
    test_id = str(uuid.uuid4())[:8]
    
    # Create a test issue
    title = f"[AGENT TASK] Verify GitHub Copilot Agent Setup - Test {test_id}"
    body = f"""## Task Type
- [x] Testing - Write or run tests

## Priority
- [x] Low

## Description
This is a test issue to verify that GitHub Copilot Agent is properly set up and working.

Please perform the following tasks to verify the setup:

1. Run the basic tests for the OSRS parser
2. Report if there are any failing tests
3. Suggest one improvement to the error handling in the parser

## Relevant Code References
- `/workspaces/runerogue/economy_models/osrs_parser.py`
- `/workspaces/runerogue/test_osrs_parser.py`

## Custom MCP Tool Options

### For Testing Tasks
- Test Path: test_osrs_parser.py
- Markers: unit
- Verbose: true

## Acceptance Criteria
- [x] Run basic tests for the OSRS parser
- [x] Report test results
- [x] Suggest one improvement to error handling
- [x] Confirm that GitHub Copilot Agent is working properly

## Environment
- [x] Development
- Python Version: 3.10+

## Task Priority
Priority: Low

## Test ID
{test_id}
"""
    
    try:
        result = create_issue_using_workflow(
            title=title,
            body=body,
            labels="copilot,test",
            assignees="github-copilot[bot]",
            token=token
        )
        print(f"Test issue created successfully with ID: {test_id}")
        print("This issue will be picked up by GitHub Copilot Agent and processed.")
        print("Check your GitHub repository's Issues tab to see the results.")
    except Exception as e:
        print(f"Failed to create test issue: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
