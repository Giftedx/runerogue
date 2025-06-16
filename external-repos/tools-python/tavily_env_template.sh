# Environment Variables for Tavily MCP Integration

# Required: Get your API key from https://app.tavily.com
# Copy this file to .env and add your actual API key
export TAVILY_API_KEY="your-tavily-api-key-here"

# Optional: Configure Tavily API settings
# TAVILY_MAX_RESULTS=25
# TAVILY_SEARCH_DEPTH=advanced
# TAVILY_TIMEOUT=30

# Test command to verify your API key works:
# npx -y @mcptools/mcp-tavily --help

# Quick test search (replace YOUR_KEY with actual key):
# export TAVILY_API_KEY="YOUR_KEY" && npx -y @mcptools/mcp-tavily

echo "Tavily environment variables configured!"
echo "Next steps:"
echo "1. Get your API key from https://app.tavily.com"
echo "2. Replace 'your-tavily-api-key-here' with your actual key"
echo "3. Source this file: source tavily_env_template.sh"
echo "4. Test the integration using TAVILY_TEST_ISSUE.md"
