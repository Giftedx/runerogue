"""
MCP Server entry point.

This module provides the main entry point for the MCP server.
"""

import argparse
import uvicorn

from .server import app, server
from . import tools  # Import tools to register them with the server


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="RuneRogue MCP Server")
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host to bind the server to"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind the server to"
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload for development"
    )
    return parser.parse_args()


def main():
    """Run the MCP server."""
    args = parse_args()
    
    print(f"Starting RuneRogue MCP Server on {args.host}:{args.port}")
    print("Available tools:")
    for tool_name in server.tools.keys():
        print(f"  - {tool_name}")
    
    uvicorn.run(
        "agents.mcp.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )


if __name__ == "__main__":
    main()
