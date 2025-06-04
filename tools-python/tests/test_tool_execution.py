#!/usr/bin/env python3
"""
Test script to verify MCP tool execution.
"""

import sys
import os
import asyncio
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_tool_execution():
    """Test executing a development tool."""
    try:
        print("Testing tool execution...")
        from agents.mcp.server import server
        from agents.mcp.development_tools import RunLintingInput
        
        # Test the run_linting tool
        tool = server.tools.get("run_linting")
        if not tool:
            print("✗ run_linting tool not found")
            return False
            
        print(f"✓ Found tool: {tool.name}")
        
        # Create test input
        test_input = RunLintingInput(
            file_path="agents/mcp/server.py",
            linter="flake8",
            autofix=False
        )
        
        print(f"✓ Created test input: {test_input}")
        
        # Execute the tool
        print("Executing tool...")
        result = await tool.func(test_input)
        
        print(f"✓ Tool executed successfully")
        print(f"Result type: {type(result)}")
        if isinstance(result, dict):
            print(f"Success: {result.get('success')}")
            if result.get('error'):
                print(f"Error: {result.get('error')}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_tool_execution())
    sys.exit(0 if success else 1)
