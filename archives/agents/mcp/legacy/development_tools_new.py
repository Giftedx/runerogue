"""
Development tools for the MCP server.

This module provides tools for generating documentation, running tests,
and performing linting operations within the RuneRogue project.
"""

import asyncio
import subprocess
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import HTTPException
from pydantic import BaseModel, Field

from .server import tool


# Input models for the tools
class GenerateDocsInput(BaseModel):
    """Input model for the generate_docs tool."""
    module_path: str = Field(..., description="Path to the module to document (e.g., 'agents/osrs_agent_system.py')")
    output_format: str = Field("markdown", description="Output format (markdown or rst)")
    include_examples: bool = Field(True, description="Whether to include usage examples in the documentation")


class RunTestsInput(BaseModel):
    """Input model for the run_tests tool."""
    test_path: Optional[str] = Field(None, description="Specific test file or directory to run (optional)")
    markers: Optional[str] = Field(None, description="Pytest markers to filter tests (e.g., 'slow', 'integration')")
    verbose: bool = Field(False, description="Enable verbose output")


class RunLintingInput(BaseModel):
    """Input model for the run_linting tool."""
    file_path: Optional[str] = Field(None, description="Specific file to lint (optional, defaults to all Python files)")
    autofix: bool = Field(False, description="Automatically fix linting issues where possible")
    output_format: str = Field("default", description="Output format (default, json, or parseable)")


@tool(
    name="generate_docs",
    description=(
        "Generate comprehensive documentation for a specified module "
        "in the RuneRogue project"
    ),
    input_model=GenerateDocsInput
)
async def generate_docs_tool(input_data: GenerateDocsInput) -> Dict[str, Any]:
    """Generate documentation for a specified module.

    Args:
        input_data: Input parameters for documentation generation

    Returns:
        Dict containing documentation generation results
    """
    try:
        # Validate the module path exists
        project_root = Path("/workspaces/runerogue")
        full_path = project_root / input_data.module_path

        if not full_path.exists():
            raise HTTPException(
                status_code=400,
                detail=f"Module path does not exist: {input_data.module_path}"
            )

        # Build the command to generate documentation
        script_path = project_root / "scripts" / "generate_osrs_docs.py"
        cmd = [
            "python",
            str(script_path),
            f"--module={input_data.module_path}",
            f"--format={input_data.output_format}"
        ]

        if input_data.include_examples:
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
            "module_path": input_data.module_path,
            "output_format": input_data.output_format,
            "include_examples": input_data.include_examples,
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
    input_model=RunTestsInput
)
async def run_tests_tool(input_data: RunTestsInput) -> Dict[str, Any]:
    """Run tests for the specified module or entire project.

    Args:
        input_data: Input parameters for test execution

    Returns:
        Dict containing test execution results
    """
    try:
        project_root = Path("/workspaces/runerogue")

        # Build pytest command
        cmd = ["pytest"]

        # Add test path
        if input_data.test_path:
            # Validate the test path exists
            full_path = project_root / input_data.test_path
            if not full_path.exists():
                raise HTTPException(
                    status_code=400,
                    detail=f"Test path does not exist: {input_data.test_path}"
                )
            cmd.append(str(input_data.test_path))

        # Add markers if specified
        if input_data.markers and input_data.markers.strip():
            cmd.extend(["-m", input_data.markers])

        # Add verbose flag if requested
        if input_data.verbose:
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
            "test_path": input_data.test_path or "all",
            "markers": input_data.markers or "none",
            "verbose": input_data.verbose,
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
    input_model=RunLintingInput
)
async def run_linting_tool(input_data: RunLintingInput) -> Dict[str, Any]:
    """Run linting checks on the specified file or directory.

    Args:
        input_data: Input parameters for linting

    Returns:
        Dict containing linting results
    """
    try:
        project_root = Path("/workspaces/runerogue")

        # Determine the target path
        if input_data.file_path:
            # Validate the file path exists
            full_path = project_root / input_data.file_path
            if not full_path.exists():
                raise HTTPException(
                    status_code=400,
                    detail=f"File path does not exist: {input_data.file_path}"
                )
            target_path = input_data.file_path
        else:
            target_path = "."

        # First run flake8 to check for issues
        flake8_cmd = ["flake8", target_path]
        if input_data.output_format == "json":
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

        # If autofix is True and there are issues, run autopep8
        fix_output = ""
        fix_error = ""
        if input_data.autofix and not flake8_success:
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
            "file_path": input_data.file_path or "all",
            "autofix": input_data.autofix,
            "output_format": input_data.output_format,
            "issues": (
                flake8_output if not flake8_success
                else "No linting issues found"
            ),
            "output": flake8_output,
            "error": flake8_error if flake8_error else None,
            "fix_applied": input_data.autofix and not flake8_success,
            "fix_output": fix_output if input_data.autofix else None,
            "fix_error": fix_error if input_data.autofix and fix_error else None,
            "exit_code": result.returncode
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error running linting: {str(e)}"
        )
