"""
MCP Server implementation for RuneRogue.

This module implements the Model Context Protocol (MCP) server that enables
GitHub Copilot Agents to interact with RuneRogue's tooling and services.
"""

import json
import logging
import os
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Type, Union, Callable

from fastapi import FastAPI, HTTPException, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field

from .auth import (
    Token,
    User,
    authenticate_user,
    create_access_token,
    get_current_active_user,
    fake_users_db,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
    ALGORITHM,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Type aliases
ToolName = str
ToolInput = Dict[str, Any]
ToolOutput = Dict[str, Any]


class ToolResultStatus(str, Enum):
    """Status of a tool execution."""
    SUCCESS = "success"
    ERROR = "error"
    PENDING = "pending"


class ToolResult(BaseModel):
    """Result of a tool execution."""
    status: ToolResultStatus = Field(..., description="Status of the tool execution")
    output: Optional[Any] = Field(None, description="Output of the tool execution")
    error: Optional[str] = Field(None, description="Error message if the tool execution failed")
    execution_time_ms: Optional[float] = Field(None, description="Execution time in milliseconds")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Tool(BaseModel):
    """Base class for MCP tools."""
    name: str = Field(..., description="Name of the tool")
    description: str = Field(..., description="Description of the tool")
    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="JSON schema for the tool's input parameters"
    )

    async def execute(self, input_data: ToolInput) -> ToolResult:
        """Execute the tool with the given input.
        
        Args:
            input_data: Input data for the tool
            
        Returns:
            ToolResult: Result of the tool execution
        """
        raise NotImplementedError("Subclasses must implement this method")


class MCPServer:
    """MCP Server implementation."""
    
    def __init__(self, title: str = "RuneRogue MCP Server", version: str = "0.1.0"):
        """Initialize the MCP server.
        
        Args:
            title: Title of the MCP server
            version: Version of the MCP server
        """
        self.title = title
        self.version = version
        self.app = FastAPI(title=title, version=version)
        self.tools: Dict[ToolName, Tool] = {}
        
        # Configure CORS
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Add exception handlers
        self.app.add_exception_handler(HTTPException, self._http_exception_handler)
        self.app.add_exception_handler(Exception, self._unhandled_exception_handler)
        
        # Register routes
        self._register_routes()
    
    def _register_routes(self) -> None:
        """Register API routes."""
        # Public routes
        self.app.post("/mcp/token", response_model=Token)(self.login_for_access_token)
        self.app.get("/mcp/health")(self.health_check)
        
        # Protected routes
        self.app.get("/mcp/tools", dependencies=[Depends(get_current_active_user)])(self.list_tools)
        self.app.post(
            "/mcp/tools/{tool_name}", 
            dependencies=[Depends(get_current_active_user)]
        )(self.execute_tool)
        self.app.get(
            "/mcp/info", 
            dependencies=[Depends(get_current_active_user)]
        )(self.get_server_info)
    
    def register_tool(self, tool: Tool) -> None:
        """Register a tool with the MCP server.
        
        Args:
            tool: Tool to register
            
        Raises:
            ValueError: If a tool with the same name is already registered
        """
        if tool.name in self.tools:
            raise ValueError(f"Tool with name '{tool.name}' is already registered")
        self.tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")
    
    def tool(self, name: str, description: str = "", **kwargs):
        """Decorator to register a tool function.
        
        Args:
            name: Name of the tool
            description: Description of the tool
            **kwargs: Additional keyword arguments for the tool
            
        Returns:
            callable: Decorator function
        """
        def decorator(func):
            class ToolWrapper(Tool):
                def __init__(self):
                    super().__init__(
                        name=name,
                        description=description or func.__doc__ or "",
                        parameters=kwargs.get("parameters", {})
                    )
                
                async def execute(self, input_data: ToolInput) -> ToolResult:
                    try:
                        start_time = datetime.now(timezone.utc)
                        result = await func(**input_data)
                        end_time = datetime.now(timezone.utc)
                        return ToolResult(
                            status=ToolResultStatus.SUCCESS,
                            output=result,
                            execution_time_ms=(end_time - start_time).total_seconds() * 1000
                        )
                    except Exception as e:
                        logger.exception(f"Error executing tool {name}")
                        return ToolResult(
                            status=ToolResultStatus.ERROR,
                            error=str(e)
                        )
            
            self.register_tool(ToolWrapper())
            return func
        
        return decorator
    
    async def login_for_access_token(self, form_data: OAuth2PasswordRequestForm = Depends()) -> Token:
        """OAuth2 compatible token login, get an access token for future requests."""
        user = await authenticate_user(fake_users_db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return Token(access_token=access_token, token_type="bearer")

    async def health_check(self) -> Dict[str, Any]:
        """Health check endpoint."""
        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tools_registered": len(self.tools),
            "auth_required": True
        }
    
    async def list_tools(self) -> Dict[str, Any]:
        """List all registered tools."""
        return {
            "tools": [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.parameters
                }
                for tool in self.tools.values()
            ]
        }
    
    async def execute_tool(self, tool_name: str, input_data: ToolInput) -> Dict[str, Any]:
        """Execute a tool.
        
        Args:
            tool_name: Name of the tool to execute
            input_data: Input data for the tool
            
        Returns:
            Dict[str, Any]: Tool execution result
            
        Raises:
            HTTPException: If the tool is not found or execution fails
        """
        if tool_name not in self.tools:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tool '{tool_name}' not found"
            )
        
        tool = self.tools[tool_name]
        logger.info(f"Executing tool: {tool_name} with input: {input_data}")
        
        try:
            result = await tool.execute(input_data)
            return result.dict()
        except Exception as e:
            logger.exception(f"Error executing tool {tool_name}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error executing tool: {str(e)}"
            )
    
    async def get_server_info(self) -> Dict[str, Any]:
        """Get server information."""
        return {
            "name": self.title,
            "version": self.version,
            "tools_available": list(self.tools.keys()),
            "status": "running"
        }
    
    async def _http_exception_handler(self, request: Request, exc: HTTPException) -> JSONResponse:
        """Handle HTTP exceptions."""
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail}
        )
    
    async def _unhandled_exception_handler(self, request: Request, exc: Exception) -> JSONResponse:
        """Handle unhandled exceptions."""
        logger.exception("Unhandled exception")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Internal server error"}
        )
    
    def get_app(self) -> FastAPI:
        """Get the FastAPI application instance."""
        return self.app


# Create a default server instance
server = MCPServer(title="RuneRogue MCP Server", version="0.1.0")

# Re-export the server instance and decorators
app = server.get_app()
tool = server.tool
register_tool = server.register_tool
