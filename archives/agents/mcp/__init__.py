"""
Model Context Protocol (MCP) implementation for RuneRogue.

This module provides the core functionality for the MCP server that enables
GitHub Copilot Agents to interact with RuneRogue's tooling and services.
"""

__version__ = "0.1.0"

# Import core components
from .server import MCPServer, Tool, ToolResult  # noqa
