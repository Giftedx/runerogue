#!/bin/bash
# Advanced MCP Research Setup for RuneRogue
# This script sets up a multi-modal research ecosystem

echo "🚀 ADVANCED RESEARCH ECOSYSTEM SETUP"
echo "====================================="
echo ""
echo "Setting up multiple MCP servers for comprehensive research capabilities:"
echo "1. ✅ Tavily Expert (already configured)"
echo "2. 🔬 GPT Researcher MCP"
echo "3. 🕷️ Firecrawl MCP"
echo "4. 📝 OSRS Research Prompts"
echo ""

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p ~/research-ecosystem
mkdir -p ~/research-ecosystem/gpt-researcher
mkdir -p ~/research-ecosystem/firecrawl
mkdir -p ~/research-ecosystem/prompts
mkdir -p ~/research-ecosystem/configs

echo "✅ Directory structure created"
echo ""

echo "🔬 GPT RESEARCHER MCP SETUP"
echo "============================"
echo ""
echo "To set up GPT Researcher MCP:"
echo ""
echo "1. Clone and install:"
echo "   cd ~/research-ecosystem/gpt-researcher"
echo "   git clone https://github.com/assafelovic/gpt-researcher.git ."
echo "   cd mcp-server"
echo "   pip install -r requirements.txt"
echo ""
echo "2. Set up environment variables:"
echo "   cp .env.example .env"
echo "   # Edit .env file with:"
echo "   # OPENAI_API_KEY=your-openai-key"
echo "   # TAVILY_API_KEY=your-tavily-key"
echo ""
echo "3. Test the server:"
echo "   python server.py"
echo ""

echo "🕷️ FIRECRAWL MCP SETUP"
echo "======================"
echo ""
echo "Option 1 - Quick setup via Smithery (RECOMMENDED):"
echo "   npx -y @smithery/cli install mcp-server-firecrawl --client claude"
echo ""
echo "Option 2 - Manual setup:"
echo "   cd ~/research-ecosystem/firecrawl"
echo "   git clone https://github.com/pashpashpash/mcp-server-firecrawl.git ."
echo "   npm install"
echo "   npm run build"
echo ""
echo "Environment variables needed:"
echo "   FIRE_CRAWL_API_KEY=your-firecrawl-key"
echo "   # Get key from: https://firecrawl.dev"
echo ""

echo "⚙️ MULTI-MCP CONFIGURATION"
echo "=========================="
echo ""
echo "Your enhanced ~/.github/copilot/mcp.json should look like:"
echo ""
cat << 'EOF'
{
  "mcpServers": {
    "Tavily Expert": {
      "serverUrl": "https://tavily.api.tadata.com/mcp/tavily/pan-melon-carabao-g8m9ge"
    },
    "GPT Researcher": {
      "command": "python",
      "args": ["/home/codespace/research-ecosystem/gpt-researcher/mcp-server/server.py"],
      "env": {
        "OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      }
    },
    "Firecrawl": {
      "command": "node",
      "args": ["/home/codespace/research-ecosystem/firecrawl/build/index.js"],
      "env": {
        "FIRE_CRAWL_API_KEY": "${FIRE_CRAWL_API_KEY}"
      }
    }
  }
}
EOF
echo ""

echo "🔑 ENVIRONMENT VARIABLES SETUP"
echo "==============================="
echo ""
echo "Add to your shell profile (~/.bashrc or ~/.zshrc):"
echo ""
echo "# Research Ecosystem API Keys"
echo "export OPENAI_API_KEY='your-openai-api-key'"
echo "export TAVILY_API_KEY='your-tavily-api-key'"
echo "export FIRE_CRAWL_API_KEY='your-firecrawl-api-key'"
echo ""

echo "📝 OSRS RESEARCH PROMPTS"
echo "========================"
echo ""
echo "Create specialized research prompts for:"
echo "- Economy trend analysis"
echo "- Grand Exchange monitoring"
echo "- Market prediction research"
echo "- Player behavior analysis"
echo ""

echo "🎯 TESTING SEQUENCE"
echo "==================="
echo ""
echo "1. ✅ Test current Tavily setup (Issue #52)"
echo "2. 🔬 Set up and test GPT Researcher"
echo "3. 🕷️ Set up and test Firecrawl"
echo "4. 🔄 Test all three together"
echo "5. 📊 Compare capabilities and performance"
echo ""

echo "🚦 CURRENT STATUS"
echo "================="
echo "✅ Hosted Tavily Expert: READY (restart GitHub Copilot, then test Issue #52)"
echo "🔄 GPT Researcher: READY TO INSTALL"
echo "🔄 Firecrawl: READY TO INSTALL"
echo "📝 OSRS Prompts: READY TO CREATE"
echo ""

echo "Next step: Test Issue #52 first, then decide on additional MCP servers!"
echo ""
echo "📖 Full documentation: docs/ADVANCED_RESEARCH_ECOSYSTEM.md"
