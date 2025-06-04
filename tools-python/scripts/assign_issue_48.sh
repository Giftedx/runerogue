#!/bin/bash
# Script to assign issue #48 to GitHub Copilot using our advanced technique

set -e

# Bold and colored text
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}${BOLD}=======================================${NC}"
echo -e "${BLUE}${BOLD} AGENTIC GITHUB COPILOT ASSIGNMENT${NC}"
echo -e "${BLUE}${BOLD}=======================================${NC}"
echo

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}ERROR: GITHUB_TOKEN environment variable is not set${NC}"
    echo "Please set a GitHub Personal Access Token with 'repo' and 'workflow' scopes:"
    echo "export GITHUB_TOKEN=your_personal_access_token"
    exit 1
fi

echo -e "${BOLD}Assigning issue #48 to GitHub Copilot...${NC}"
echo

# Run the agentic_copilot.py script with issue #48
if python scripts/agentic_copilot.py 48; then
    echo
    echo -e "${GREEN}${BOLD}SUCCESS!${NC} Issue #48 has been assigned to GitHub Copilot"
    echo "Please check the issue at: https://github.com/Giftedx/runerogue/issues/48"
    exit 0
else
    echo
    echo -e "${RED}${BOLD}ERROR!${NC} Failed to assign issue #48 to GitHub Copilot"
    echo "Please check the error messages above for more details."
    exit 1
fi
