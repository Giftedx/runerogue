"""
OSRS Tools for the MCP Server.

This module provides tools for interacting with the OSRS agent system.
"""

import asyncio
from typing import Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field

from ..osrs_agent_system import user_proxy, manager, osrs_data_agent
from .server import Tool, ToolResult, ToolResultStatus


class ContentType(str, Enum):
    ITEM = "item"
    NPC = "npc"
    QUEST = "quest"
    MINIGAME = "minigame"
    AREA = "area"


class DataType(str, Enum):
    ITEM = "item"
    NPC = "npc"
    QUEST = "quest"
    MINIGAME = "minigame"
    AREA = "area"
    ANY = "any"


class OSRSDesignInput(BaseModel):
    content_type: ContentType = Field(
        ..., description="Type of content to design"
    )
    theme: str = Field(
        ..., description="Theme or name of the content to design"
    )
    requirements: Dict[str, Any] = Field(
        default_factory=dict,
        description="Any specific requirements for the design"
    )


class OSRSSearchInput(BaseModel):
    query: str = Field(..., description="Search query")
    data_type: DataType = Field(
        default=DataType.ANY,
        description="Type of data to search for"
    )
    limit: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum number of results to return"
    )


class OSRSDesignTool(Tool):
    """Tool for designing game content based on OSRS data."""
    
    def __init__(self):
        super().__init__(
            name="design_osrs_content",
            description="Design game content based on OSRS data",
            input_model=OSRSDesignInput
        )
    
    async def execute(self, input_data: OSRSDesignInput) -> ToolResult:
        """Execute the design tool."""
        try:
            content_type = input_data.content_type
            theme = input_data.theme
            requirements = input_data.requirements
            
            # Start a chat with the manager to design the content
            task = f"Design a new {content_type} with the theme: {theme}"
            if requirements:
                task += f"\nRequirements: {requirements}"
            
            # Start the chat asynchronously
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: user_proxy.initiate_chat(manager, message=task)
            )
            
            # Get the last message from the chat
            last_message = manager.chat_messages[user_proxy][-1]["content"]
            
            return ToolResult(
                status=ToolResultStatus.SUCCESS,
                output={
                    "design": last_message,
                    "content_type": content_type,
                    "theme": theme
                }
            )
            
        except Exception as e:
            return ToolResult(
                status=ToolResultStatus.ERROR,
                error=str(e)
            )


class OSRSSearchTool(Tool):
    """Tool for searching OSRS Wiki data."""
    
    def __init__(self):
        super().__init__(
            name="search_osrs_wiki",
            description="Search the OSRS Wiki for information",
            input_model=OSRSSearchInput
        )
    
    async def execute(self, input_data: OSRSSearchInput) -> ToolResult:
        """Execute the search tool."""
        try:
            query = input_data.query
            data_type = input_data.data_type
            # limit variable is used to construct the task message
            
            # Format the query for the data agent
            task = f"Find information about: {query}"
            if data_type != DataType.ANY:
                task += f" (type: {data_type})"
            
            # Start the chat asynchronously
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: user_proxy.initiate_chat(osrs_data_agent, message=task)
            )
            
            # Get the response from the data agent
            response = osrs_data_agent.chat_messages[user_proxy][-1]["content"]
            
            # Process the response (this is a simplified example)
            results = {
                "query": query,
                "results": response,
                # This would be the actual count in a real implementation
                "result_count": 1
            }
            
            return ToolResult(
                status=ToolResultStatus.SUCCESS,
                output=results
            )
            
        except Exception as e:
            return ToolResult(
                status=ToolResultStatus.ERROR,
                error=str(e)
            )


# Create and register the tools
osrs_design_tool = OSRSDesignTool()
osrs_search_tool = OSRSSearchTool()
