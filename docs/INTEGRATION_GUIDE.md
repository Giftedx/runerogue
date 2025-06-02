# RuneRogue Integration Guide

This document provides detailed guidance on how the different components of the RuneRogue architecture should interact with each other, focusing on integration points and communication patterns.

## Component Integration Matrix

| Component A | Component B | Integration Method | Status | Notes |
|-------------|-------------|-------------------|--------|-------|
| TypeScript Game Server | Godot Client | WebSockets (Colyseus) | Implemented | Primary real-time game communication |
| TypeScript Game Server | Web Meta UI | REST API | Implemented | Account management, configuration |
| TypeScript Game Server | MCP Server | REST API | Partial | AI agent integration needs strengthening |
| TypeScript Game Server | Economy System | Indirect | Missing | **Needs implementation** |
| MCP Server | Economy System | Python Imports | Partial | Data access without full integration |
| Flask App | Economy System | Python Imports | Implemented | Legacy integration |

## Communication Protocols

### 1. Game Client ↔ Game Server

#### WebSocket Communication (Colyseus)

The primary game state synchronization happens through Colyseus:

```typescript
// Client-side connection (Godot with TypeScript)
const client = new Colyseus.Client('ws://localhost:3001');
const room = await client.joinOrCreate('game_room', { 
  playerName: 'Player1',
  authToken: 'jwt-token'
});

// Listen for state changes
room.onStateChange((state) => {
  updateGameState(state);
});

// Send player actions
room.send('move', { x: 100, y: 200 });
room.send('action', { type: 'attack', targetId: 'enemy1' });
```

```typescript
// Server-side handling (GameRoom.ts)
this.onMessage('move', (client, message) => {
  const player = this.state.players.get(client.sessionId);
  player.x = message.x;
  player.y = message.y;
});

this.onMessage('action', (client, message) => {
  const player = this.state.players.get(client.sessionId);
  // Handle player action
});
```

#### REST API Communication

For non-real-time operations like authentication:

```typescript
// Client-side API call
async function login(username, password) {
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return response.json();
}
```

### 2. Game Server ↔ MCP Server

The TypeScript Game Server should communicate with the MCP Server using REST API calls:

```typescript
// TypeScript Game Server
import fetch from 'node-fetch';

async function getOSRSData(itemName: string): Promise<any> {
  const response = await fetch(`http://localhost:8000/tools/osrs-data?item=${itemName}`);
  return response.json();
}
```

```python
# MCP Server route
@app.get("/tools/osrs-data")
async def get_osrs_data(item: str):
    data = osrs_tool.execute({"item": item})
    return data
```

### 3. Game Server ↔ Economy System (Proposed Integration)

Currently, the TypeScript Game Server doesn't directly integrate with the Python Economy System. Here's a proposed integration approach:

#### Option 1: Economy REST API

Create a dedicated REST API for the Economy System:

```python
# economy_api.py
from fastapi import FastAPI
from sqlalchemy.orm import Session
from economy_models.economy import DatabaseManager, Item, Trade

app = FastAPI()
db_manager = DatabaseManager("sqlite:///runerogue.db")

@app.get("/items/{item_id}")
def get_item(item_id: int):
    with db_manager.get_session() as session:
        item = session.query(Item).filter(Item.id == item_id).first()
        return {
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "value": item.base_value,
            "tradeable": item.is_tradeable
        }

@app.post("/trades")
def create_trade(trade_data: dict):
    # Create a new trade
    pass
```

```typescript
// TypeScript Game Server
async function getItemDetails(itemId: number): Promise<any> {
  const response = await fetch(`http://localhost:8001/items/${itemId}`);
  return response.json();
}
```

#### Option 2: Shared Database

Both systems could access the same database with careful schema design:

```typescript
// TypeScript Game Server with TypeORM
@Entity()
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // Other properties
}

// Access the shared database
const itemRepository = getRepository(Item);
const item = await itemRepository.findOne(itemId);
```

## Integration Implementation Plan

### Phase 1: Document Current Integration Points

1. Map all existing API endpoints
2. Document WebSocket message types
3. Identify shared resources (databases, files)

### Phase 2: Economy System Integration

1. Create an Economy API service (FastAPI recommended)
2. Implement endpoints for:
   - Item information
   - Player inventory management
   - Trading functionality
   - Grand Exchange operations
3. Update TypeScript Game Server to consume these endpoints

### Phase 3: MCP Server Enhancement

1. Expand MCP server capabilities
2. Create structured API documentation
3. Implement proper error handling and validation

### Phase 4: Legacy System Migration

1. Identify essential functionality in the Flask application
2. Gradually migrate to the new architecture
3. Deprecate redundant components

## Configuration Management

### Environment Variables

A consolidated `.env` file should be created with all necessary configuration:

```
# TypeScript Game Server
TS_PORT=3001
NODE_ENV=development

# MCP Server
MCP_PORT=8000
MCP_HOST=localhost

# Economy API
ECONOMY_API_PORT=8001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=runerogue
DB_USER=postgres
DB_PASS=password

# Shared
FRONTEND_URL=http://localhost:3000
```

### Service Discovery

For local development, hardcoded URLs can be used. For production, consider implementing service discovery or using environment variables for service locations.

## Testing Integration Points

Each integration point should have dedicated integration tests:

```typescript
// Test TypeScript to MCP Server integration
describe('MCP Server Integration', () => {
  it('should retrieve OSRS item data', async () => {
    const data = await getOSRSData('Dragon Scimitar');
    expect(data).toHaveProperty('name', 'Dragon Scimitar');
    expect(data).toHaveProperty('value');
  });
});
```

```python
# Test Economy API
def test_get_item_endpoint():
    response = client.get("/items/1")
    assert response.status_code == 200
    assert response.json()["name"] == "Dragon Scimitar"
```

## Troubleshooting Common Integration Issues

### CORS Issues

Ensure all services have proper CORS configuration:

```typescript
// TypeScript server
app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',') || 'http://localhost:3000',
  credentials: true
}));
```

```python
# FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Authentication Propagation

When one service calls another, authentication needs to be propagated:

```typescript
// TypeScript server calling Economy API
async function getPlayerInventory(playerId: string, authToken: string) {
  const response = await fetch(`http://localhost:8001/players/${playerId}/inventory`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  return response.json();
}
```

## Conclusion

This integration guide provides a roadmap for connecting the various components of the RuneRogue architecture. By following these guidelines, developers can ensure that the system functions cohesively despite its polyglot nature.

The most critical integration points to address are:
1. TypeScript Game Server ↔ Economy System
2. Enhanced TypeScript Game Server ↔ MCP Server communication
3. Legacy Flask App migration or retirement

---

**Document Version**: 1.0  
**Last Updated**: June 2, 2025  
**Status**: Draft - Pending Review
