# RuneRogue Complete Setup Verification
# This script performs comprehensive testing of all MCP setup components

Write-Host "🔬 RuneRogue Complete Setup Verification" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$errorCount = 0
$warningCount = 0

function Test-Component {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$SuccessMessage = "✅ $Name working",
        [string]$FailureMessage = "❌ $Name failed",
        [bool]$Critical = $false
    )
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host "  $SuccessMessage" -ForegroundColor Green
            return $true
        } else {
            if ($Critical) {
                Write-Host "  $FailureMessage" -ForegroundColor Red
                $script:errorCount++
            } else {
                Write-Host "  ⚠️  $Name has issues" -ForegroundColor Yellow
                $script:warningCount++
            }
            return $false
        }
    } catch {
        if ($Critical) {
            Write-Host "  $FailureMessage - $($_.Exception.Message)" -ForegroundColor Red
            $script:errorCount++
        } else {
            Write-Host "  ⚠️  $Name error - $($_.Exception.Message)" -ForegroundColor Yellow
            $script:warningCount++
        }
        return $false
    }
}

Write-Host ""
Write-Host "📁 File Structure Verification" -ForegroundColor Blue
Write-Host "==============================="

Test-Component "MCP Repositories Directory" {
    (Test-Path "mcp-repos") -and ((Get-ChildItem "mcp-repos" | Measure-Object).Count -gt 10)
} -Critical $true

Test-Component "VS Code Workspace File" {
    Test-Path "mcp-repos.code-workspace"
} -Critical $true

Test-Component "Cursor MCP Configuration" {
    Test-Path ".cursor/mcp.json"
} -Critical $true

Test-Component "GitHub Copilot MCP Configuration" {
    Test-Path ".github/copilot/mcp_config.json"
} -Critical $true

Test-Component "Environment Template" {
    Test-Path "env.template"
}

Test-Component "Environment File" {
    Test-Path ".env"
}

Test-Component "Setup Documentation" {
    Test-Path "MCP_SETUP_README.md"
}

Write-Host ""
Write-Host "🎮 Game Server Components" -ForegroundColor Blue
Write-Host "=========================="

Test-Component "TypeScript Server Directory" {
    Test-Path "server-ts/src"
} -Critical $true

Test-Component "Game Systems" {
    (Test-Path "server-ts/src/server/game/CombatSystem.ts") -and 
    (Test-Path "server-ts/src/server/game/PrayerSystem.ts") -and
    (Test-Path "server-ts/src/server/game/SurvivorWaveSystem.ts")
} -Critical $true

Test-Component "Client Components" {
    Test-Path "server-ts/src/client"
}

Test-Component "Package.json" {
    Test-Path "server-ts/package.json"
} -Critical $true

Write-Host ""
Write-Host "📦 MCP Repository Status" -ForegroundColor Blue
Write-Host "========================"

$expectedRepos = @(
    "browser-tools-mcp",
    "mcpso", 
    "mcp-obsidian",
    "blender-mcp",
    "open-mcp-client",
    "mcp",
    "magic-mcp",
    "learn-agentic-ai",
    "agentscope",
    "nerve",
    "5ire",
    "fast-agent",
    "supergateway",
    "shippie",
    "kubb",
    "mcp-for-beginners",
    "ai-engineering-hub",
    "awesome-mcp-servers",
    "inspector",
    "Upsonic",
    "langchain-mcp-adapters",
    "cognee-starter"
)

$foundRepos = 0
foreach ($repo in $expectedRepos) {
    if (Test-Path "mcp-repos/$repo") {
        $foundRepos++
    }
}

Test-Component "MCP Repositories ($foundRepos/$($expectedRepos.Count))" {
    $foundRepos -ge 15  # At least 15 repos should be present
}

Write-Host ""
Write-Host "🔧 Configuration Validation" -ForegroundColor Blue
Write-Host "==========================="

