# SPEC-2: RuneRogue - Current Architecture Blueprint

## Executive Summary

This document serves as the updated, authoritative blueprint for the **RuneRogue** project. It reflects the current architecture that has evolved from the original SPEC-1 document, highlighting the transition from a web scraping platform to a multiplayer game with real-time capabilities.

## Project Overview

### Vision Statement
RuneRogue is a sophisticated multiplayer game platform with real-time capabilities, social features, and an in-game economy system. It leverages a polyglot architecture with TypeScript and Python components to deliver a seamless gaming experience.

### Core Objectives
- Provide real-time multiplayer gameplay with Colyseus
- Deliver a TypeScript-based game server with Express.js REST API
- Integrate AI capabilities through the Python MCP server
- Maintain the economy and trading system
- Support both Godot game client and web-based Meta UI

## Technical Architecture

### System Components

#### 1. TypeScript Game Server (`src/server/`)
- **Primary Technology**: Node.js, Express.js, Colyseus
- **Features**:
  - Real-time game state synchronization
  - Game room management (`GameRoom.ts`)
  - Authentication and authorization
  - REST API endpoints
  - WebSocket communication
  - TypeORM database integration

#### 2. Python MCP Server (`agents/mcp/`)
- **Primary Technology**: Python, FastAPI
- **Features**:
  - Model Context Protocol (MCP) implementation
  - AI agent integration
  - OSRS data tools and access
  - Tool registration system

#### 3. Legacy Flask Application (`app.py`)
- **Primary Technology**: Python, Flask, SQLAlchemy
- **Features**:
  - Web scraping with multi-fallback patterns
  - Performance monitoring
  - Health checks
  - Social system database models

#### 4. Economy System (`economy_models/`)
- **Primary Technology**: Python, SQLAlchemy
- **Features**:
  - Player-to-player trading
  - Grand Exchange market system
  - Price history tracking
  - Inventory management
  - Audit logging

#### 5. Client Applications
- **Godot Game Client**: Primary game interface
- **Web Meta UI**: Account management and out-of-game features

## Development Requirements

### Core Dependencies

#### TypeScript Server Dependencies
```
@colyseus/core>=0.14.0
@colyseus/monitor>=0.14.0
@colyseus/schema>=1.0.0
express>=4.17.0
typeorm>=0.3.0
helmet>=7.0.0
cors>=2.8.0
```

#### Python MCP Server Dependencies
```
fastapi>=0.95.0
uvicorn>=0.22.0
pydantic>=2.0.0
```

#### Flask Application Dependencies
```
Flask>=2.0.0
SQLAlchemy>=1.4.0
requests>=2.25.0
beautifulsoup4>=4.9.0
```

### Development Dependencies

#### TypeScript Development
```
typescript>=5.0.0
jest>=29.0.0
ts-jest>=29.0.0
eslint>=8.0.0
prettier>=3.0.0
```

#### Python Development
```
flake8>=5.0.0
pytest>=7.0.0
pytest-mock>=3.8.0
pytest-cov>=4.0.0
black>=22.0.0
isort>=5.10.0
```

## Implementation Status

### Phase 1: Foundation (COMPLETED)
- [x] TypeScript game server setup with Colyseus
- [x] Basic game room implementation
- [x] Express API endpoints
- [x] Authentication system

### Phase 2: Enhancement (IN PROGRESS)
- [x] MCP server integration
- [x] AI agent capabilities
- [ ] Full economy system integration with TypeScript server
- [ ] Enhanced client-server communication

### Phase 3: Production (PLANNED)
- [ ] Complete test coverage
- [ ] Performance optimization
- [ ] Deployment automation
- [ ] Scaling strategy implementation

## Quality Assurance Standards

### Code Quality Requirements
- **TypeScript**: ESLint and Prettier compliance
- **Python**: flake8 compliance (max line length: 79)
- **Testing**: Minimum 90% code coverage (current coverage incomplete)
- **Documentation**: JSDoc for TypeScript, docstrings for Python

### Testing Protocols
```bash
# TypeScript tests
npm run test

# Python tests
pytest tests/ --cov=. --cov-report=term-missing
```

## Configuration Specifications

### Environment Variables
```bash
# TypeScript server
PORT=3001                # Game server port
NODE_ENV=development     # Environment mode
FRONTEND_URL=http://localhost:3000  # Frontend URL for CORS

# Python MCP server
MCP_PORT=8000           # MCP server port
MCP_HOST=localhost      # MCP server host

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/runerogue  # Database URL
```

## API Documentation

The API documentation has been split between the TypeScript game server and Python components:

### TypeScript Game Server Endpoints

#### GET /health
**Purpose**: Server health check
**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-06-02T12:00:00.000Z",
  "environment": "development",
  "version": "0.1.0",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

#### POST /auth/login
**Purpose**: User authentication
**Request**:
```json
{
  "username": "player1",
  "password": "password123"
}
```
**Response**:
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "username": "player1"
  }
}
```

### Colyseus Game Rooms

Game state synchronization is handled through Colyseus with the following room types:

- **GameRoom**: Main game room for player interaction and world state
- Events:
  - `move`: Player movement
  - `action`: Player actions (combat, skills, etc.)
  - `chat`: In-game chat messages

## Operational Directives

### Deployment Requirements
1. **Environment Preparation**
   - Node.js 18+ runtime
   - Python 3.8+ runtime
   - PostgreSQL database
   - Redis for caching (optional)

2. **Service Configuration**
   - Environment variable setup
   - Database migration
   - TypeScript build process

3. **Health Monitoring**
   - `/health` endpoint monitoring
   - Colyseus monitor interface
   - Log analysis

### Security Protocols
- JWT authentication
- Rate limiting
- Helmet security headers
- Input validation
- Regular dependency updates

## Compliance and Standards

### Development Standards
- **TypeScript**: Standard style with ESLint/Prettier
- **Python**: PEP 8 compliance
- **Version Control**: Git with conventional commits
- **Testing**: Test-driven development practices

### Security Standards
- **Data Protection**: No sensitive data logging
- **Access Control**: Role-based permissions
- **Audit Trail**: Comprehensive action logging
- **Encryption**: TLS for all external communications

## Architecture Evolution

This specification represents a significant evolution from the original SPEC-1 document. The project has transitioned from a Python/Flask-based web scraping platform to a TypeScript/Node.js game server with Python components for specific functionality. This architectural shift reflects the changing requirements and vision for the RuneRogue project.

---

**Document Version**: 2.0  
**Last Updated**: June 2, 2025  
**Review Cycle**: Quarterly  
**Status**: Draft - Pending Review
