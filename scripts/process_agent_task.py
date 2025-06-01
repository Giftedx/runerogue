#!/usr/bin/env python
"""
GitHub Copilot Agent Task Processor

This script processes tasks assigned to GitHub Copilot Agents via GitHub Issues.
It parses the issue content, determines the task type, and executes the appropriate actions.

Usage:
    python process_agent_task.py --issue-number <issue_number> --repo <owner/repo>

Example:
    python process_agent_task.py --issue-number 42 --repo Giftedx/runerogue
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Union

import requests
from github import Github


class AgentTaskProcessor:
    """Process tasks assigned to GitHub Copilot Agents."""

    def __init__(self, issue_number: int, repo: str, token: Optional[str] = None):
        """
        Initialize the task processor.

        Args:
            issue_number: The GitHub issue number
            repo: The repository in format 'owner/repo'
            token: GitHub token (optional, will use GITHUB_TOKEN env var if not provided)
        """
        self.issue_number = issue_number
        self.repo_owner, self.repo_name = repo.split('/')
        self.token = token or os.environ.get('GITHUB_TOKEN')
        
        if not self.token:
            raise ValueError("GitHub token not provided and GITHUB_TOKEN environment variable not set")
        
        self.github = Github(self.token)
        self.repo = self.github.get_repo(f"{self.repo_owner}/{self.repo_name}")
        self.issue = self.repo.get_issue(issue_number)
        
        # Ensure the issue is assigned to GitHub Copilot
        if not any(assignee.login == 'github-copilot[bot]' for assignee in self.issue.assignees):
            raise ValueError(f"Issue #{issue_number} is not assigned to GitHub Copilot")
        
        self.task_info = self._parse_issue()
        
    def _parse_issue(self) -> Dict[str, str]:
        """
        Parse the issue content to extract task information.
        
        Returns:
            Dictionary containing task metadata
        """
        body = self.issue.body or ""
        task_info = {
            "title": self.issue.title,
            "type": "Unknown",
            "priority": "Medium",
            "description": "",
            "acceptance_criteria": []
        }
        
        # Extract task type
        type_match = re.search(r"Task Type:\s*([^\r\n]+)", body)
        if type_match:
            task_info["type"] = type_match.group(1).strip()
        
        # Extract priority
        priority_match = re.search(r"Priority:\s*([^\r\n]+)", body)
        if priority_match:
            task_info["priority"] = priority_match.group(1).strip()
        
        # Extract description
        desc_match = re.search(r"Description:\s*\n([\s\S]*?)(?:\n##|\n\*\*|\Z)", body)
        if desc_match:
            task_info["description"] = desc_match.group(1).strip()
        
        # Extract acceptance criteria
        ac_match = re.search(r"Acceptance Criteria:\s*\n([\s\S]*?)(?:\n##|\n\*\*|\Z)", body)
        if ac_match:
            criteria_text = ac_match.group(1)
            criteria_items = re.findall(r"- \[ \] (.*?)(?:\n|$)", criteria_text)
            task_info["acceptance_criteria"] = criteria_items
        
        return task_info
    
    def execute_task(self) -> bool:
        """
        Execute the appropriate action based on the task type.
        
        Returns:
            True if execution was successful, False otherwise
        """
        task_type = self.task_info["type"].lower()
        
        # Log the start of task execution
        print(f"Starting execution of {task_type} task: {self.task_info['title']}")
        self._add_comment(f"🚀 Starting execution of task on self-hosted runner at {datetime.now().isoformat()}")
        
        try:
            if "test" in task_type:
                return self._run_tests()
            elif "doc" in task_type:
                return self._generate_docs()
            elif "lint" in task_type:
                return self._run_linting()
            elif "build" in task_type:
                return self._run_build()
            elif "deploy" in task_type:
                return self._run_deployment()
            else:
                # Generic task handling
                print(f"No specific handler for task type: {task_type}")
                print(f"Running generic task handler")
                return self._run_generic_task()
        except Exception as e:
            error_message = f"❌ Error executing task: {str(e)}"
            print(error_message, file=sys.stderr)
            self._add_comment(error_message)
            return False
    
    def _run_command(self, command: List[str], cwd: Optional[str] = None) -> Tuple[int, str, str]:
        """
        Run a shell command and return the result.
        
        Args:
            command: Command to run as a list of arguments
            cwd: Working directory (optional)
            
        Returns:
            Tuple of (return_code, stdout, stderr)
        """
        print(f"Running command: {' '.join(command)}")
        
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=cwd or os.getcwd()
        )
        
        stdout, stderr = process.communicate()
        return process.returncode, stdout, stderr
    
    def _add_comment(self, comment: str) -> None:
        """
        Add a comment to the GitHub issue.
        
        Args:
            comment: Comment text to add
        """
        self.issue.create_comment(comment)
    
    def _run_tests(self) -> bool:
        """
        Run the test suite.
        
        Returns:
            True if tests pass, False otherwise
        """
        print("Running tests...")
        
        # Run pytest with coverage
        returncode, stdout, stderr = self._run_command(
            ["pytest", "-xvs", "--cov=.", "--cov-report=term", "tests/"]
        )
        
        if returncode == 0:
            self._add_comment(f"✅ Tests passed successfully\n\n```\n{stdout}\n```")
            return True
        else:
            self._add_comment(f"❌ Tests failed\n\n```\n{stdout}\n\n{stderr}\n```")
            return False
    
    def _generate_docs(self) -> bool:
        """
        Generate documentation.
        
        Returns:
            True if documentation generation succeeds, False otherwise
        """
        print("Generating documentation...")
        
        # Example: Check for docstring coverage
        returncode, stdout, stderr = self._run_command(
            ["pytest", "--doctest-modules", "--ignore=tests/"]
        )
        
        # Add a summary comment
        self._add_comment(f"📚 Documentation task completed\n\n```\n{stdout}\n```")
        return returncode == 0
    
    def _run_linting(self) -> bool:
        """
        Run linting checks.
        
        Returns:
            True if linting passes, False otherwise
        """
        print("Running linters...")
        
        # Run flake8
        returncode, stdout, stderr = self._run_command(["flake8", "."])
        flake8_passed = returncode == 0
        
        # Run other linters as needed
        # ...
        
        if flake8_passed:
            self._add_comment("✅ Linting checks passed")
            return True
        else:
            self._add_comment(f"❌ Linting failed\n\n```\n{stdout}\n\n{stderr}\n```")
            return False
    
    def _run_build(self) -> bool:
        """
        Run build process.
        
        Returns:
            True if build succeeds, False otherwise
        """
        print("Running build...")
        
        # Example build command
        returncode, stdout, stderr = self._run_command(["python", "setup.py", "build"])
        
        if returncode == 0:
            self._add_comment("✅ Build completed successfully")
            return True
        else:
            self._add_comment(f"❌ Build failed\n\n```\n{stdout}\n\n{stderr}\n```")
            return False
    
    def _run_deployment(self) -> bool:
        """
        Run deployment process.
        
        Returns:
            True if deployment succeeds, False otherwise
        """
        print("Running deployment...")
        
        # This would be customized based on your deployment process
        self._add_comment("⚠️ Deployment requested but requires manual approval")
        return True
    
    def _run_generic_task(self) -> bool:
        """
        Handle generic tasks without a specific handler.
        
        Returns:
            True if task completes, False otherwise
        """
        # Extract key information from the task
        description = self.task_info["description"]
        
        # Log the task details
        self._add_comment(
            f"🔍 Processing generic task\n\n"
            f"**Task Type:** {self.task_info['type']}\n"
            f"**Priority:** {self.task_info['priority']}\n\n"
            f"Self-hosted runner is ready to process this task. "
            f"Please provide additional instructions in the comments if needed."
        )
        
        return True


def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description="Process GitHub Copilot Agent tasks")
    parser.add_argument("--issue-number", type=int, required=True, help="GitHub issue number")
    parser.add_argument("--repo", type=str, required=True, help="Repository in format owner/repo")
    parser.add_argument("--token", type=str, help="GitHub token (optional, will use GITHUB_TOKEN env var if not provided)")
    
    args = parser.parse_args()
    
    try:
        processor = AgentTaskProcessor(args.issue_number, args.repo, args.token)
        success = processor.execute_task()
        
        if success:
            print(f"Task execution completed successfully")
            sys.exit(0)
        else:
            print(f"Task execution failed")
            sys.exit(1)
    
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
