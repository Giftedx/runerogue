"""
Test script for the MCP server.

This script tests the MCP server's functionality, including authentication
and tool execution.
"""

import asyncio
import json
import time
from typing import Dict, Any

import httpx
import pytest
from fastapi.testclient import TestClient

from .server import app, server, Tool, ToolResult, ToolResultStatus
from .tools import OSRSDataTool

# Test client
client = TestClient(app)

# Test data
TEST_USERNAME = "admin"
TEST_PASSWORD = "admin"


def get_auth_headers() -> Dict[str, str]:
    """Get authentication headers with a valid token."""
    response = client.post(
        "/mcp/token",
        data={"username": TEST_USERNAME, "password": TEST_PASSWORD},
        headers={"content-type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/mcp/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "tools_registered" in data


def test_list_tools():
    """Test listing available tools."""
    headers = get_auth_headers()
    response = client.get("/mcp/tools", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["tools"], list)
    assert any(tool["name"] == "get_osrs_data" for tool in data["tools"])


def test_execute_tool():
    """Test executing a tool."""
    headers = get_auth_headers()
    
    # Test with valid input
    response = client.post(
        "/mcp/tools/echo",
        headers=headers,
        json={"message": "test"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["output"] == "test"
    
    # Test with invalid tool
    response = client.post(
        "/mcp/tools/invalid_tool",
        headers=headers,
        json={"param": "value"},
    )
    assert response.status_code == 404


def test_authentication():
    """Test authentication requirements."""
    # Test without token
    response = client.get("/mcp/tools")
    assert response.status_code == 401
    
    # Test with invalid token
    response = client.get(
        "/mcp/tools",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401


class TestOSRSDataTool:
    """Test the OSRS data tool."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.tool = OSRSDataTool()
        self.valid_input = {"item_name": "rune scimitar"}
        self.invalid_input = {}
    
    @pytest.mark.asyncio
    async def test_execute_success(self):
        """Test successful execution of the OSRS data tool."""
        result = await self.tool.execute(self.valid_input)
        assert result.status == ToolResultStatus.SUCCESS
        assert "item" in result.output
        assert result.output["item"] == "rune scimitar"
    
    @pytest.mark.asyncio
    async def test_execute_missing_parameter(self):
        """Test execution with missing parameter."""
        result = await self.tool.execute(self.invalid_input)
        assert result.status == ToolResultStatus.SUCCESS  # Should this be an error?
        assert result.output is not None
        assert result.output["item"] == ""


if __name__ == "__main__":
    # Run tests
    import sys
    import pytest
    sys.exit(pytest.main([__file__] + sys.argv[1:]))
