#!/bin/bash
set -e

# Get list of changed files in the PR or commit
CHANGED_FILES=$(git diff --name-only ${{ github.event.before }} ${{ github.sha }})

# Check if any code files were changed in core directories
CODE_CHANGED=$(echo "$CHANGED_FILES" | grep -E '^(src/|agents/|economy/|economy_api/|tests/)' || true)

# Check if docs/ROADMAP.md or docs/MEMORIES.md were changed
DOCS_CHANGED=$(echo "$CHANGED_FILES" | grep -E '^docs/(ROADMAP|MEMORIES)\.md$' || true)

if [[ -n "$CODE_CHANGED" && -z "$DOCS_CHANGED" ]]; then
  echo "❌ Major code changes detected but docs/ROADMAP.md or docs/MEMORIES.md were not updated."
  echo "Please update the living documentation and memory files to reflect your changes."
  exit 1
else
  echo "✅ Documentation and memory hygiene check passed."
fi
