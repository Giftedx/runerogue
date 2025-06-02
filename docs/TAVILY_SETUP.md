# Tavily MCP Server Setup Guide

This guide explains how to configure and use the Tavily MCP server for AI-powered web search capabilities in the RuneRogue project.

## Overview

Tavily is an AI-powered search API that provides comprehensive web search capabilities. By integrating it as an MCP server, GitHub Copilot Agents can perform real-time web searches to gather up-to-date information for tasks.

## Features

- **AI-powered search**: Get intelligent search results with context and summaries
- **Multiple search types**: Basic search, context search, and Q&A search
- **Content extraction**: Extract content from specific URLs
- **Advanced filtering**: Support for topic filtering, date ranges, and domain inclusion/exclusion
- **Caching**: Automatic caching of search results for improved performance

## Prerequisites

1. **Tavily API Key**: Obtain from [app.tavily.com](https://app.tavily.com)
2. **Node.js**: Version 16 or higher
3. **MCP Client**: GitHub Copilot or another MCP-compatible client

## Configuration

### 1. Environment Variables

Add your Tavily API key to your environment:

```bash
export TAVILY_API_KEY="your-tavily-api-key-here"
```

For production, add this to your `.env` file or CI/CD secrets.

### 2. MCP Configuration

The Tavily MCP server is already configured in `.github/copilot/mcp_config.json`:

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

## Available Tools

### 1. Basic Search (`tavily_search`)

Perform AI-powered web searches with various options:

**Parameters:**
- `query` (required): Search query to perform
- `searchDepth`: "basic" or "advanced" search depth
- `topic`: "general", "news", or "finance" 
- `maxResults`: Maximum number of results to return
- `includeAnswer`: Include AI-generated answer in results

**Example usage in an issue:**
```markdown
## Custom MCP Tool Options

### For Web Search Tasks
- Query: "latest developments in OSRS game updates 2024"
- Search Depth: advanced
- Topic: news
- Max Results: 10
- Include Answer: true
```

### 2. Content Extraction (`tavily_extract`)

Extract content from specific URLs:

**Parameters:**
- `urls` (required): Array of URLs to extract content from
- `extractDepth`: "basic" or "advanced" extraction depth
- `includeImages`: Include images in extracted content

**Example usage in an issue:**
```markdown
## Custom MCP Tool Options

### For Content Extraction Tasks
- URLs: ["https://oldschool.runescape.wiki/w/Grand_Exchange"]
- Extract Depth: advanced
- Include Images: false
```

## Usage Examples

### 1. Research Task

Create an issue for research with Tavily search:

```markdown
## Task Description
Research the latest OSRS economy trends and update our documentation.

## Custom MCP Tool Options

### For Web Search Tasks
- Query: "Old School RuneScape economy trends 2024 Grand Exchange"
- Search Depth: advanced
- Topic: general
- Max Results: 15
- Include Answer: true

## Acceptance Criteria
- [ ] Gather current market trends
- [ ] Update economy documentation
- [ ] Include recent price changes
```

### 2. Content Analysis Task

```markdown
## Task Description
Analyze specific OSRS wiki pages for item data extraction improvements.

## Custom MCP Tool Options

### For Content Extraction Tasks
- URLs: [
    "https://oldschool.runescape.wiki/w/Dragon_scimitar",
    "https://oldschool.runescape.wiki/w/Abyssal_whip"
  ]
- Extract Depth: advanced
- Include Images: true

## Acceptance Criteria
- [ ] Extract item statistics
- [ ] Compare current parsing vs extracted data
- [ ] Suggest improvements
```

## Best Practices

### 1. Query Optimization

- **Be specific**: Use detailed queries for better results
- **Include context**: Add relevant keywords and timeframes
- **Use proper topics**: Choose "news" for recent information, "finance" for market data

### 2. Result Management

- **Limit results**: Use `maxResults` to avoid overwhelming responses
- **Use advanced search**: For comprehensive research tasks
- **Cache awareness**: Repeated queries will use cached results

### 3. Content Extraction

- **Verify URLs**: Ensure URLs are accessible and relevant
- **Choose appropriate depth**: Use "advanced" for detailed content analysis
- **Consider images**: Include images only when visual content is needed

## Integration with GitHub Copilot Agents

When creating issues for GitHub Copilot Agents, use this structure:

```markdown
## Task Type
- [x] Research - Gather information from web sources

## Priority
- [x] Medium

## Description
[Detailed task description]

## Custom MCP Tool Options

### For Web Search Tasks
- Query: "[your search query]"
- Search Depth: advanced
- Topic: general
- Max Results: 10
- Include Answer: true

### For Content Extraction Tasks (if needed)
- URLs: ["url1", "url2"]
- Extract Depth: advanced
- Include Images: false

## Acceptance Criteria
- [ ] Specific, measurable criteria
- [ ] Include sources and references
- [ ] Verify information accuracy
```

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   - Error: Authentication failed
   - Solution: Ensure `TAVILY_API_KEY` environment variable is set

2. **Rate Limiting**
   - Error: Rate limit exceeded
   - Solution: Reduce query frequency or upgrade Tavily plan

3. **Invalid URLs**
   - Error: Failed to extract content
   - Solution: Verify URLs are accessible and public

4. **NPX Installation Issues**
   - Error: Package not found
   - Solution: Ensure Node.js 16+ is installed and npm is updated

### Debug Information

To debug Tavily MCP server issues:

1. Check environment variables:
   ```bash
   echo $TAVILY_API_KEY
   ```

2. Test NPX installation:
   ```bash
   npx -y @mcptools/mcp-tavily --help
   ```

3. Verify API key at [Tavily Dashboard](https://app.tavily.com)

## Security Considerations

1. **API Key Protection**: Never commit API keys to version control
2. **Environment Variables**: Use secure environment variable management
3. **URL Validation**: Validate URLs before extraction to prevent SSRF attacks
4. **Rate Limiting**: Implement proper rate limiting to avoid API abuse

## Documentation References

- [Tavily API Documentation](https://docs.tavily.com/)
- [MCP Tools Package](https://www.npmjs.com/package/@mcptools/mcp-tavily)
- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)

## Support

For issues with:
- Tavily API: Contact [Tavily Support](https://tavily.com/support)
- MCP Configuration: Check [GitHub Copilot MCP Documentation](https://docs.github.com/en/copilot)
- RuneRogue Integration: Create an issue in this repository
