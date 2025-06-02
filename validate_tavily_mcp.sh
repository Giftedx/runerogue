#!/bin/bash

echo "🧪 TAVILY MCP VALIDATION SCRIPT"
echo "==============================="
echo ""

# Phase 1: Hosted Tavily Expert MCP Validation
echo "📋 Phase 1: Hosted Tavily Expert MCP"
echo "-----------------------------------"

echo "1.1 Configuration Check:"
if [ -f ~/.github/copilot/mcp.json ]; then
    echo "✅ Configuration file exists"
    if python3 -m json.tool ~/.github/copilot/mcp.json > /dev/null 2>&1; then
        echo "✅ Configuration JSON is valid"
    else
        echo "❌ Configuration JSON is invalid"
    fi
else
    echo "❌ Configuration file missing: ~/.github/copilot/mcp.json"
fi

echo ""
echo "1.2 Network Connectivity:"
HTTP_STATUS=$(curl -s -I https://tavily.api.tadata.com/mcp/tavily/pan-melon-carabao-g8m9ge | head -1 | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "405" ]; then
    echo "✅ Hosted service is responding (HTTP 405 expected)"
else
    echo "❌ Hosted service issue (HTTP $HTTP_STATUS)"
fi

echo ""
echo "1.3 Hosted Expert Status:"
if [ -f ~/.github/copilot/mcp.json ] && [ "$HTTP_STATUS" = "405" ]; then
    echo "🟢 HOSTED TAVILY EXPERT: READY FOR TESTING"
    echo "   Next: Create GitHub issue using SIMPLE_HOSTED_TAVILY_TEST.md"
    echo "   Remember: Restart GitHub Copilot first"
else
    echo "🔴 HOSTED TAVILY EXPERT: NEEDS FIXING"
fi

echo ""
echo "==============================="

# Phase 2: Local NPX Tavily MCP Validation  
echo "📋 Phase 2: Local NPX Tavily MCP"
echo "--------------------------------"

echo "2.1 Configuration Check:"
if [ -f .github/copilot/mcp_config.json ]; then
    echo "✅ Configuration file exists"
    if grep -q "tavily" .github/copilot/mcp_config.json; then
        echo "✅ Tavily configuration found"
    else
        echo "❌ Tavily configuration missing"
    fi
else
    echo "❌ Configuration file missing: .github/copilot/mcp_config.json"
fi

echo ""
echo "2.2 Dependencies Check:"
if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js available: $NODE_VERSION"
else
    echo "❌ Node.js not found"
fi

if command -v npx > /dev/null 2>&1; then
    echo "✅ NPX available"
else
    echo "❌ NPX not found"
fi

echo ""
echo "2.3 API Key Check:"
if [ ! -z "$TAVILY_API_KEY" ]; then
    echo "✅ TAVILY_API_KEY is set"
    echo "2.4 Package Test:"
    if npx -y @mcptools/mcp-tavily --help > /dev/null 2>&1; then
        echo "✅ Tavily MCP package works"
    else
        echo "❌ Tavily MCP package test failed"
    fi
else
    echo "❌ TAVILY_API_KEY is NOT set"
    echo ""
    echo "🔧 TO FIX: Set your API key using one of these methods:"
    echo "   Method 1 (Secure): read -s -p 'Enter Tavily API key: ' TAVILY_API_KEY && export TAVILY_API_KEY"
    echo "   Method 2 (.env):   Add TAVILY_API_KEY=your-key to .env file, then source .env"
    echo "   Method 3 (Quick):  export TAVILY_API_KEY='your-key-here'"
    echo ""
    echo "   Get API key from: https://app.tavily.com"
fi

echo ""
echo "2.5 Local NPX Status:"
if [ -f .github/copilot/mcp_config.json ] && command -v npx > /dev/null 2>&1 && [ ! -z "$TAVILY_API_KEY" ]; then
    echo "🟢 LOCAL NPX TAVILY: READY FOR TESTING"
    echo "   Next: Create GitHub issue using TEST_LOCAL_TAVILY_MCP.md"
elif [ -z "$TAVILY_API_KEY" ]; then
    echo "🟡 LOCAL NPX TAVILY: NEEDS API KEY"
    echo "   Fix: Set TAVILY_API_KEY environment variable"
else
    echo "🔴 LOCAL NPX TAVILY: NEEDS FIXING"
fi

echo ""
echo "==============================="
echo "📊 SUMMARY"
echo "=========="

# Overall status
HOSTED_READY=false
LOCAL_READY=false

if [ -f ~/.github/copilot/mcp.json ] && [ "$HTTP_STATUS" = "405" ]; then
    HOSTED_READY=true
fi

if [ -f .github/copilot/mcp_config.json ] && command -v npx > /dev/null 2>&1 && [ ! -z "$TAVILY_API_KEY" ]; then
    LOCAL_READY=true
fi

if [ "$HOSTED_READY" = true ] && [ "$LOCAL_READY" = true ]; then
    echo "🎉 BOTH SETUPS READY! You can test and compare both approaches."
elif [ "$HOSTED_READY" = true ]; then
    echo "🚀 HOSTED SETUP READY! Start testing with SIMPLE_HOSTED_TAVILY_TEST.md"
    echo "🔧 LOCAL SETUP: Needs API key setup"
elif [ "$LOCAL_READY" = true ]; then
    echo "🚀 LOCAL SETUP READY! Start testing with TEST_LOCAL_TAVILY_MCP.md"
    echo "🔧 HOSTED SETUP: Check configuration"
else
    echo "🔧 BOTH SETUPS NEED FIXES - Follow the guidance above"
fi

echo ""
echo "📋 Test Files Available:"
echo "   - SIMPLE_HOSTED_TAVILY_TEST.md (for hosted setup)"
echo "   - TEST_LOCAL_TAVILY_MCP.md (for local setup)"
echo "   - TEST_HOSTED_TAVILY_EXPERT.md (detailed hosted test)"
echo ""
echo "🎯 Remember: Restart GitHub Copilot after configuration changes!"
