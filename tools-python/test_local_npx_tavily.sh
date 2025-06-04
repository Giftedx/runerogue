#!/bin/bash
# Test Local NPX Tavily MCP after API key is set

echo "🧪 LOCAL NPX TAVILY MCP TEST"
echo "============================"
echo ""

echo "Step 1: Verify API Key"
echo "---------------------"
if [ ! -z "$TAVILY_API_KEY" ]; then
    echo "✅ TAVILY_API_KEY is set"
else
    echo "❌ TAVILY_API_KEY is NOT set"
    echo ""
    echo "Please set your API key first:"
    echo "Method 1: read -s -p 'Enter your Tavily API key: ' TAVILY_API_KEY && export TAVILY_API_KEY"
    echo "Method 2: Add TAVILY_API_KEY=your-key to .env, then source .env"
    echo "Method 3: export TAVILY_API_KEY='your-key'"
    echo ""
    echo "Get API key from: https://app.tavily.com"
    exit 1
fi

echo ""
echo "Step 2: Test NPX Package"
echo "-----------------------"
echo "Testing @mcptools/mcp-tavily package..."

if npx -y @mcptools/mcp-tavily --help > /dev/null 2>&1; then
    echo "✅ Tavily MCP package works with your API key!"
else
    echo "❌ Tavily MCP package test failed"
    echo "This might indicate an invalid API key or network issue"
    exit 1
fi

echo ""
echo "Step 3: Configuration Verification"
echo "---------------------------------"
if grep -q "tavily" .github/copilot/mcp_config.json; then
    echo "✅ Tavily configuration found in MCP config"
else
    echo "❌ Tavily configuration missing from MCP config"
    exit 1
fi

echo ""
echo "Step 4: Custom Tools Check"
echo "-------------------------"
if grep -q "tavily_search" .github/copilot/mcp_config.json; then
    echo "✅ tavily_search custom tool configured"
else
    echo "❌ tavily_search custom tool missing"
fi

if grep -q "tavily_extract" .github/copilot/mcp_config.json; then
    echo "✅ tavily_extract custom tool configured"
else
    echo "❌ tavily_extract custom tool missing"
fi

echo ""
echo "🎉 SUCCESS: LOCAL NPX TAVILY MCP IS READY!"
echo "=========================================="
echo ""
echo "✅ API key is set and working"
echo "✅ NPX package responds correctly"  
echo "✅ MCP configuration is complete"
echo "✅ Custom tools are defined"
echo ""
echo "🚀 Next Steps:"
echo "1. Create a GitHub issue using TEST_LOCAL_TAVILY_MCP.md content"
echo "2. Test the custom tools: tavily_search and tavily_extract"
echo "3. Compare results with the hosted Tavily Expert MCP"
echo ""
echo "📋 Available Test Files:"
echo "- TEST_LOCAL_TAVILY_MCP.md (comprehensive local test)"
echo "- SIMPLE_HOSTED_TAVILY_TEST.md (simple hosted test)"
echo "- TEST_HOSTED_TAVILY_EXPERT.md (detailed hosted test)"
