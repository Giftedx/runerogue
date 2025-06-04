#!/usr/bin/env python3
"""
Minimal test to check MCP server imports.
"""

import sys
import os
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test imports step by step."""
    try:
        print("Testing server module...")
        from agents.mcp.server import ToolResultStatus
        print(f"✓ ToolResultStatus.SUCCESS = {ToolResultStatus.SUCCESS}")
        print(f"✓ ToolResultStatus.ERROR = {ToolResultStatus.ERROR}")
        
        print("\nTesting development tools...")
        from agents.mcp import development_tools
        print("✓ Development tools module imported")
        
        print("\nTesting server registration...")
        from agents.mcp.server import server
        print(f"✓ Server has {len(server.tools)} tools registered")
        for tool_name in server.tools.keys():
            print(f"  - {tool_name}")
            
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)
