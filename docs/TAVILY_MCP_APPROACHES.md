# Tavily MCP Server Configuration Guide

This document explains the two different Tavily MCP server setups available for the RuneRogue project and helps you choose the best approach.

## 🔄 **Two Tavily MCP Approaches**

### **Approach 1: Local NPX-based Tavily MCP** ⚡
**Location**: `/workspaces/runerogue/.github/copilot/mcp_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "tavily": {
      "command": "npx",
      "args": ["-y", "@mcptools/mcp-tavily"],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      }
    }
  }
}
```

**Pros:**
- ✅ Uses your own Tavily API key (full control)
- ✅ Local execution (faster, more reliable)
- ✅ Customizable tool definitions
- ✅ Works with any GitHub Copilot model
- ✅ No dependency on external hosted services

**Cons:**
- ❌ Requires managing your own API key
- ❌ Need Node.js environment
- ❌ Limited to official Tavily API capabilities

### **Approach 2: Hosted Tavily Expert MCP** 🌐
**Location**: `~/.github/copilot/mcp.json`

**Configuration:**
```json
{
  "mcpServers": {
    "Tavily Expert": {
      "serverUrl": "https://tavily.api.tadata.com/mcp/tavily/pan-melon-carabao-g8m9ge"
    }
  }
}
```

**Pros:**
- ✅ No API key management required
- ✅ Potentially enhanced/expert-level capabilities
- ✅ No local dependencies needed
- ✅ Optimized for Claude Sonnet 3.7

**Cons:**
- ❌ Dependency on external hosted service
- ❌ Limited control over configuration
- ❌ May have usage limits or costs
- ❌ Network dependency for functionality

## 🤔 **Which Approach Should You Use?**

### **Use Local NPX Approach If:**
- You want full control over your Tavily integration
- You prefer local execution for reliability
- You want to customize tool definitions
- You're using various GitHub Copilot models
- You want to avoid external service dependencies

### **Use Hosted Expert Approach If:**
- You want simplified setup without API key management
- You're primarily using Claude Sonnet 3.7
- You prefer managed services over self-hosted
- You want potentially enhanced "expert" capabilities
- You don't mind external service dependencies

## 🛠️ **Current Configuration Status**

### ✅ **Local NPX Setup (READY)**
- Configuration: `/workspaces/runerogue/.github/copilot/mcp_config.json`
- Status: Fully configured with custom tools
- Requires: Tavily API key from app.tavily.com
- Tools: `tavily_search`, `tavily_extract`

### ✅ **Hosted Expert Setup (READY)**
- Configuration: `~/.github/copilot/mcp.json`
- Status: Just configured
- Requires: Restart GitHub Copilot
- Tools: Provided by hosted service

## 🚀 **Setup Instructions**

### **For Local NPX Approach:**
1. Get API key from [app.tavily.com](https://app.tavily.com)
2. Set environment variable: `export TAVILY_API_KEY="your-key"`
3. Configuration already ready in workspace
4. Test with: `npx -y @mcptools/mcp-tavily --help`

### **For Hosted Expert Approach:**
1. ✅ Configuration file created at `~/.github/copilot/mcp.json`
2. **Restart GitHub Copilot** to apply changes
3. **Use Claude Sonnet 3.7** for best results
4. Test by creating issues with MCP tool requests

## 🧪 **Testing Both Approaches**

### **Test Local NPX Setup:**
Use the content from `TAVILY_TEST_ISSUE.md` to create a GitHub issue:

```markdown
## Custom MCP Tool Options

### For Web Search Tasks
- Query: "Old School RuneScape Grand Exchange API third-party data sources 2025"
- Search Depth: advanced
- Topic: general
- Max Results: 15
- Include Answer: true
```

### **Test Hosted Expert Setup:**
Create a simpler test issue:

```markdown
## Research Task
Research current OSRS economy trends using Tavily Expert MCP.

Please use the Tavily Expert MCP server to gather information about:
- Current Grand Exchange market trends
- Popular OSRS economy tracking tools
- Recent game updates affecting the economy

## Expected Tools
- Tavily Expert MCP server should be available
- Use Claude Sonnet 3.7 for best results
```

## 🔄 **Can You Use Both?**

**Yes!** You can configure both approaches:
- Local NPX for detailed, customized research
- Hosted Expert for quick, AI-enhanced searches

They use different configuration files and don't conflict.

## 📋 **Troubleshooting**

### **Local NPX Issues:**
- Check `TAVILY_API_KEY` environment variable
- Verify Node.js installation: `node --version`
- Test package: `npx -y @mcptools/mcp-tavily --help`

### **Hosted Expert Issues:**
- Ensure `~/.github/copilot/mcp.json` exists
- Restart GitHub Copilot completely
- Use Claude Sonnet 3.7 model
- Check network connectivity to hosted service

## 🎯 **Recommendations**

### **For Development & Testing:**
Use **Local NPX approach** for full control and customization.

### **For Production & Team Use:**
Consider **Hosted Expert approach** for simplified management.

### **For Maximum Flexibility:**
Configure **both approaches** and use as needed.

## 🔗 **Related Files**

- `TAVILY_SETUP.md` - Detailed local setup guide
- `TAVILY_ADVANCED_PATTERNS.md` - Advanced usage patterns
- `TAVILY_MASTERY_CHECKLIST.md` - Learning roadmap
- `test_tavily_integration.md` - Comprehensive test cases

## 🚀 **Next Steps**

1. **Choose your preferred approach** (or configure both)
2. **Restart GitHub Copilot** if using hosted expert
3. **Test with sample issues** to verify functionality
4. **Document your team's preferred approach**
5. **Create standard research workflow templates**

---

**Both approaches are now ready to use!** Choose based on your needs for control, simplicity, and team requirements.
