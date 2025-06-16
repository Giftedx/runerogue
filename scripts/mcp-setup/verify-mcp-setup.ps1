# RuneRogue MCP Setup Verification Script
# This script tests that all MCP servers can start and respond correctly

Write-Host "🔍 RuneRogue MCP Setup Verification" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Function to test MCP server startup
function Test-MCPServer($serverName, $command, $args, $timeout = 10) {
    Write-Host "🧪 Testing: $serverName" -ForegroundColor Blue
    
    try {
        # Start the server process
        $processArgs = @{
            FilePath = $command
            ArgumentList = $args
            PassThru = $true
            NoNewWindow = $true
            RedirectStandardOutput = $true
            RedirectStandardError = $true
        }
        
        $process = Start-Process @processArgs
        
        # Wait for the process to start
        Start-Sleep -Seconds 2
        
        if ($process.HasExited) {
            $stderr = $process.StandardError.ReadToEnd()
            Write-Host "  ❌ Server failed to start" -ForegroundColor Red
            Write-Host "  Error: $stderr" -ForegroundColor Red
            return $false
        } else {
            Write-Host "  ✅ Server started successfully" -ForegroundColor Green
            
            # Stop the process
            $process | Stop-Process -Force
            return $true
        }
    }
    catch {
        Write-Host "  ❌ Failed to start server: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test Node.js based MCP servers
function Test-NodeMCPServers() {
    Write-Host ""
    Write-Host "📦 Testing Node.js MCP Servers" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
    
    $nodeServers = @(
        @{
            name = "GitHub MCP Server"
            command = "npx"
            args = @("-y", "@modelcontextprotocol/server-github")
        },
        @{
            name = "Sequential Thinking MCP Server" 
            command = "npx"
            args = @("-y", "@modelcontextprotocol/server-sequential-thinking")
        },
        @{
            name = "OSRS MCP Server"
            command = "npx"
            args = @("-y", "@jayarrowz/mcp-osrs")
        },
        @{
            name = "Memory MCP Server"
            command = "npx"
            args = @("-y", "@modelcontextprotocol/server-memory")
        },
        @{
            name = "Tavily MCP Server"
            command = "npx"
            args = @("-y", "@mcptools/mcp-tavily")
        }
    )
    
    $nodeResults = @()
    foreach ($server in $nodeServers) {
        $result = Test-MCPServer $server.name $server.command $server.args
        $nodeResults += @{ name = $server.name; success = $result }
    }
    
    return $nodeResults
}

# Function to test custom MCP servers from cloned repos
function Test-CustomMCPServers() {
    Write-Host ""
    Write-Host "🔧 Testing Custom MCP Servers" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    
    $customResults = @()
    
    # Test browser-tools-mcp
    if (Test-Path "mcp-repos/browser-tools-mcp/package.json") {
        Write-Host "🌐 Testing browser-tools-mcp..." -ForegroundColor Blue
        Push-Location "mcp-repos/browser-tools-mcp"
        
        # Check if there's a start script
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts -and $packageJson.scripts.start) {
            $result = Test-MCPServer "Browser Tools MCP" "npm" @("start")
            $customResults += @{ name = "Browser Tools MCP"; success = $result }
        } else {
            Write-Host "  ⚠️  No start script found, skipping..." -ForegroundColor Yellow
            $customResults += @{ name = "Browser Tools MCP"; success = $null }
        }
        
        Pop-Location
    }
    
    # Test other custom servers
    $customRepos = @(
        "mcpso",
        "mcp-obsidian", 
        "blender-mcp",
        "open-mcp-client",
        "magic-mcp"
    )
    
    foreach ($repoName in $customRepos) {
        $repoPath = "mcp-repos/$repoName"
        if (Test-Path "$repoPath/package.json") {
            Write-Host "🔧 Testing $repoName..." -ForegroundColor Blue
            Push-Location $repoPath
            
            $packageJson = Get-Content "package.json" | ConvertFrom-Json
            if ($packageJson.scripts -and $packageJson.scripts.start) {
                $result = Test-MCPServer $repoName "npm" @("start")
                $customResults += @{ name = $repoName; success = $result }
            } else {
                Write-Host "  ⚠️  No start script found, skipping..." -ForegroundColor Yellow
                $customResults += @{ name = $repoName; success = $null }
            }
            
            Pop-Location
        }
    }
    
    return $customResults
}

# Function to test main project servers
function Test-MainProjectServers() {
    Write-Host ""
    Write-Host "🏠 Testing Main Project Servers" -ForegroundColor Cyan
    Write-Host "===============================" -ForegroundColor Cyan
    
    $mainResults = @()
    
    # Test RuneRogue custom MCP server
    if (Test-Path ".github/copilot/runerogue-mcp-server.js") {
        Write-Host "🎮 Testing RuneRogue MCP Server..." -ForegroundColor Blue
        $result = Test-MCPServer "RuneRogue MCP" "node" @(".github/copilot/runerogue-mcp-server.js")
        $mainResults += @{ name = "RuneRogue MCP"; success = $result }
    }
    
    # Test TypeScript game server (if built)
    if (Test-Path "server-ts/dist") {
        Write-Host "🎮 Testing TypeScript Game Server..." -ForegroundColor Blue
        Push-Location "server-ts"
        $result = Test-MCPServer "TS Game Server" "npm" @("start")
        $mainResults += @{ name = "TS Game Server"; success = $result }
        Pop-Location
    } else {
        Write-Host "  ⚠️  TypeScript server not built, run 'npm run build' first" -ForegroundColor Yellow
        $mainResults += @{ name = "TS Game Server"; success = $null }
    }
    
    return $mainResults
}

# Function to check environment configuration
function Test-EnvironmentConfig() {
    Write-Host ""
    Write-Host "⚙️  Testing Environment Configuration" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    
    $envIssues = @()
    
    # Check for .env file
    if (-not (Test-Path ".env")) {
        Write-Host "  ⚠️  .env file not found" -ForegroundColor Yellow
        $envIssues += "Missing .env file"
        
        if (Test-Path ".env.example") {
            Write-Host "    💡 Copy .env.example to .env and configure your API keys" -ForegroundColor Blue
        }
    } else {
        Write-Host "  ✅ .env file found" -ForegroundColor Green
        
        # Check for critical environment variables
        $envContent = Get-Content ".env" -Raw
        $criticalVars = @("GITHUB_TOKEN", "MCP_GITHUB_TOKEN")
        
        foreach ($var in $criticalVars) {
            if ($envContent -notmatch "$var=") {
                Write-Host "  ⚠️  $var not configured in .env" -ForegroundColor Yellow
                $envIssues += "Missing $var"
            } else {
                Write-Host "  ✅ $var configured" -ForegroundColor Green
            }
        }
    }
    
    # Check MCP configuration files
    if (Test-Path ".cursor/mcp.json") {
        Write-Host "  ✅ Cursor MCP config found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Cursor MCP config not found at .cursor/mcp.json" -ForegroundColor Yellow
        $envIssues += "Missing Cursor MCP config"
    }
    
    if (Test-Path ".github/copilot/mcp_config.json") {
        Write-Host "  ✅ GitHub Copilot MCP config found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  GitHub Copilot MCP config not found" -ForegroundColor Yellow
        $envIssues += "Missing GitHub Copilot MCP config"
    }
    
    return $envIssues
}

# Function to generate summary report
function Write-SummaryReport($nodeResults, $customResults, $mainResults, $envIssues) {
    Write-Host ""
    Write-Host "📊 Summary Report" -ForegroundColor Green
    Write-Host "=================" -ForegroundColor Green
    
    $totalServers = $nodeResults.Count + $customResults.Count + $mainResults.Count
    $successfulServers = ($nodeResults + $customResults + $mainResults | Where-Object { $_.success -eq $true }).Count
    $failedServers = ($nodeResults + $customResults + $mainResults | Where-Object { $_.success -eq $false }).Count
    $skippedServers = ($nodeResults + $customResults + $mainResults | Where-Object { $_.success -eq $null }).Count
    
    Write-Host "🎯 MCP Server Status:" -ForegroundColor Cyan
    Write-Host "  ✅ Successful: $successfulServers" -ForegroundColor Green
    Write-Host "  ❌ Failed: $failedServers" -ForegroundColor Red
    Write-Host "  ⚠️  Skipped: $skippedServers" -ForegroundColor Yellow
    Write-Host "  📊 Total: $totalServers" -ForegroundColor White
    
    if ($envIssues.Count -gt 0) {
        Write-Host ""
        Write-Host "⚠️  Environment Issues:" -ForegroundColor Yellow
        foreach ($issue in $envIssues) {
            Write-Host "  • $issue" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    if ($failedServers -eq 0 -and $envIssues.Count -eq 0) {
        Write-Host "🎉 All tests passed! Your MCP setup is ready to go!" -ForegroundColor Green
    } elseif ($failedServers -eq 0) {
        Write-Host "✅ MCP servers are working, but please address environment issues above." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Some servers failed to start. Please check the errors above and fix dependencies." -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Fix any failed servers or environment issues" -ForegroundColor White
    Write-Host "  2. Open 'mcp-repos.code-workspace' in VS Code Insiders or Cursor" -ForegroundColor White
    Write-Host "  3. Enable MCP integration in your editor settings" -ForegroundColor White
    Write-Host "  4. Start developing with AI assistance!" -ForegroundColor White
}

# Main execution
Write-Host "Starting MCP setup verification..." -ForegroundColor White
Write-Host ""

# Run all tests
$nodeResults = Test-NodeMCPServers
$customResults = Test-CustomMCPServers  
$mainResults = Test-MainProjectServers
$envIssues = Test-EnvironmentConfig

# Generate summary
Write-SummaryReport $nodeResults $customResults $mainResults $envIssues 