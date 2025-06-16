# RuneRogue MCP Dependencies Setup Script
# This script automatically installs dependencies for all cloned MCP repositories

Write-Host "🚀 RuneRogue MCP Dependencies Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to install Node.js dependencies
function Install-NodeDependencies($repoPath) {
    Write-Host "📦 Installing Node.js dependencies for: $repoPath" -ForegroundColor Blue
    Push-Location $repoPath
    
    if (Test-Path "package.json") {
        if (Test-Path "yarn.lock") {
            Write-Host "  Using Yarn..." -ForegroundColor Yellow
            yarn install
        } elseif (Test-Path "pnpm-lock.yaml") {
            Write-Host "  Using pnpm..." -ForegroundColor Yellow
            pnpm install
        } else {
            Write-Host "  Using npm..." -ForegroundColor Yellow
            npm install
        }
    } else {
        Write-Host "  No package.json found, skipping..." -ForegroundColor Gray
    }
    
    Pop-Location
}

# Function to install Python dependencies
function Install-PythonDependencies($repoPath) {
    Write-Host "🐍 Installing Python dependencies for: $repoPath" -ForegroundColor Blue
    Push-Location $repoPath
    
    if (Test-Path "requirements.txt") {
        Write-Host "  Installing from requirements.txt..." -ForegroundColor Yellow
        pip install -r requirements.txt
    } elseif (Test-Path "pyproject.toml") {
        Write-Host "  Installing from pyproject.toml..." -ForegroundColor Yellow
        pip install -e .
    } elseif (Test-Path "setup.py") {
        Write-Host "  Installing from setup.py..." -ForegroundColor Yellow
        pip install -e .
    } else {
        Write-Host "  No Python dependencies found, skipping..." -ForegroundColor Gray
    }
    
    Pop-Location
}

# Function to install Rust dependencies
function Install-RustDependencies($repoPath) {
    Write-Host "🦀 Installing Rust dependencies for: $repoPath" -ForegroundColor Blue
    Push-Location $repoPath
    
    if (Test-Path "Cargo.toml") {
        Write-Host "  Using cargo..." -ForegroundColor Yellow
        cargo build
    } else {
        Write-Host "  No Cargo.toml found, skipping..." -ForegroundColor Gray
    }
    
    Pop-Location
}

# Function to install Go dependencies
function Install-GoDependencies($repoPath) {
    Write-Host "🐹 Installing Go dependencies for: $repoPath" -ForegroundColor Blue
    Push-Location $repoPath
    
    if (Test-Path "go.mod") {
        Write-Host "  Using go mod..." -ForegroundColor Yellow
        go mod download
        go mod tidy
    } else {
        Write-Host "  No go.mod found, skipping..." -ForegroundColor Gray
    }
    
    Pop-Location
}

# Verify prerequisites
Write-Host "✅ Checking prerequisites..." -ForegroundColor Cyan

$prerequisites = @()
if (-not (Test-Command "node")) { $prerequisites += "Node.js" }
if (-not (Test-Command "npm")) { $prerequisites += "npm" }
if (-not (Test-Command "python")) { $prerequisites += "Python" }
if (-not (Test-Command "pip")) { $prerequisites += "pip" }

if ($prerequisites.Count -gt 0) {
    Write-Host "❌ Missing prerequisites: $($prerequisites -join ', ')" -ForegroundColor Red
    Write-Host "Please install missing tools and run this script again." -ForegroundColor Red
    exit 1
}

# Check for optional tools
if (Test-Command "yarn") { Write-Host "  ✅ Yarn detected" -ForegroundColor Green }
if (Test-Command "pnpm") { Write-Host "  ✅ pnpm detected" -ForegroundColor Green }
if (Test-Command "cargo") { Write-Host "  ✅ Rust/Cargo detected" -ForegroundColor Green }
if (Test-Command "go") { Write-Host "  ✅ Go detected" -ForegroundColor Green }

Write-Host ""

# Get all MCP repositories
$mcpRepos = Get-ChildItem -Path "mcp-repos" -Directory

Write-Host "📁 Found $($mcpRepos.Count) MCP repositories to process" -ForegroundColor Cyan
Write-Host ""

# Process each repository
foreach ($repo in $mcpRepos) {
    $repoPath = $repo.FullName
    $repoName = $repo.Name
    
    Write-Host "🔧 Processing: $repoName" -ForegroundColor Magenta
    Write-Host "   Path: $repoPath" -ForegroundColor Gray
    
    # Detect and install dependencies based on files present
    Install-NodeDependencies $repoPath
    Install-PythonDependencies $repoPath
    Install-RustDependencies $repoPath
    Install-GoDependencies $repoPath
    
    Write-Host ""
}

# Install main project dependencies
Write-Host "🏠 Installing main project dependencies..." -ForegroundColor Magenta

# Install server-ts dependencies
if (Test-Path "server-ts/package.json") {
    Write-Host "📦 Installing server-ts dependencies..." -ForegroundColor Blue
    Push-Location "server-ts"
    npm install
    Pop-Location
}

# Install client dependencies
if (Test-Path "server-ts/client/meta-ui/package.json") {
    Write-Host "📦 Installing client dependencies..." -ForegroundColor Blue
    Push-Location "server-ts/client/meta-ui"
    npm install
    Pop-Location
}

# Install tools-python dependencies
if (Test-Path "tools-python/requirements.txt") {
    Write-Host "🐍 Installing tools-python dependencies..." -ForegroundColor Blue
    Push-Location "tools-python"
    
    # Create virtual environment if it doesn't exist
    if (-not (Test-Path "venv")) {
        Write-Host "  Creating Python virtual environment..." -ForegroundColor Yellow
        python -m venv venv
    }
    
    # Activate virtual environment and install dependencies
    Write-Host "  Activating virtual environment and installing dependencies..." -ForegroundColor Yellow
    & "venv\Scripts\Activate.ps1"
    pip install -r requirements.txt
    deactivate
    
    Pop-Location
}

Write-Host ""
Write-Host "✅ Dependencies installation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run './verify-mcp-setup.ps1' to test MCP server connectivity" -ForegroundColor White
Write-Host "  2. Configure environment variables in .env file" -ForegroundColor White
Write-Host "  3. Open 'mcp-repos.code-workspace' in VS Code Insiders or Cursor" -ForegroundColor White
Write-Host "" 