# Project Roadmap

## Current Sprint Goals
- Align directory structure for clarity and maintainability
- Ensure loot/inventory sync between TypeScript game server and Python Economy API
- Expand Discord integration for notifications and gameplay events

## Next Milestones
- Refactor agents/ and services/ directories for clarity
- Consolidate economy logic under a single directory
- Improve onboarding docs for new contributors and AI agents

## Recently Completed
- Modularized loot system and loot API sync
- Enhanced multiplayer and loot collection logic

## Known Blockers
- Some legacy files and misaligned directories
- Occasional AI confusion in agents/ and services/

---

## [2025-06-04] Directory Alignment & Refactor Plan
- Consolidate all documentation under /docs/
- Move all test files to /tests/ or subsystem-specific tests/ folders
- Flatten single-item subdirectories in src/server/ unless future expansion is planned
- Group integration logic (e.g., economy-integration.ts) under src/server/integrations/ if more integrations are added
- In agents/:
  - Create core/ for main agent systems
  - Move all tests to mcp/tests/
  - Move legacy files to mcp/legacy/
  - Ensure __pycache__/ is in .gitignore
- Add AI memory/context anchors to all new/major entrypoints after refactor
- Update docs and memories after each major change

## [2025-06-04] Test Organization and Conventions
- Python tests are located in /tests/ (core, economy, agents) and agents/mcp/tests/ (MCP-specific)
- TypeScript tests are located in src/server/__tests__/
- All major test entrypoints have AI memory/context anchors
- Test directories include __init__.py for Python where needed

## [2025-06-04] End-to-End Loot/Inventory Sync Test & Test Suite Status
- Added src/server/__tests__/loot-inventory-sync.test.ts to verify loot collection and drop sync with the Economy API
- Fixed logger import paths after directory flattening
- All tests passing after refactor and integration improvements

## [2025-06-04] Discord Bot Integration Skeleton
- Added src/server/discord-bot.ts for Discord bot connection and event/command handling
- Planned features: notifications for loot drops, achievements, server status; bot commands (e.g., !stats <player>)
- Next: implement notification triggers and sample commands

## [2025-06-04] Gameplay System Modularity & Extension Points
- Loot: src/server/game/LootManager.ts (handles loot drops, collection)
- Combat: src/server/game/CombatSystem.ts (handles attack logic, damage, NPC behavior)
- Inventory: src/server/game/EntitySchemas.ts, managed by GameRoom.ts (player inventory, item management)
- Economy: src/server/economy-integration.ts (syncs with Python Economy API)
- Discord Integration: src/server/discord-bot.ts (notifications, commands)
- Extension points: add new features by extending these modules or adding new services with memory/context anchors

## [2025-06-04] Legacy/Redundant File Archival
The following files were moved to /archive as they are no longer in active use or referenced by the current codebase:
- minimal.test.js
- minimal_test.py
- test_server_endpoints.py
- test_output.log
- test_output.txt
- temp_test_results.txt
- test_app.js
- Dockerfile.test
- TAVILY_TEST_ISSUE.md
- COMPREHENSIVE_MCP_COMPARISON_TEST.md

This improves clarity, reduces technical debt, and supports maintainable, AI-assisted development.

## [2025-06-04] CI Doc/Memory Hygiene Automation
A GitHub Actions workflow now enforces that any PR or push modifying core code (src/, agents/, economy/, etc.) must also update docs/ROADMAP.md or docs/MEMORIES.md. This ensures living documentation and memory remain up to date with all major changes. See .github/workflows/doc-memory-hygiene.yml for details.

*Update this document after every major planning session, sprint, or milestone.*
