"""
Tools for the MCP server.

This module contains tools that can be used with the MCP server,
including both example tools and OSRS-specific tools.
"""

from typing import Dict, Any

from fastapi import HTTPException

from .server import Tool, ToolResult, ToolResultStatus
from .server import tool, server

# Import OSRS tools
from .osrs_tools import osrs_design_tool, osrs_search_tool


@tool(
    name="echo",
    description="Echo the input back to the caller",
    parameters={
        "type": "object",
        "properties": {
            "message": {
                "type": "string",
                "description": "The message to echo back"
            }
        },
        "required": ["message"]
    }
)
async def echo_tool(message: str) -> str:
    """Echo the input message back to the caller.
    
    Args:
        message: The message to echo back
        
    Returns:
        str: The same message that was passed in
    """
    return message


@tool(
    name="add_numbers",
    description="Add two numbers together",
    parameters={
        "type": "object",
        "properties": {
            "a": {
                "type": "number",
                "description": "First number"
            },
            "b": {
                "type": "number",
                "description": "Second number"
            }
        },
        "required": ["a", "b"]
    }
)
async def add_numbers(a: float, b: float) -> Dict[str, float]:
    """Add two numbers together.
    
    Args:
        a: First number
        b: Second number
        
    Returns:
        Dict[str, float]: Dictionary containing the sum of a and b
    """
    return {"result": a + b}


class OSRSDataTool(Tool):
    """Tool for retrieving OSRS data."""
    
    def __init__(self):
        super().__init__(
            name="get_osrs_data",
            description="Retrieve data from the OSRS Wiki",
            parameters={
                "type": "object",
                "properties": {
                    "item_name": {
                        "type": "string",
                        "description": "Name of the OSRS item to look up"
                    }
                },
                "required": ["item_name"]
            }
        )
    
    async def execute(self, input_data: Dict[str, Any]) -> ToolResult:
        """Execute the OSRS data lookup."""
        try:
            # This is a placeholder implementation
            # In a real implementation, this would call the OSRS Wiki API
            item_name = input_data.get("item_name", "")
            result = {
                "item": item_name,
                "price": 12345,
                "members": True,
                "tradeable": True
            }
            return ToolResult(
                status=ToolResultStatus.SUCCESS,
                output=result,
                error=None,
                execution_time_ms=0.0  # This would be calculated in a real implementation
            )
        except Exception as e:
            return ToolResult(
                status=ToolResultStatus.ERROR,
                output=None,
                error=str(e),
                execution_time_ms=0.0
            )


# Register the OSRS data tool with the server
osrs_data_tool = OSRSDataTool()
server.register_tool(osrs_data_tool)

# Register additional OSRS tools
server.register_tool(osrs_design_tool)
server.register_tool(osrs_search_tool)
