# RuneRogue Developer Quick Reference

This document provides a quick reference for developers working on the RuneRogue project. It summarizes the current architecture, key components, and development workflows.

## Project Overview

RuneRogue is a multiplayer game with real-time capabilities, social features, and an in-game economy. The project uses a polyglot architecture with TypeScript and Python components.

## Key Components

### 1. TypeScript Game Server (`src/server/`)

The primary backend component for game functionality.

- **Technology**: Node.js, Express.js, Colyseus
- **Key Files**:
  - `src/server/index.ts` - Main server setup
  - `src/server/game/GameRoom.ts` - Colyseus room implementation
  - `src/server/routes/auth.ts` - Authentication endpoints
- **Development Workflow**:

  ```bash
  # Install dependencies
  npm install

  # Start development server
  npm run dev

  # Run tests
  npm test

  # Build for production
  npm run build
  ```

### 2. Python MCP Server (`agents/mcp/`)

AI agent integration server using FastAPI.

- **Technology**: Python, FastAPI
- **Key Files**:
  - `run_mcp_server.py` - Main server entry point
  - `agents/mcp/server.py` - MCP server implementation
  - `agents/mcp/tools.py` - Tool implementations
- **Development Workflow**:

  ```bash
  # Install dependencies
  pip install -r requirements.txt

  # Start MCP server
  python run_mcp_server.py
  ```

### 3. Economy System (`economy_models/`)

Python-based economy system with SQLAlchemy models.

- **Technology**: Python, SQLAlchemy
- **Key Files**:
  - `economy_models/economy.py` - Core economy models
  - `economy_models/osrs_parser.py` - Data parsing utilities
- **Integration**: Currently accessed directly by Python components; needs API integration with TypeScript server

### 4. Legacy Flask App (`app.py`)

Original web scraping platform, partially integrated.

- **Technology**: Python, Flask
- **Key Files**:
  - `app.py` - Main Flask application
  - `scraper.py` - Web scraping implementation
  - `models.py` - Social system models
- **Development Workflow**:
  ```bash
  # Start Flask app
  python app.py
  ```

### 5. Client Applications

- **Godot Game Client** (`client/godot/`): Primary game interface
- **Web Meta UI** (`client/meta-ui/`): Account management interface

## Architecture Diagram

```
+----------------+         +----------------------+
| Godot Client   |<------->| TypeScript Server   |
|                |         | (Express + Colyseus) |
+----------------+         | Port: 3001          |
                           +----------------------+
+----------------+                 |
| Web Meta UI    |<--------------->|
|                |                 |
+----------------+                 v
                           +----------------------+
                           | Python MCP Server   |
                           | (FastAPI)           |
                           | Port: 8000          |
                           +----------------------+
                                     |
+-----------------+        +---------v----------+
| Flask App       |------->| Economy System     |
| (Legacy)        |        | (Python/SQLAlchemy)|
| Port: 5000      |        |                    |
+-----------------+        +--------------------+
```

## Ports and Endpoints

| Service           | Default Port | Key Endpoints                   |
| ----------------- | ------------ | ------------------------------- |
| TypeScript Server | 3001         | `/auth/*`, `/health`, WebSocket |
| MCP Server        | 8000         | `/tools/*`                      |
| Flask App         | 5000         | `/`, `/scrape`, `/health`       |

## Common Development Tasks

### 1. Adding a New Game Feature

1. Add schema definition in `GameRoom.ts`
2. Implement server-side logic in GameRoom class
3. Add client-side handling in Godot client
4. Add tests for new functionality

Example of adding a player skill:

```typescript
// In GameRoom.ts schema section
class PlayerSkills extends Schema {
  @type("number") mining: number = 1;
  @type("number") fishing: number = 1;
  // Add new skill
  @type("number") woodcutting: number = 1;
}
```

### 2. Creating a New API Endpoint

1. Add route file in `src/server/routes/`
2. Register route in `src/server/index.ts`
3. Add authentication if required
4. Add tests

Example of a new endpoint:

```typescript
// In src/server/routes/items.ts
import express from "express";
import { authMiddleware } from "../auth/middleware";

const router = express.Router();

router.get("/:itemId", authMiddleware, async (req, res) => {
  try {
    const itemId = req.params.itemId;
    // Fetch item logic
    res.json({ id: itemId, name: "Sample Item" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export const itemsRouter = router;
```

```typescript
// In src/server/index.ts
import { itemsRouter } from "./routes/items";
// ...
app.use("/items", itemsRouter);
```

### 3. Working with the Economy System

Currently, direct integration is in development. For now:

1. Use Python scripts to interact with economy models
2. In the future, use the Economy API (in development)

### 4. Running the Full Stack

1. Start the TypeScript server: `npm run dev`
2. Start the MCP server: `python run_mcp_server.py`
3. Start the Flask app (if needed): `python app.py`
4. Open the Godot client or web UI

## Testing

### TypeScript Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- -t "GameRoom"

# Run with coverage
npm run test:coverage
```

### Python Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_economy.py

# Run with coverage
pytest --cov=.
```

## Documentation Resources

For more detailed information, refer to:

- [Updated Architecture](./UPDATED_ARCHITECTURE.md) - Comprehensive architecture overview
- [Integration Guide](./INTEGRATION_GUIDE.md) - Details on component integration
- [Migration Plan](./MIGRATION_PLAN.md) - Plan for evolving the architecture
- [SPEC-2](./SPEC-2.md) - Current project specification

## Getting Help

1. Check the documentation first
2. Review related test cases for usage examples
3. Ask in the team chat: #runerogue-dev
4. File an issue if you've found a bug

---

**Document Version**: 1.0  
**Last Updated**: June 2, 2025  
**Status**: Draft - For Developer Use
