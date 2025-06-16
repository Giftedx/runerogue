---
applyTo: "**"
---

# RuneRogue Technical Architecture

## System Overview

RuneRogue uses a modern multiplayer game architecture designed for real-time collaboration while maintaining OSRS authenticity.

## Core Architecture Components

### Server Structure (packages/server/)

```typescript
// Main server implementation with Colyseus integration
export class GameRoom extends Room<GameState> {
  gameEngine: GameEngine;

  onCreate(options: any) {
    this.setState(new GameState());
    this.gameEngine = new GameEngine(this.state);
    // Set up message handlers and game logic
  }
}
```

### OSRS Data Pipeline (packages/osrs-data/)

```typescript
// Combat calculations and data serving
export const CombatCalculator = {
  calculateDamage(attacker: CombatStats, defender: CombatStats): number {
    // Authentic OSRS combat formulas
  },

  calculateHitChance(accuracy: number, defence: number): number {
    // OSRS hit chance calculations
  },
};
```

### Client Architecture

**Phaser Web Client (packages/phaser-client/)**

- Multiple demo implementations (working-client.html, enhanced-client.html)
- WebGL rendering with Phaser 3
- Real-time server communication

**Godot Native Client (client/godot/)**

- Cross-platform native client
- Alternative to web-based approach
- Direct Colyseus integration

## Data Flow

### Client ↔ Server Communication

1. **Client connects** to Colyseus room via WebSocket
2. **Server validates** client requests and updates game state
3. **Colyseus broadcasts** state changes to all connected clients
4. **Clients render** updated state using Phaser/Godot

### OSRS Data Access

1. **Express API** serves OSRS data from packages/osrs-data
2. **Game server** fetches combat formulas and item stats
3. **Clients request** additional data for UI and displays
4. **Calculations** performed server-side for authenticity

## Performance Optimization

### Server Architecture

- **Colyseus rooms** handle up to 4 players per game session
- **Express APIs** serve static OSRS data efficiently
- **State synchronization** optimized for real-time gameplay
- **Memory management** through proper object lifecycle

### Client Optimization

- **Phaser rendering** targets 60fps with optimized sprites
- **Network efficiency** through Colyseus delta compression
- **Asset loading** minimized for fast startup times
- **Multiple client options** for different platforms/preferences

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
