#!/bin/bash
# Setup and test GitHub Copilot Agent integration

set -e  # Exit on any error

# Print colorful messages
function print_header() {
    echo -e "\n\033[1;34m==== $1 ====\033[0m\n"
}

function print_success() {
    echo -e "\033[1;32m✓ $1\033[0m"
}

function print_error() {
    echo -e "\033[1;31m✗ $1\033[0m"
}

function print_info() {
    echo -e "\033[1;36m$1\033[0m"
}

# Check if GitHub token is available
if [ -z "$GITHUB_TOKEN" ]; then
    print_error "GITHUB_TOKEN environment variable is not set"
    echo "Please set the GITHUB_TOKEN environment variable:"
    echo "export GITHUB_TOKEN=your_github_token"
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed"
    echo "Please install the GitHub CLI: https://cli.github.com/manual/installation"
    exit 1
fi

print_header "GitHub Copilot Agent Setup Script"
print_info "This script will help you set up and test GitHub Copilot Agent integration."

# Ensure we're in the project root directory
cd "$(dirname "$0")/.." || exit 1

# Step 1: Install required NPM packages
print_header "Installing required NPM packages"
npm install -g @modelcontextprotocol/server-github @modelcontextprotocol/server-sequential-thinking \
    @upstash/context7-mcp@latest @modelcontextprotocol/server-brave-search \
    @modelcontextprotocol/server-memory firecrawl-mcp

# Step 2: Verify MCP configuration
print_header "Verifying MCP configuration"
if [ -f ".github/copilot/mcp_config.json" ]; then
    print_success "MCP configuration file exists"
else
    print_info "Creating MCP configuration from example"
    cp .github/copilot/mcp_config.example.json .github/copilot/mcp_config.json
    print_success "MCP configuration created"
fi

# Step 3: Check GitHub workflow files
print_header "Verifying GitHub workflow files"
for workflow in .github/workflows/auto-assign-to-copilot.yml .github/workflows/copilot-agent-tasks.yml .github/workflows/ai-agent-issue-creator.yml; do
    if [ -f "$workflow" ]; then
        print_success "Workflow file exists: $workflow"
    else
        print_error "Workflow file missing: $workflow"
        exit 1
    fi
done

# Step 4: Make scripts executable
print_header "Making scripts executable"
chmod +x scripts/create_agent_issue.py
chmod +x scripts/test_issue_creator.py
chmod +x scripts/test_copilot_agent_setup.py
print_success "Scripts are now executable"

# Step 5: Ask if user wants to create a test issue
print_header "GitHub Copilot Agent Testing"
read -p "Do you want to create a test issue to verify GitHub Copilot Agent setup? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Creating test issue..."
    python scripts/test_copilot_agent_setup.py
    if [ $? -eq 0 ]; then
        print_success "Test issue created successfully"
        print_info "Please check your GitHub repository's Issues tab to see the results"
    else
        print_error "Failed to create test issue"
        exit 1
    fi
else
    print_info "Skipping test issue creation"
fi

print_header "Setup Complete"
print_info "GitHub Copilot Agent integration is now set up."
print_info "For more information, see:"
print_info "- docs/COPILOT_AGENTS_GUIDE.md"
print_info "- docs/AI_MANAGED_ISSUES.md"
print_info "- docs/GITHUB_COPILOT_AGENTS.md"
