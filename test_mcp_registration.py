#!/usr/bin/env python3
"""
Test script to verify MCP server tool registration.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_mcp_tools():
    """Test that the MCP server has all required tools registered."""
    try:
        print("1. Testing server import...")
        from agents.mcp.server import server, app
        print("   ✓ Server imported successfully")
        
        print("2. Testing development tools import...")
        from agents.mcp.development_tools import generate_docs_tool
        print("   ✓ Development tools imported successfully")
        
        print("3. Testing complete tools import...")
        from agents.mcp import tools
        print("   ✓ Tools module imported successfully")
        
        print(f"\n4. Registered tools: {list(server.tools.keys())}")
        
        # Check for the critical tools
        critical_tools = ['generate_docs', 'run_tests', 'run_linting']
        missing_tools = []
        
        for tool_name in critical_tools:
            if tool_name in server.tools:
                print(f"   ✓ {tool_name} is registered")
            else:
                print(f"   ✗ {tool_name} is missing")
                missing_tools.append(tool_name)
        
        # Test existing tools
        existing_tools = ['echo', 'add_numbers', 'get_osrs_data']
        for tool_name in existing_tools:
            if tool_name in server.tools:
                print(f"   ✓ {tool_name} is registered")
            else:
                print(f"   ✗ {tool_name} is missing")
        
        if missing_tools:
            print(f"\n❌ MISSING CRITICAL TOOLS: {missing_tools}")
            return False
        else:
            print(f"\n✅ All critical tools are registered: {critical_tools}")
            return True
            
    except Exception as e:
        import traceback
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_mcp_tools()
    sys.exit(0 if success else 1)
