"""
Test script for the MCP server's OSRS tools.

This script tests the OSRS-specific tools registered with the MCP server.
"""

import asyncio
import json
import os
import sys
from typing import Dict, Any

import httpx
import pytest
from fastapi.testclient import TestClient

# Add the parent directory to the path so we can import from agents
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.mcp.server import app, server
from agents.mcp.tools import osrs_design_tool, osrs_search_tool

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
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


class TestOSRSTools:
    """Test suite for OSRS tools."""

    def test_osrs_search_tool(self):
        """Test the OSRS search tool."""
        headers = get_auth_headers()
        
        # Test with a valid query
        response = client.post(
            "/mcp/tools/search_osrs_wiki",
            headers=headers,
            json={"query": "Dragon scimitar", "data_type": "item"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "results" in data["output"]
        assert data["output"]["query"] == "Dragon scimitar"

    def test_osrs_design_tool(self):
        """Test the OSRS design tool."""
        headers = get_auth_headers()
        
        # Test with a valid design request
        response = client.post(
            "/mcp/tools/design_osrs_content",
            headers=headers,
            json={
                "content_type": "item",
                "theme": "Dragon scimitar",
                "requirements": {
                    "combat_level": 60,
                    "quest_requirement": "Monkey Madness I"
                }
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "design" in data["output"]
        assert data["output"]["content_type"] == "item"
        assert data["output"]["theme"] == "Dragon scimitar"


if __name__ == "__main__":
    # Run tests
    import pytest
    sys.exit(pytest.main(["-v", __file__]))
