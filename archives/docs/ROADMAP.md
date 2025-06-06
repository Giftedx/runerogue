# Project Roadmap

## Current Sprint Goals
- ✅ Complete trading system with validation and safety features
- ✅ Enhance Discord integration with rich notifications
- ✅ Improve multiplayer sync with delta updates and lag compensation
- ✅ Implement comprehensive skills system with OSRS XP curves
- ✅ Add player persistence with auto-save
- ✅ Create wave-based survivor mechanics
- Implement gathering skills mechanics (mining, woodcutting, fishing)
- Add client-side skill UI and progression display

## Next Milestones
- Resource Nodes: Mining rocks, trees, fishing spots with respawn timers
- Skill Actions: Gathering animations and success rates
- Achievement System with Discord notifications
- Guild/Party system for group play
- Advanced procedural generation (dungeons, boss rooms)
- PvP zones with ELO ranking

## Recently Completed

### [2025-06-05] Skills & Progression System
- Implemented all 23 OSRS skills with authentic XP curves
- Binary search level calculation for performance
- Skill boosts/drains with proper limits
- Combat level calculation using OSRS formula
- Total level and XP tracking
- Serialization for save/load functionality

### [2025-06-05] Player Persistence System
- JSON-based save system (MongoDB-ready)
- Auto-save every 60 seconds
- Save/load player stats, inventory, equipment, skills
- Leaderboard data aggregation
- Integration with GameRoom onJoin/onLeave

### [2025-06-05] Wave-based Survivor Mechanics
- Escalating wave difficulty with enemy scaling
- Boss waves every 5 waves
- Power-up system (damage, speed, defense, XP, drop rate boosts)
- Wave rewards (XP, gold, items, power-ups)
- Discord notifications for milestone waves
- Spawn positioning and enemy type selection

### [2025-06-05] Discord Bot Real Data Integration
- !stats command now shows real player data
- !leaderboard displays actual top players by XP
- !online shows real-time player count
- Stats embed with combat level, total level, XP

### [2025-06-05] Trading System Enhancements
- Added inventory space validation to prevent overflow
- Implemented trade timeout mechanism (2 minutes)
- Added item validation to prevent duplication exploits
- Added Discord notifications for completed trades
- Fixed trade state management and reconciliation

### [2025-06-05] Discord Integration Expansion
- Enhanced Discord bot with rich embeds for game events
- Added notifications for: player deaths, rare drops, trade completions, boss spawns, achievements
- Expanded bot commands: !stats, !online, !leaderboard, !drops, !wiki, !help
- Added game event webhook endpoint for external notifications

### [2025-06-05] Multiplayer Sync Improvements
- Implemented delta updates instead of full state broadcasts
- Added state snapshot history for reconciliation
- Implemented player input buffering for lag compensation
- Added critical update broadcasting for high-priority events
- Enhanced state synchronization with interpolation hints

### [2025-06-04] Directory Alignment & Refactor Plan
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
- Skills: src/server/game/SkillSystem.ts (XP, levels, boosts)
- Persistence: src/server/persistence/PlayerPersistence.ts (save/load)
- Waves: src/server/game/WaveManager.ts (survivor mechanics)
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
