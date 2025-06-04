#!/usr/bin/env python3
"""
Test script to verify FastAPI MCP server endpoints.
"""

import sys
import os
import asyncio
import json
import traceback
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_server_endpoints():
    """Test the FastAPI server endpoints."""
    try:
        print("Setting up test client...")
        from fastapi.testclient import TestClient
        from agents.mcp.server import app
        
        client = TestClient(app)
        
        # Test health endpoint
        print("Testing health endpoint...")
        response = client.get("/health")
        print(f"Health response: {response.status_code} - {response.json()}")
        
        # Test tools list endpoint
        print("Testing tools list...")
        response = client.get("/tools")
        print(f"Tools response: {response.status_code}")
        if response.status_code == 200:
            tools = response.json()
            print(f"Available tools: {[tool['name'] for tool in tools]}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_server_endpoints())
    sys.exit(0 if success else 1)