Test-Component "Cursor MCP Config Syntax" {
    try {
        $cursorConfig = Get-Content ".cursor/mcp.json" | ConvertFrom-Json
        $cursorConfig.mcpServers -ne $null
    } catch {
        $false
    }
}

Test-Component "GitHub Copilot Config Syntax" {
    try {
        $copilotConfig = Get-Content ".github/copilot/mcp_config.json" | ConvertFrom-Json
        $copilotConfig.mcpServers -ne $null
    } catch {
        $false
    }
}

Test-Component "VS Code Workspace Syntax" {
    try {
        $workspace = Get-Content "mcp-repos.code-workspace" | ConvertFrom-Json
        $workspace.folders -ne $null
    } catch {
        $false
    }
}

Write-Host ""
Write-Host "🧪 Game System Tests" -ForegroundColor Blue
Write-Host "===================="

if (Test-Path "server-ts/package.json") {
    Test-Component "Node.js Dependencies" {
        Push-Location "server-ts"
        try {
            # Check if node_modules exists and has content
            $result = (Test-Path "node_modules") -and ((Get-ChildItem "node_modules" | Measure-Object).Count -gt 10)
            Pop-Location
            return $result
        } catch {
            Pop-Location
            return $false
        }
    }
    
    Write-Host "  🔬 Running quick test suite..." -ForegroundColor Gray
    Test-Component "Game Tests" {
        Push-Location "server-ts"
        try {
            # Run a quick test to see if the system works
            $testResult = npm test -- --testNamePattern="should calculate effective attack level" --silent 2>$null
            $exitCode = $LASTEXITCODE
            Pop-Location
            return $exitCode -eq 0
        } catch {
            Pop-Location
            return $false
        }
    }
}

Write-Host ""
Write-Host "🌐 Network and Tool Verification" -ForegroundColor Blue
Write-Host "================================"

Test-Component "Node.js Installation" {
    try {
        $nodeVersion = node --version 2>$null
        $nodeVersion -like "v*"
    } catch {
        $false
    }
}

Test-Component "NPM Installation" {
    try {
        $npmVersion = npm --version 2>$null
        $npmVersion -match "\d+\.\d+\.\d+"
    } catch {
        $false
    }
}

Test-Component "Git Installation" {
    try {
        git --version 2>$null | Out-Null
        $LASTEXITCODE -eq 0
    } catch {
        $false
    }
}

Write-Host ""
Write-Host "📊 Final Report" -ForegroundColor Green
Write-Host "==============="

if ($errorCount -eq 0 -and $warningCount -eq 0) {
    Write-Host "🎉 Perfect! All systems operational!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✨ Your RuneRogue MCP setup is complete and ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Open: mcp-repos.code-workspace in VS Code or Cursor"
    Write-Host "   2. Start development: cd server-ts && npm run dev"
    Write-Host "   3. Run full tests: cd server-ts && npm test"
    Write-Host ""
    Write-Host "📖 Documentation: See MCP_SETUP_README.md for details"
} elseif ($errorCount -eq 0) {
    Write-Host "✅ Setup Complete with $warningCount warning(s)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Your setup is functional but has some minor issues to address."
    Write-Host "Check the warnings above and refer to MCP_SETUP_README.md"
} else {
    Write-Host "❌ Setup has $errorCount critical error(s) and $warningCount warning(s)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please address the critical errors before proceeding:"
    Write-Host "   1. Check file paths and permissions"
    Write-Host "   2. Ensure all dependencies are installed"
    Write-Host "   3. Run setup scripts again if needed"
}

Write-Host ""
Write-Host "📈 Setup Summary:" -ForegroundColor Blue
Write-Host "   ✅ Errors: $errorCount"
Write-Host "   ⚠️  Warnings: $warningCount"
Write-Host "   📦 MCP Repos: $foundRepos/$($expectedRepos.Count)"
Write-Host "" 