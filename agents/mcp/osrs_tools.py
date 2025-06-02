"""
OSRS Tools for the MCP Server.

This module provides tools for interacting with the OSRS agent system.
"""

import asyncio
from typing import Dict, Any, Optional

from fastapi import HTTPException

from ..osrs_agent_system import user_proxy, manager, osrs_data_agent, game_design_agent
from .server import Tool, ToolResult, ToolResultStatus


class OSRSDesignTool(Tool):
    """Tool for designing game content based on OSRS data."""
    
    def __init__(self):
        super().__init__(
            name="design_osrs_content",
            description="Design game content based on OSRS data",
            parameters={
                "type": "object",
                "properties": {
                    "content_type": {
                        "type": "string",
                        "enum": ["item", "npc", "quest", "minigame", "area"],
                        "description": "Type of content to design"
                    },
                    "theme": {
                        "type": "string",
                        "description": "Theme or name of the content to design"
                    },
                    "requirements": {
                        "type": "object",
                        "description": "Any specific requirements for the design",
                        "default": {}
                    }
                },
                "required": ["content_type", "theme"]
            }
        )
    
    async def execute(self, input_data: Dict[str, Any]) -> ToolResult:
        """Execute the design tool."""
        try:
            content_type = input_data.get("content_type")
            theme = input_data.get("theme")
            requirements = input_data.get("requirements", {})
            
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
            parameters={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "data_type": {
                        "type": "string",
                        "enum": ["item", "npc", "quest", "minigame", "area", "any"],
                        "description": "Type of data to search for",
                        "default": "any"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results to return",
                        "default": 5,
                        "minimum": 1,
                        "maximum": 20
                    }
                },
                "required": ["query"]
            }
        )
    
    async def execute(self, input_data: Dict[str, Any]) -> ToolResult:
        """Execute the search tool."""
        try:
            query = input_data.get("query")
            data_type = input_data.get("data_type", "any")
            limit = input_data.get("limit", 5)
            
            # Format the query for the data agent
            task = f"Find information about: {query}"
            if data_type != "any":
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
                "result_count": 1  # This would be the actual count in a real implementation
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
