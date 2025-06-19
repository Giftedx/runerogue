# AI Agent Memories & Context

## Key Decisions

- Loot system is modular (see LootManager)
- Economy API is Python FastAPI, not TypeScript

## User Preferences

- Modular, testable code
- Explicit error logging and recovery

## Current Goals (June 2025)

- Align directory structure (see ROADMAP.md)
- Ensure loot/inventory sync between TS server and Python API
- Expand Discord integration

## Known Pain Points

- AI gets lost in agents/ and services/ directories
- Some legacy files are not yet migrated

---

## [2025-06-04] Directory Alignment & AI Agent Plan

- AI agent is responsible for mapping, proposing, and executing directory alignment and refactor steps
- All changes must be documented in ROADMAP.md and MEMORIES.md
- AI agent will update memory anchors in all new/major entrypoints
- See ROADMAP.md for full plan

## [2025-06-04] Test Structure & AI Agent Responsibilities

- AI agent ensures all major test entrypoints have memory/context anchors
- Python: /tests/ and agents/mcp/tests/
- TypeScript: src/server/**tests**/
- Test structure is documented in ROADMAP.md and AI_AGENT_GUIDE.md

## [2025-06-04] Loot/Inventory Sync Test & Codebase Refactor

- End-to-end integration test for loot/inventory sync with Economy API is in place and passing
- Logger imports updated after directory flattening
- Test suite is robust and passing after refactor

## [2025-06-04] Legacy/Redundant File Archival

Archived the following files to /archive: minimal.test.js, minimal_test.py, test_server_endpoints.py, test_output.log, test_output.txt, temp_test_results.txt, test_app.js, Dockerfile.test, TAVILY_TEST_ISSUE.md, COMPREHENSIVE_MCP_COMPARISON_TEST.md. These files were unreferenced or obsolete, and this action improves codebase clarity and maintainability for both AI and human contributors.

## [2025-06-04] Integration Points Map (Auto-Generated)

## [2025-06-04] Test & Legacy Coverage Map (Auto-Generated)

### Python Tests (`tests/`):

- **test_app.py:**
  - Covers Flask endpoints: `/`, `/config`, `/scrape`, `/improvements/suggestions`, `/improvements/history`
  - Checks: API root, config, scraping, improvement suggestion logging/history, code quality suggestions
- **test_social.py:**
  - Covers `/api/social/chat/send`, `/api/social/parties`, `/api/social/users/{user_id}/friend-requests`, `/api/social/users/{user_id}/friends`
  - Systems: Chat, Party, Friends
- **test_trading_system.py:**
  - Trading system logic, DB-backed operations, trade acceptance, item transfer
- **test_economy_api.py:**
  - Economy API endpoints: trading, item management, trade acceptance
- **test_monitoring.py:**
  - Performance middleware, system metrics (CPU/memory/disk), middleware cleanup

### Direct DB Access Patterns:

- **services/auth/src/services/authService.ts**
  - Uses raw SQL queries for user authentication and validation:
    - `SELECT id, email, username, created_at, updated_at, is_active FROM users WHERE id = $1`
    - `SELECT * FROM users WHERE email = $1 AND is_active = true`
    - `SELECT id FROM users WHERE id = $1 AND is_active = true`
- **test_social.py, test_trading_system.py, test_economy_api.py:**
  - Use `db.session`, `session`, or direct DB manager for test setup and validation.

### Legacy Flask Integration Detected:

- **test_app.py:**
  - Tests legacy Flask endpoints and improvement logging.
- **test_monitoring.py:**
  - Tests Flask middleware.

### Game Server (TypeScript)

- **REST:** `/auth/discord`, `/auth/discord/callback`, `/auth/me`, `/health`, `/colyseus`, `/api-docs`
- **Colyseus Room:** `game` (with `onJoin`, `onLeave`, `onMessage` handlers)
- **Discord Bot:** `sendDiscordNotification`, `!stats <player>`
- **Economy API Client:** `addItemToInventory`, `removeItemFromInventory`, `getItem`, etc.

### Economy API (Python)

- **REST:** `/players`, `/items`, `/trades`, `/grand_exchange/offers`, `/items/{itemId}/price-history`
- **DB:** SQLAlchemy ORM (Item, InventoryItem, Trade, AuditLog)

### MCP Server (Python)

- **REST:** `/health`, `/token`, tool execution endpoints
- **Tool Registration:** `register_tool(...)`

---

## [Automated] Agentic Flows & MCP Tools Map (2025-06-04)

- Tools are registered with the MCP server using @tool decorators, Tool subclasses, and server.register_tool(...).
- Agentic workflows are enabled by exposing these tools via FastAPI endpoints, allowing AI agents and automation scripts to invoke them securely.
- Example tools: echo_tool, OSRSDataTool, generate_docs_tool, run_linting_tool, run_tests_tool.
- New tools/flows can be added by subclassing Tool or using the @tool decorator, supporting extensible agentic automation.
- All tools are discoverable at runtime and can be invoked synchronously or asynchronously.
- See ARCHITECTURE.md for detailed patterns and code samples.

---

_Update this file as the source of truth for AI and project context._
