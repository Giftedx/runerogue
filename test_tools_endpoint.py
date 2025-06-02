#!/usr/bin/env python3
"""
Test the new /tools endpoint to verify it lists available tools.
"""

import requests
import json
import sys

def test_tools_endpoint():
    """Test the /tools endpoint functionality."""
    
    print("Testing MCP Server /tools endpoint...")
    
    # First, get an access token
    print("1. Getting access token...")
    token_response = requests.post(
        "http://localhost:8000/token",
        data={"username": "admin", "password": "secret"},  # Changed password
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if token_response.status_code != 200:
        print(f"❌ Failed to get token: {token_response.status_code}")
        print(f"Response: {token_response.text}")
        return False
    
    token_data = token_response.json()
    access_token = token_data["access_token"]
    print(f"✅ Got access token: {access_token[:20]}...")
    
    # Test the /tools endpoint
    print("\n2. Testing /tools endpoint...")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    tools_response = requests.get(
        "http://localhost:8000/tools",  # Changed port to 8000
        headers=headers
    )
    
    if tools_response.status_code != 200:
        print(f"❌ Failed to get tools: {tools_response.status_code}")
        print(f"Response: {tools_response.text}")
        return False
    
    tools_data = tools_response.json()
    print("✅ Successfully got tools list")
    print(f"📋 Number of tools: {tools_data.get('total_count', 0)}")
    
    # Print tool details
    if "tools" in tools_data:
        print("\n📝 Available tools:")
        for tool_item in tools_data["tools"]:
            print(f"  - {tool_item['name']}: {tool_item['description']}")
            if 'parameters' in tool_item:
                parameters_json = json.dumps(tool_item['parameters'], indent=6)
                print(f"    Parameters: {parameters_json}")
            print()
    
    return True


if __name__ == "__main__":
    try:
        success = test_tools_endpoint()
        if success:
            print("\n🎉 All tests passed!")
            sys.exit(0)
        else:
            print("\n❌ Tests failed!")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Test error: {e}")
        sys.exit(1)
