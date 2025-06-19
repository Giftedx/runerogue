# AI Agent Guide

## Purpose

This document explains how to work with the AI agent (Cascade, Copilot, etc.) in this workspace.

## How to Get the Most from the AI

- Reference ROADMAP.md and DECISIONS.md for current project direction
- Ask for file trees or integration point mapping if lost
- Use explicit memories (see MEMORIES.md) to avoid repeating mistakes
- Update docs and memories after major changes

## AI Memory Anchors

- AI context comments are placed at the top of key files and directories
- See docs/MEMORIES.md for persistent AI context

## When to Update This Guide

- After major AI workflow/process changes
- When onboarding new AI agents or contributors

---

## Directory Conventions (as of June 2025)

- All documentation lives in /docs/
- All tests live in /tests/ or subsystem-specific tests/ folders
- Flatten single-item subdirectories unless expansion is planned
- Integrations are grouped under src/server/integrations/ if needed
- agents/ uses core/, mcp/, mcp/tests/, and mcp/legacy/ for organization
- AI memory/context anchors are placed at the top of all major entrypoints

## Test Organization (as of June 2025)

- Python: /tests/ for core, economy, and agent tests; agents/mcp/tests/ for MCP-specific
- TypeScript: src/server/**tests**/
- All major test entrypoints have AI memory/context anchors
- Test directories include **init**.py for Python where needed

## Discord Bot Subsystem (as of June 2025)

- src/server/discord-bot.ts provides Discord bot connection and event/command handling
- Supports notifications (loot, achievements, server status) and bot commands (!stats, etc.)
- Extend by adding new notification triggers and command handlers

## Gameplay System Modularity & Extension Points (as of June 2025)

- Loot: src/server/game/LootManager.ts
- Combat: src/server/game/CombatSystem.ts
- Inventory: src/server/game/EntitySchemas.ts, GameRoom.ts
- Economy: src/server/economy-integration.ts
- Discord: src/server/discord-bot.ts
- Extend by adding new modules/services with memory/context anchors and updating docs

_This guide is for both AI and human contributors. Keep it actionable and up to date._
