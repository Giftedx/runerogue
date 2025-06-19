# RuneRogue Full Architecture & Integration Map

## 1. Visual Directory Tree (Top-Level to Deepest Integration Points)

### 2.1. TypeScript Game Server

- **Location:** `src/server`
- **Technology Stack:** Node.js, Express, Colyseus (for real-time multiplayer), TypeORM, Redis, Axios, Swagger UI, Winston (logging).
- **Responsibilities:**
  - Manages game state and real-time interactions via Colyseus rooms.
  - Handles user authentication (Discord OAuth2).
  - Serves the web-based Meta UI client.
  - Integrates with the Python Economy API for game economy operations.
  - Exposes API endpoints for game-related functionalities and health checks.
  - Hosts the consolidated OpenAPI (Swagger) documentation.
- **Key Files:**
  - `src/server/index.ts`: Main server entry point, Express app setup, middleware, routes.
  - `src/server/routes/auth.ts`: Discord OAuth2 authentication routes.
  - `src/server/economy-integration.ts`: Wrapper for `EconomyClient` providing game-specific economy methods, caching, and error handling.
  - `src/services/economy-client.ts`: Handles REST API calls to the Python Economy API using Axios.
  - `src/server/docs/swagger.yaml`: Consolidated OpenAPI specification for all APIs.

### 2.2. Python FastAPI Economy API

- **Location:** `economy_api`
- **Technology Stack:** Python, FastAPI, Pydantic, SQLAlchemy, OAuth2 JWT.
- **Responsibilities:**
  - Provides a dedicated API for all game economy-related operations.
  - Manages player inventories, items, trades, and Grand Exchange offers.
  - Interacts with the Economy Database.
- **Key Files:**
  - `economy_api/main.py`: FastAPI application entry point, defines economy API routes.
  - `economy_api/models.py`: SQLAlchemy models for economy data.
  - `economy_api/schemas.py`: Pydantic schemas for API request/response validation.

### 2.3. Python Flask Legacy Backend

- **Location:** Root directory (`app.py`)
- **Technology Stack:** Python, Flask, Flask-SQLAlchemy.
- **Responsibilities:**
  - Handles web scraping functionalities (multi-fallback pattern).
  - Provides social features (if implemented).
  - Exposes endpoints for configuration, health monitoring, performance metrics, and improvement suggestions.
  - Interacts with the Social Database.
- **Key Files:**
  - `app.py`: Main Flask application, defines routes for scraping, health, config, etc.
  - `config.py`: Application configuration for the Flask app.

### 2.4. Python FastAPI Model Control Protocol (MCP) Server

- **Location:** `agents/mcp`
- **Technology Stack:** Python, FastAPI.
- **Responsibilities:**
  - Acts as a central hub for AI agent interactions and tool execution.
  - Exposes endpoints for token management, tool listing, and asynchronous tool execution.
  - Facilitates research and data access for AI agents (e.g., OSRS data analysis).
- **Key Files:**
  - `agents/mcp/main.py`: Entry point for the MCP server.
  - `agents/mcp/server.py`: Implements the FastAPI application for MCP functionalities.

## 3. Data Flow and Inter-service Communication

```mermaid
graph TD
    Client1[Godot Game Client] -->|WebSockets/HTTP| GameServer
    Client2[Web Meta UI] -->|HTTP| GameServer

    GameServer -->|REST API (Axios)| EconomyAPI[Python FastAPI Economy API]
    GameServer -->|REST API (Axios)| MCPServer[Python FastAPI MCP Server]
    GameServer -->|REST API (Axios)| FlaskApp[Python Flask Legacy Backend]

    EconomyAPI -->|SQLAlchemy| EconomyDB[(Economy Database)]
    FlaskApp -->|SQLAlchemy| SocialDB[(Social Database)]
    GameServer -->|TypeORM| GameDB[(Game Database)]

    MCPServer -- Optional Data Access --> EconomyDB
    MCPServer -- OSRS Data Sources --> ExternalAPIs[External OSRS APIs/Data]

    subgraph Clients
        Client1
        Client2
    end

    subgraph Backend Services
        GameServer
        EconomyAPI
        FlaskApp
        MCPServer
    end

    subgraph Databases
        GameDB
        EconomyDB
        SocialDB
    end

    ExternalAPIs -- Provides Data --> MCPServer
```

### 3.1. Client-Server Communication

- **Godot Game Client & Web Meta UI:** Both clients primarily interact with the **TypeScript Game Server** via HTTP for general API calls and WebSockets (Colyseus) for real-time game state synchronization.
- **Web Meta UI - Legacy Interaction:** The Web Meta UI might have some legacy direct interactions with the Flask App, though the primary interaction is intended to be through the TypeScript Game Server acting as an API Gateway.

### 3.2. Inter-Service Communication

- **TypeScript Game Server as API Gateway:** The Game Server acts as the primary API gateway, routing requests to the appropriate backend services.
  - **To Economy API:** The Game Server makes REST API calls to the **Python FastAPI Economy API** for all economy-related operations (e.g., player inventory, trades, Grand Exchange). This is handled by `economy-client.ts`.
  - **To MCP Server:** The Game Server makes REST API calls to the **Python FastAPI MCP Server** for AI-assisted functionalities, tool execution, and data retrieval.
  - **To Flask App:** The Game Server makes REST API calls to the **Python Flask Legacy Backend** for web scraping, health checks, and other legacy functionalities.
