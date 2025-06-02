#!/usr/bin/env python3
"""Test the GitHub Issue Creator functionality"""

import argparse
import os
import sys
from pathlib import Path

# Add the project root to sys.path
project_root = Path(__file__).parent.parent.absolute()
sys.path.append(str(project_root))

# Import the create_agent_issue module
sys.path.append(str(project_root / "scripts"))
from create_agent_issue import create_issue_using_workflow


def main():
    """Run a test of the issue creator functionality"""
    parser = argparse.ArgumentParser(description="Test the GitHub Issue Creator")
    parser.add_argument("--token", help="GitHub token (optional, will use GITHUB_TOKEN env var if not provided)")
    args = parser.parse_args()
    
    token = args.token or os.environ.get('GITHUB_TOKEN')
    
    if not token:
        print("ERROR: GitHub token not provided. Please provide a token with --token or set GITHUB_TOKEN environment variable.")
        sys.exit(1)
    
    # Create a test issue
    title = "[TEST] GitHub Copilot Agent Issue Creator Test"
    body = """## Test Issue

This is a test issue created by the GitHub Issue Creator test script.

### Purpose
- Test the GitHub Issue Creator functionality
- Verify workflow triggering

### Expected Outcome
- Issue should be created with the 'copilot' label
- Issue should be assigned to GitHub Copilot

If you see this issue, the test was successful!
"""
    
    try:
        result = create_issue_using_workflow(
            title=title,
            body=body,
            labels="copilot,test",
            assignees="github-copilot[bot]",
            token=token
        )
        print("Test successful!")
        print(f"Result: {result}")
    except Exception as e:
        print(f"Test failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
