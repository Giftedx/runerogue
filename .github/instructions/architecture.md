---
applyTo: "**"
---

# RuneRogue Technical Architecture

## System Overview

RuneRogue uses a modern multiplayer game architecture designed for real-time collaboration while maintaining OSRS authenticity.

## Core Architecture Components

### Entity Component System (bitECS)

```typescript
// Component definitions
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

export const Combat = defineComponent({
  level: Types.ui8,
  xp: Types.ui32,
  attackBonus: Types.i16,
  strengthBonus: Types.i16,
  defenseBonus: Types.i16,
});

export const Health = defineComponent({
  current: Types.ui16,
  max: Types.ui16,
});
```

### System Processing Order

1. **Input System** - Process player commands
2. **Movement System** - Update positions and pathfinding
3. **Combat System** - Calculate damage and apply effects
4. **Prayer System** - Handle prayer drain and effects
5. **Health System** - Process HP changes and death
6. **Spawn System** - Create new enemies
7. **Cleanup System** - Remove dead entities

### Multiplayer Server (Colyseus)

```typescript
export class GameRoom extends Room<GameRoomState> {
  world: World;

  async onCreate(options: any) {
    this.setState(new GameRoomState());
    this.world = createWorld();
    this.startGameLoop();
  }

  private startGameLoop() {
    setInterval(() => {
      this.updateSystems();
      this.broadcastChanges();
    }, 50); // 20 TPS
  }
}
```

## Data Flow

### Client → Server

1. Player input (movement, combat commands)
2. Server validates input (anti-cheat)
3. ECS systems process changes
4. State updated in Colyseus schema

### Server → Client

1. Colyseus broadcasts state changes
2. Client interpolates between states
3. Phaser renders updated positions
4. UI reflects current stats

## Performance Optimization

### Object Pooling

- Reuse damage events and particles
- Pool enemy entities for respawning
- Cache frequently accessed components

### Spatial Partitioning

- Grid-based collision detection
- Only process nearby entities
- Efficient range queries for combat

### Network Optimization

- Delta compression for state updates
- Message batching for high-frequency events
- Client-side prediction for responsiveness

## Security Measures

### Server Authority

- All game logic runs on server
- Client inputs are validated
- State changes are authoritative

### Anti-Cheat

- Movement speed validation
- Attack range verification
- Prayer point drain enforcement
- XP gain validation

## Monitoring & Debugging

### Performance Metrics

- Server tick rate (target: 20 TPS)
- Client frame rate (target: 60 FPS)
- Network latency monitoring
- Memory usage tracking

### Logging

- Structured logging with Winston
- Error tracking and reporting
- Performance profiling
- User action analytics