- **MCP Server - Economy Database Access (Unclear/Optional):** The MCP Server _may_ have direct read-only access to the Economy Database for research and analysis purposes, bypassing the Economy API. This needs to be confirmed and documented if it's an intended pattern.
- **Flask App - Economy System (Legacy):** The Flask App historically imported and used the `EconomySystem` directly. In the current architecture, the primary interaction with economy logic should be via the dedicated FastAPI Economy API.

## 4. Databases

- **Game Database (TypeORM):** Used by the TypeScript Game Server for core game data (e.g., player accounts, game progress).
- **Economy Database (SQLAlchemy):** Used by the Python FastAPI Economy API for all economy-related data (e.g., items, transactions, Grand Exchange listings).
- **Social Database (SQLAlchemy):** Used by the Python Flask Legacy Backend for social features (e.g., friends lists, chat history - if implemented).

## 5. API Documentation

- **Consolidated OpenAPI (Swagger):** The primary source of API documentation is the `swagger.yaml` file, served by Swagger UI from the TypeScript Game Server at `/api-docs`. This file aims to consolidate the API definitions for the TypeScript Game Server, Python FastAPI Economy API, Python Flask Legacy Backend, and Python FastAPI MCP Server.

## 6. AI-Assisted Development

- The project heavily leverages AI-assisted development, including GitHub Copilot Agents, custom MCP tools, and integrations with external AI services (e.g., Brave Search, Firecrawl, Tavily) via the MCP Server for research and automation.

## 7. Discrepancies and Future Considerations

- **Authentication Service:** The `docs/API-CONTRACT.md` describes a separate authentication service. This needs clarification: is it a future planned service, or is the current Discord OAuth2 handling in the TypeScript server the definitive approach?
- **Legacy Flask App Role:** While integrated, the Flask App's long-term role needs to be defined. Is it being phased out, or will it continue to host specific functionalities?
- **MCP Server - Direct DB Access:** The direct access of the MCP Server to the EconomyDB needs to be confirmed and documented if it's a valid pattern.

This document will be continuously updated to reflect the evolving architecture of RuneRogue.

---

## Integration Points Map (Auto-Generated, 2025-06-04)

---

## Test & Legacy Coverage Map (Auto-Generated, 2025-06-04)

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

---

### Game Server (TypeScript)

- **REST:** `/auth/discord`, `/auth/discord/callback`, `/auth/me`, `/health`, `/colyseus`, `/api-docs`
- **Colyseus Room:** `game` (with `onJoin`, `onLeave`, `onMessage` handlers)
- **Discord Bot:** `sendDiscordNotification`, `!stats <player>`
- **Economy API Client:** `addItemToInventory`, `removeItemFromInventory`, `getItem`, etc.
- **AI Integration:** Uses `AiServiceClient` to call AI service endpoints (`/analyze-difficulty`, `/adjust-parameters`) for adaptive difficulty.

### Auth Service (TypeScript/Express)

- **REST:** `/health`, `/register`, `/login`
- **Implementation:** Express.js, TypeScript; uses `authService` for user registration, login, password hashing, JWT token generation.

### AI Service (Python/FastAPI)

- **REST:** `/health`, `/analyze-difficulty`, `/adjust-parameters`
- **Implementation:** FastAPI, Python; uses `GeminiClient` for AI model calls and `AdaptiveDifficultySystem` for dynamic difficulty adjustment.

### Economy API (Python)

- **REST:** `/players`, `/items`, `/trades`, `/grand_exchange/offers`, `/items/{itemId}/price-history`
- **DB:** SQLAlchemy ORM (Item, InventoryItem, Trade, AuditLog)

### MCP Server (Python)

- **REST:** `/health`, `/token`, tool execution endpoints
- **Tool Registration:** `register_tool(...)`

---

## Agentic Flows & MCP Tools Map (Auto-Generated, 2025-06-04)

### Tool Registration & Discovery

- Tools are registered with the MCP server using:
  - The `@tool` decorator (for async function tools).
  - The `Tool` class (for custom tool classes).
  - `server.register_tool(...)` for both.
- Example tools:
  - `echo_tool`: Echoes input.
  - `OSRSDataTool`, `osrs_design_tool`, `osrs_search_tool`: OSRS data/design tools.
  - `generate_docs_tool`, `run_linting_tool`, `run_tests_tool`: Docs, linting, and test automation.
- All tools are discoverable at runtime and exposed via the MCP FastAPI server for agentic invocation.

### Agentic Invocation Patterns

- Tools are invoked via REST endpoints (e.g., `/tools/{tool_name}`) with JWT authentication.
- Tools can be executed synchronously or asynchronously.
- Agentic workflows are enabled by exposing these tools to AI agents, automation scripts, and human users.

### Extensibility

- New tools can be added by subclassing `Tool` or using the `@tool` decorator.
- Agentic flows are extensible and can include:
  - Automation of documentation, linting, and testing.
  - Data access, research, and integration with external APIs.

### Example: Registering a Custom Tool

```python
@tool(
    name="my_tool",
    description="My custom tool",
    parameters={
        "type": "object",
        "properties": {"param1": {"type": "string"}},
        "required": ["param1"]
    }
)
async def my_tool(param1: str) -> dict:
    return {"result": param1}

server.register_tool(my_tool)
```

---
