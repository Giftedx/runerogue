#!/usr/bin/env python3
"""
Run the MCP server with a sample configuration.

This script starts the MCP server with some example tools and configuration.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = str(Path(__file__).parent.absolute())
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from agents.mcp.server import server, Tool, ToolResult, ToolResultStatus
from agents.mcp.tools import OSRSDataTool

# Configure logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Import and register tools
logger.info("Registering tools...")
osrs_tool = OSRSDataTool()
server.register_tool(osrs_tool)

# Add some example tools
@server.tool(
    name="get_weather",
    description="Get the current weather for a location",
    parameters={
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "City and optional country code (e.g., 'London,UK')"
            }
        },
        "required": ["location"]
    }
)
async def get_weather(location: str) -> dict:
    """Get the current weather for a location."""
    # This is a mock implementation
    return {
        "location": location,
        "temperature": 22.5,
        "conditions": "sunny",
        "humidity": 0.6,
        "wind_speed": 5.2,
        "unit": "celsius"
    }

# Add a more complex example tool
class CalculatorTool(Tool):
    """A simple calculator tool."""
    
    def __init__(self):
        super().__init__(
            name="calculator",
            description="Perform basic arithmetic calculations",
            parameters={
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Mathematical expression to evaluate (e.g., '2 + 2 * 3')"
                    }
                },
                "required": ["expression"]
            }
        )
    
    async def execute(self, input_data: dict) -> ToolResult:
        try:
            # WARNING: Using eval() is generally unsafe and should be avoided in production
            # This is just for demonstration purposes
            result = eval(input_data["expression"], {"__builtins__": None}, {})
            return ToolResult(
                status=ToolResultStatus.SUCCESS,
                output={"result": result},
                error=None,
                execution_time_ms=0.0
            )
        except Exception as e:
            return ToolResult(
                status=ToolResultStatus.ERROR,
                output=None,
                error=str(e),
                execution_time_ms=0.0
            )

# Register the calculator tool
calculator_tool = CalculatorTool()
server.register_tool(calculator_tool)

if __name__ == "__main__":
    import uvicorn
    
    # Print available endpoints
    print("\nAvailable endpoints:")
    print("  GET    /mcp/health     - Health check")
    print("  POST   /mcp/token     - Get authentication token")
    print("  GET    /mcp/tools     - List available tools")
    print("  POST   /mcp/tools/{name} - Execute a tool")
    print("  GET    /mcp/info      - Get server info")
    
    print("\nTest credentials:")
    print(f"  Username: admin")
    print(f"  Password: admin")
    
    print("\nStarting MCP server...")
    uvicorn.run(
        "agents.mcp.server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
