## 🧪 **TEST ISSUE 1: LOCAL NPX TAVILY MCP**

### Task Type

- [x] Research - Gather information from web sources

### Priority

- [x] High

### Description

**LOCAL NPX TAVILY MCP TEST**: Test the local NPX-based Tavily MCP server integration using the `@mcptools/mcp-tavily` package. This test validates our self-hosted MCP setup with custom tool definitions.

### Research Request

Use the **local Tavily MCP tools** to research:

- Current Old School RuneScape Grand Exchange API status and capabilities
- Third-party OSRS economy tracking services and their features
- Recent OSRS game updates affecting the economy (June 2025)

### Custom MCP Tool Options

#### For Web Search Tasks

- Query: "Old School RuneScape Grand Exchange API third-party economy tracking services 2025"
- Search Depth: advanced
- Topic: general
- Max Results: 15
- Include Answer: true

#### For Content Extraction Tasks

- URLs: [
  "https://oldschool.runescape.wiki/w/Application_programming_interface",
  "https://oldschool.runescape.wiki/w/Grand_Exchange",
  "https://prices.runescape.wiki/"
  ]
- Extract Depth: advanced
- Include Images: false

### Expected Tools

- `tavily_search` - AI-powered web search with advanced parameters
- `tavily_extract` - Content extraction from specified URLs

### Configuration Details

- **MCP Server**: Local NPX execution
- **Package**: @mcptools/mcp-tavily
- **Config File**: /workspaces/runerogue/.github/copilot/mcp_config.json
- **API Key**: Requires TAVILY_API_KEY environment variable

### Success Criteria

- [ ] Local Tavily MCP server connects and authenticates
- [ ] Custom tool definitions work as specified
- [ ] Search returns relevant OSRS economy information
- [ ] Content extraction works for provided URLs
- [ ] Full control over search parameters and results

### Troubleshooting

If this test fails:

- Ensure TAVILY_API_KEY environment variable is set
- Check Node.js installation and NPX availability
- Verify MCP configuration in workspace .github/copilot/mcp_config.json

---

**This tests our self-hosted Tavily MCP integration with full customization control.**
