"""
Development Tools for the MCP Server.

This module provides tools for documentation generation, testing, and linting
that are essential for the GitHub Copilot Agents integration.
"""

import asyncio
from pathlib import Path
from typing import Dict, Any

from fastapi import HTTPException

from .server import tool


@tool(
    name="generate_docs",
    description=(
        "Generate comprehensive documentation for a specified module "
        "in the RuneRogue project"
    ),
    parameters={
        "type": "object",
        "properties": {
            "module_path": {
                "type": "string",
                "description": (
                    "Path to the module to document "
                    "(e.g., 'agents/osrs_agent_system.py')"
                )
            },
            "output_format": {
                "type": "string",
                "enum": ["markdown", "rst"],
                "description": "Output format for the documentation",
                "default": "markdown"
            },
            "include_examples": {
                "type": "boolean",
                "description": (
                    "Whether to include usage examples "
                    "in the documentation"
                ),
                "default": True
            }
        },
        "required": ["module_path"]
    }
)
async def generate_docs_tool(
    module_path: str,
    output_format: str = "markdown",
    include_examples: bool = True
) -> Dict[str, Any]:
    """Generate documentation for a specified module.

    Args:
        module_path: Path to the module to document
        output_format: Output format (markdown or rst)
        include_examples: Whether to include usage examples

    Returns:
        Dict containing documentation generation results
    """
    try:
        # Validate the module path exists
        project_root = Path("/workspaces/runerogue")
        full_path = project_root / module_path

        if not full_path.exists():
            raise HTTPException(
                status_code=400,
                detail=f"Module path does not exist: {module_path}"
            )

        # Build the command to generate documentation
        script_path = project_root / "scripts" / "generate_osrs_docs.py"
        cmd = [
            "python",
            str(script_path),
            f"--module={module_path}",
            f"--format={output_format}"
        ]

        if include_examples:
            cmd.append("--examples")

        # Run the documentation generation process
        result = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(project_root),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await result.communicate()

        success = result.returncode == 0
        output_text = stdout.decode('utf-8') if stdout else ""
        error_text = stderr.decode('utf-8') if stderr else ""

        # Extract output file path if successful
        output_file = None
        if success and "Output file:" in output_text:
            for line in output_text.split('\n'):
                if line.strip().startswith("Output file:"):
                    output_file = line.split("Output file:")[-1].strip()
                    break

        return {
            "success": success,
            "module_path": module_path,
            "output_format": output_format,
            "include_examples": include_examples,
            "output_file": output_file,
            "output": output_text,
            "error": error_text if not success else None,
            "exit_code": result.returncode
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating documentation: {str(e)}"
        )


@tool(
    name="run_tests",
    description=(
        "Run tests for the specified module or the entire RuneRogue project"
    ),
    parameters={
        "type": "object",
        "properties": {
            "test_path": {
                "type": "string",
                "description": (
                    "Path to the test file or directory, "
                    "or 'all' for all tests"
                ),
                "default": "all"
            },
            "markers": {
                "type": "string",
                "description": (
                    "Optional test markers (e.g., unit, integration)"
                ),
                "default": ""
            },
            "verbose": {
                "type": "boolean",
                "description": "Whether to show detailed test output",
                "default": False
            }
        }
    }
)
async def run_tests_tool(
    test_path: str = "all",
    markers: str = "",
    verbose: bool = False
) -> Dict[str, Any]:
    """Run tests for the specified module or entire project.

    Args:
        test_path: Path to test file/directory or 'all' for all tests
        markers: Test markers to filter by
        verbose: Whether to show detailed output

    Returns:
        Dict containing test execution results
    """
    try:
        project_root = Path("/workspaces/runerogue")

        # Build pytest command
        cmd = ["pytest"]

        # Add test path
        if test_path and test_path != "all":
            # Validate the test path exists
            full_path = project_root / test_path
            if not full_path.exists():
                raise HTTPException(
                    status_code=400,
                    detail=f"Test path does not exist: {test_path}"
                )
            cmd.append(str(test_path))

        # Add markers if specified
        if markers and markers.strip():
            cmd.extend(["-m", markers])

        # Add verbose flag if requested
        if verbose:
            cmd.append("-v")

        # Run the tests
        result = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(project_root),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await result.communicate()

        success = result.returncode == 0
        output_text = stdout.decode('utf-8') if stdout else ""
        error_text = stderr.decode('utf-8') if stderr else ""

        return {
            "success": success,
            "test_path": test_path,
            "markers": markers or "none",
            "verbose": verbose,
            "output": output_text,
            "error": error_text if not success else None,
            "exit_code": result.returncode
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error running tests: {str(e)}"
        )


@tool(
    name="run_linting",
    description=(
        "Run linting checks on the specified module "
        "or the entire RuneRogue project"
    ),
    parameters={
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "description": (
                    "Path to the file or directory to lint, "
                    "or 'all' for all files"
                ),
                "default": "all"
            },
            "auto_fix": {
                "type": "boolean",
                "description": "Whether to automatically fix linting issues",
                "default": False
            },
            "report_format": {
                "type": "string",
                "enum": ["text", "json"],
                "description": "Format for the linting report",
                "default": "text"
            }
        }
    }
)
async def run_linting_tool(
    file_path: str = "all",
    auto_fix: bool = False,
    report_format: str = "text"
) -> Dict[str, Any]:
    """Run linting checks on the specified file or directory.

    Args:
        file_path: Path to file/directory to lint or 'all' for entire project
        auto_fix: Whether to automatically fix issues
        report_format: Output format for results

    Returns:
        Dict containing linting results
    """
    try:
        project_root = Path("/workspaces/runerogue")

        # Determine the target path
        if file_path == "all":
            target_path = "."
        else:
            # Validate the file path exists
            full_path = project_root / file_path
            if not full_path.exists():
                raise HTTPException(
                    status_code=400,
                    detail=f"File path does not exist: {file_path}"
                )
            target_path = file_path

        # First run flake8 to check for issues
        flake8_cmd = ["flake8", target_path]
        if report_format == "json":
            flake8_cmd.extend(["--format=json"])

        # Run flake8
        result = await asyncio.create_subprocess_exec(
            *flake8_cmd,
            cwd=str(project_root),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await result.communicate()

        flake8_success = result.returncode == 0
        flake8_output = stdout.decode('utf-8') if stdout else ""
        flake8_error = stderr.decode('utf-8') if stderr else ""

        # If auto_fix is True and there are issues, run autopep8
        fix_output = ""
        fix_error = ""
        if auto_fix and not flake8_success:
            autopep8_cmd = [
                "autopep8", "--in-place", "--aggressive",
                "--aggressive", target_path
            ]

            fix_result = await asyncio.create_subprocess_exec(
                *autopep8_cmd,
                cwd=str(project_root),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            fix_stdout, fix_stderr = await fix_result.communicate()
            fix_output = fix_stdout.decode('utf-8') if fix_stdout else ""
            fix_error = fix_stderr.decode('utf-8') if fix_stderr else ""

        return {
            "success": flake8_success,
            "file_path": file_path,
            "auto_fix": auto_fix,
            "report_format": report_format,
            "issues": (
                flake8_output if not flake8_success
                else "No linting issues found"
            ),
            "output": flake8_output,
            "error": flake8_error if flake8_error else None,
            "fix_applied": auto_fix and not flake8_success,
            "fix_output": fix_output if auto_fix else None,
            "fix_error": fix_error if auto_fix and fix_error else None,
            "exit_code": result.returncode
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error running linting: {str(e)}"
        )
