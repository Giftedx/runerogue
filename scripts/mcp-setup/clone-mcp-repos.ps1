# Create mcp-repos directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "mcp-repos"

# Array of repositories to clone
$repos = @(
    "https://github.com/AgentDeskAI/browser-tools-mcp",
    "https://github.com/chatmcp/mcpso",
    "https://github.com/MarkusPfundstein/mcp-obsidian",
    "https://github.com/ahujasid/blender-mcp",
    "https://github.com/CopilotKit/open-mcp-client",
    "https://github.com/BrowserMCP/mcp",
    "https://github.com/21st-dev/magic-mcp",
    "https://github.com/panaversity/learn-agentic-ai",
    "https://github.com/modelscope/agentscope",
    "https://github.com/evilsocket/nerve",
    "https://github.com/nanbingxyz/5ire",
    "https://github.com/evalstate/fast-agent",
    "https://github.com/supercorp-ai/supergateway",
    "https://github.com/mattzcarey/shippie",
    "https://github.com/kubb-labs/kubb",
    "https://github.com/microsoft/mcp-for-beginners",
    "https://github.com/patchy631/ai-engineering-hub",
    "https://github.com/appcypher/awesome-mcp-servers",
    "https://github.com/modelcontextprotocol/inspector",
    "https://github.com/Upsonic/Upsonic",
    "https://github.com/langchain-ai/langchain-mcp-adapters",
    "https://github.com/topoteretes/cognee-starter"
)

# Clone each repository
foreach ($repo in $repos) {
    $repoName = $repo.Split('/')[-1]
    $targetPath = Join-Path "mcp-repos" $repoName
    
    Write-Host "Cloning $repoName..."
    git clone $repo $targetPath
}

Write-Host "All repositories have been cloned successfully!" 