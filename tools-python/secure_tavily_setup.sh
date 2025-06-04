#!/bin/bash
# Secure Tavily API Key Setup Script
# This script helps you set your Tavily API key without exposing it

echo "🔒 SECURE TAVILY API KEY SETUP"
echo "=============================="
echo ""
echo "This script will help you set your Tavily API key securely."
echo "Your API key will NOT be visible in terminal history or logs."
echo ""

# Method 1: Interactive secure input
echo "METHOD 1: Secure Interactive Setup"
echo "-----------------------------------"
echo "Run this command and paste your API key when prompted:"
echo ""
echo "read -s -p 'Enter your Tavily API key: ' TAVILY_API_KEY && export TAVILY_API_KEY && echo 'API key set securely!' && unset HISTFILE"
echo ""

# Method 2: .env file setup
echo "METHOD 2: .env File Setup"
echo "-------------------------"
echo "1. Create/edit your .env file:"
echo "   nano .env"
echo ""
echo "2. Add this line (replace YOUR_KEY with your actual key):"
echo "   TAVILY_API_KEY=YOUR_KEY_HERE"
echo ""
echo "3. Load the .env file:"
echo "   source .env"
echo ""

# Method 3: Direct export (for temporary testing)
echo "METHOD 3: Direct Export (Temporary)"
echo "-----------------------------------"
echo "export TAVILY_API_KEY='your-key-here'"
echo "(Replace 'your-key-here' with your actual key)"
echo ""

# Verification steps
echo "VERIFICATION STEPS:"
echo "==================="
echo "1. Test that the key is set (without showing the value):"
echo "   [ ! -z \"\$TAVILY_API_KEY\" ] && echo 'API key is set ✅' || echo 'API key is NOT set ❌'"
echo ""
echo "2. Test the Tavily MCP server:"
echo "   npx -y @mcptools/mcp-tavily --help"
echo ""
echo "3. Run the integration test:"
echo "   # Use the TAVILY_TEST_ISSUE.md to create a GitHub issue"
echo ""

echo "SECURITY REMINDERS:"
echo "==================="
echo "- Never commit .env files to git"
echo "- Your .env file is already in .gitignore"
echo "- API keys should never appear in chat, logs, or screenshots"
echo "- Regenerate keys if they're accidentally exposed"
