# RuneRogue: Updated Architecture Documentation

This document provides an updated overview of the RuneRogue project architecture, reconciling the discrepancies between the original documentation and the current implementation.

## Executive Summary

RuneRogue has evolved from its original conception as a web scraping platform into a full-featured multiplayer game with real-time capabilities, social features, and an economy system. The architecture now consists of a polyglot backend with both TypeScript and Python components, supporting multiple client applications.

## Current Architecture Overview

![RuneRogue Architecture](https://i.imgur.com/placeholder.png)

### Core Components

#### 1. TypeScript Game Server (`src/server/`)

- **Technology**: Node.js, Express.js, Colyseus
- **Purpose**: Primary game server with real-time multiplayer functionality
- **Port**: 3001 (default)
- **Key Features**:
  - Real-time game state synchronization
  - Game room management (`GameRoom.ts`)
  - Authentication and authorization
  - REST API endpoints
  - WebSocket communication via Colyseus
- **Dependencies**:
  - Colyseus for real-time multiplayer
  - Express.js for HTTP API
  - TypeORM for database connectivity
  - Helmet, rate limiting for security

#### 2. Python FastAPI MCP Server (`agents/mcp/`)

- **Technology**: Python, FastAPI
- **Purpose**: Model Context Protocol (MCP) server for AI agent integration
- **Port**: 8000
- **Key Features**:
  - AI agent tools and capabilities
  - OSRS data access and processing
  - Tool registration system
- **Integration Points**:
  - Provides game data to TypeScript server
  - Supports AI-assisted gameplay

#### 3. Legacy Python Flask Application (`app.py`)

- **Technology**: Python, Flask, SQLAlchemy
- **Purpose**: Web scraping and data processing (original core functionality)
- **Port**: 5000 (inferred from documentation)
- **Key Features**:
  - Multi-fallback web scraping
  - Performance monitoring
  - Health metrics
  - Database models for social features
- **Current Status**: Partially integrated, likely being phased out or repurposed

#### 4. Economy System (`economy_models/`)

- **Technology**: Python, SQLAlchemy
- **Purpose**: In-game economy, trading, and Grand Exchange
- **Key Features**:
  - Player-to-player trading
  - Grand Exchange market system
  - Price history tracking
  - Audit logging
- **Integration Points**:
  - Unclear how this integrates with the TypeScript game server

### Client Applications

#### 1. Godot Game Client (`client/godot/`)

- **Technology**: Godot Engine
- **Purpose**: Primary game client
- **Features**:
  - Game rendering and UI
  - Player interaction
  - Real-time communication with game server

#### 2. Meta UI (`client/meta-ui/`)

- **Technology**: Web-based (likely React or Vue, details not confirmed)
- **Purpose**: Out-of-game interface
- **Features**:
  - Account management
  - Social features
  - Configuration

### Database Systems

The project appears to use multiple database models:

1. **Game Data** (TypeScript/TypeORM)

   - Player game state
   - Authentication

2. **Social System** (Python/SQLAlchemy)

   - Users, Friendships, Parties
   - Chat messages

3. **Economy System** (Python/SQLAlchemy)
   - Items, Trades, Offers
   - Price history
   - Audit logs

## Integration Points & Communication Flow

### Server-to-Server Communication

- **Game Server ↔ MCP Server**: REST API calls (exact mechanism undocumented)
- **Game Server ↔ Flask App**: Likely minimal or non-existent integration

### Client-to-Server Communication

- **Godot Client ↔ Game Server**:
  - WebSockets for real-time game state (Colyseus)
  - HTTP for authentication and non-real-time actions
- **Meta UI ↔ Game Server**: HTTP API calls
- **Meta UI ↔ Flask App**: Possibly some legacy integrations

### Database Access

- TypeScript server uses TypeORM
- Python components use SQLAlchemy
- Database sharing strategy is unclear from the code examined

## Port Configuration

| Component              | Port | Environment Variable        |
| ---------------------- | ---- | --------------------------- |
| TypeScript Game Server | 3001 | PORT                        |
| Python MCP Server      | 8000 | (Not explicitly documented) |
| Flask Application      | 5000 | PORT (inferred)             |
| Frontend/Meta UI       | 3000 | (Referenced in CORS config) |

## Development Workflow

The project supports various development scripts:

```bash
# TypeScript server
npm run dev       # Start TypeScript server in development mode
npm run build     # Build TypeScript server
npm run test      # Run tests

# Python components
python run_mcp_server.py   # Start MCP server
python app.py              # Start Flask application
```

## Recommendations for Architecture Reconciliation

1. **Documentation Update**: All documentation should be updated to reflect the current architecture with TypeScript as the primary game server.

2. **Architectural Decision Records**: Create ADRs to document when and why architectural decisions were made, particularly the shift from Python to TypeScript.

3. **Integration Clarification**: Explicitly document how the TypeScript game server interacts with Python components (if at all).

4. **Port Standardization**: Consider standardizing ports or at least documenting their purpose clearly.

5. **Dependency Management**: Consider using a monorepo tool like Lerna or Nx to manage the polyglot codebase.

6. **Transition Strategy**: Decide if the Flask application should be maintained, migrated to TypeScript, or retired.

7. **Test Coverage**: Expand test coverage, particularly for TypeScript components.

---

**Document Version**: 1.0  
**Last Updated**: June 2, 2025  
**Author**: GitHub Copilot  
**Status**: Draft - Pending Review
