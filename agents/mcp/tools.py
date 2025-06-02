"""
Tools for the MCP server.

This module contains tools that can be used with the MCP server,
including both example tools and OSRS-specific tools.
"""

from typing import Dict
from pydantic import BaseModel

from .server import Tool, ToolResult, ToolResultStatus
from .server import tool, server

# Import OSRS tools
from .osrs_tools import osrs_design_tool, osrs_search_tool

# Import development tools (this will register them via decorators)
from . import development_tools  # noqa: F401


# Define Pydantic models for tool inputs
class EchoToolInput(BaseModel):
    message: str


class AddNumbersToolInput(BaseModel):
    a: float
    b: float


@tool(
    name="echo",
    description="Echo the input back to the caller",
    input_model=EchoToolInput,
)
async def echo_tool(input_data: EchoToolInput) -> str:
    """Echo the input message back to the caller.

    Args:
        input_data: The input data containing the message to echo back

    Returns:
        str: The same message that was passed in
    """
    return input_data.message


@tool(
    name="add_numbers",
    description="Add two numbers together",
    input_model=AddNumbersToolInput,
)
async def add_numbers(
    input_data: AddNumbersToolInput
) -> Dict[str, float]:
    """Add two numbers together.

    Args:
        input_data: The input data containing the numbers to add

    Returns:
        Dict[str, float]: Dictionary containing the sum of a and b
    """
    return {"result": input_data.a + input_data.b}


class OSRSDataToolInput(BaseModel):
    item_name: str


class OSRSDataTool(Tool):
    """Tool for retrieving OSRS data."""

    def __init__(self):
        super().__init__(
            name="get_osrs_data",
            description="Retrieve data from the OSRS Wiki",
            input_model=OSRSDataToolInput,
        )

    async def execute(
        self, input_data: OSRSDataToolInput
    ) -> ToolResult:
        """Execute the OSRS data lookup."""
        try:
            # This is a placeholder implementation
            # In a real implementation, this would call the OSRS Wiki API
            item_name = input_data.item_name
            result = {
                "item": item_name,
                "price": 12345,
                "members": True,
                "tradeable": True,
            }
            return ToolResult(
                status=ToolResultStatus.SUCCESS,
                output=result,
                error=None,
                execution_time_ms=0.0,  # Calculated in real implementation
            )
        except Exception as e:
            return ToolResult(
                status=ToolResultStatus.ERROR,
                output=None,
                error=str(e),
                execution_time_ms=0.0,
            )


# Register the OSRS data tool with the server
osrs_data_tool = OSRSDataTool()
server.register_tool(osrs_data_tool)

# Register additional OSRS tools
server.register_tool(osrs_design_tool)
server.register_tool(osrs_search_tool)
