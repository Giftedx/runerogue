# Tavily MCP Integration Test Cases

This document contains test cases to validate Tavily MCP functionality with GitHub Copilot Agents.

## Test Case 1: OSRS Market Research

### Issue Template

```markdown
## Task Type

- [x] Research - Gather information from web sources

## Priority

- [x] High

## Description

Research current Old School RuneScape Grand Exchange trends for Dragon equipment to update our item pricing algorithm.

## Custom MCP Tool Options

### For Web Search Tasks

- Query: "Old School RuneScape Dragon equipment Grand Exchange prices trends 2025"
- Search Depth: advanced
- Topic: finance
- Max Results: 15
- Include Answer: true

## Acceptance Criteria

- [ ] Gather current Dragon scimitar, Dragon longsword, and Dragon dagger prices
- [ ] Identify price trend patterns over the last 3 months
- [ ] Compare prices across different sources (OSRS Wiki, GE Tracker, etc.)
- [ ] Provide recommendations for algorithm updates
- [ ] Include data sources and timestamps

## Expected Tavily Usage

The agent should use `tavily_search` to find current market data and trends.
```

## Test Case 2: Game Update Analysis

### Issue Template

```markdown
## Task Type

- [x] Research - Gather information from web sources
- [x] Analysis - Process and synthesize information

## Priority

- [x] Medium

## Description

Analyze recent OSRS game updates to identify impacts on our scraping and data collection systems.

## Custom MCP Tool Options

### For Web Search Tasks

- Query: "Old School RuneScape game updates December 2024 January 2025 API changes"
- Search Depth: advanced
- Topic: news
- Max Results: 20
- Include Answer: true

### For Content Extraction Tasks

- URLs: [
  "https://oldschool.runescape.wiki/w/Game_updates",
  "https://secure.runescape.com/m=news/oldschool"
  ]
- Extract Depth: advanced
- Include Images: false

## Acceptance Criteria

- [ ] Identify all game updates since December 2024
- [ ] Analyze potential impacts on Grand Exchange API
- [ ] Check for new items or economy changes
- [ ] Assess impacts on our scraping endpoints
- [ ] Provide update recommendations for our codebase

## Expected Tavily Usage

The agent should use both `tavily_search` and `tavily_extract` tools.
```

## Test Case 3: Competitor Analysis

### Issue Template

```markdown
## Task Type

- [x] Research - Gather information from web sources

## Priority

- [x] Low

## Description

Research other OSRS economy tracking tools and APIs to identify feature gaps and opportunities.

## Custom MCP Tool Options

### For Web Search Tasks

- Query: "OSRS economy tracking tools Grand Exchange API alternatives 2025"
- Search Depth: advanced
- Topic: general
- Max Results: 25
- Include Answer: true

## Acceptance Criteria

- [ ] Identify 5+ competitor tools/APIs
- [ ] Document their key features and pricing
- [ ] Analyze their data sources and update frequencies
- [ ] Identify unique features we could implement
- [ ] Assess market positioning opportunities

## Expected Tavily Usage

The agent should use `tavily_search` with general topic for comprehensive results.
```

## Test Case 4: Technical Documentation Research

### Issue Template

```markdown
## Task Type

- [x] Research - Gather information from web sources
- [x] Documentation - Create or update documentation

## Priority

- [x] Medium

## Description

Research best practices for Python FastAPI + GitHub Copilot Agents integration to improve our MCP server architecture.

## Custom MCP Tool Options

### For Web Search Tasks

- Query: "Python FastAPI GitHub Copilot Agents MCP server best practices 2025"
- Search Depth: advanced
- Topic: general
- Max Results: 15
- Include Answer: true

### For Content Extraction Tasks

- URLs: [
  "https://docs.github.com/en/copilot",
  "https://fastapi.tiangolo.com/advanced/"
  ]
- Extract Depth: advanced
- Include Images: false

## Acceptance Criteria

- [ ] Gather current best practices for FastAPI + MCP integration
- [ ] Identify security considerations for agent-server communication
- [ ] Find performance optimization techniques
- [ ] Document authentication and authorization patterns
- [ ] Update our MCP server implementation recommendations

## Expected Tavily Usage

The agent should use both search and extraction tools for comprehensive research.
```

## Validation Checklist

After running these test cases, verify:

- [ ] Tavily search returns relevant, recent results
- [ ] Content extraction works with specified URLs
- [ ] Search depth settings affect result quality
- [ ] Topic filtering works as expected
- [ ] Custom tool parameters are properly passed
- [ ] Results are properly formatted and useful
- [ ] API rate limits are respected
- [ ] Error handling works for invalid URLs or queries

## Performance Metrics

Track these metrics during testing:

- **Response Time**: How quickly Tavily returns results
- **Result Quality**: Relevance and accuracy of search results
- **Cache Effectiveness**: Repeated queries should be faster
- **Rate Limit Handling**: Proper handling of API limits
- **Error Recovery**: Graceful handling of failures

## Next Steps After Testing

1. **Optimize Queries**: Refine search terms based on result quality
2. **Configure Caching**: Implement local caching for frequently accessed data
3. **Monitor Usage**: Track API usage against your Tavily plan limits
4. **Integrate Workflows**: Create standard issue templates for common research tasks
5. **Train Team**: Document best practices for using Tavily with Copilot Agents
