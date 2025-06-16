---
applyTo: "**"
---

# RuneRogue Core Development Instructions

## OSRS Authenticity Requirements

**CRITICAL**: All game mechanics must exactly match Old School RuneScape. No approximations or shortcuts.

### Combat Calculations

- Use exact OSRS damage formulas from `packages/osrs-data/`
- Attack speed must be precise: 4-tick (2.4s), 5-tick (3.0s), 6-tick (3.6s)
- Combat level calculation must match OSRS Wiki exactly
- Prayer effects and drain rates must be authentic

### Data Validation

- Cross-reference all stats with OSRS Wiki
- Use existing OSRS data pipeline for validation
- Test calculations against known OSRS values

## TypeScript Standards

### Type Safety

- Use strict TypeScript settings, no `any` types
- Define proper interfaces for all game data structures
- Add comprehensive JSDoc documentation
- Implement proper error handling with Result types

### Performance Requirements

- Target 60fps with 4+ players
- Use object pools for frequently created objects
- Optimize ECS queries and systems
- Profile hot code paths regularly

## Architecture Patterns

### Server Design

- **Colyseus Rooms**: Handle 2-4 player game sessions
- **Express APIs**: Serve OSRS data and static content
- **Schema-based State**: Use @colyseus/schema for synchronization
- **Modular Packages**: Separate concerns (osrs-data, game-server, shared)

### Client Architecture

- **Multiple Client Support**: Phaser web client + Godot native client
- **Real-time Sync**: WebSocket connection to Colyseus rooms
- **Responsive Design**: Target 60fps rendering on both platforms
- **State Management**: Client-side prediction with server authority

### Multiplayer Authority

- **Server-authoritative**: All game logic and validation on server
- **Client Prediction**: Smooth movement and interaction feedback
- **State Synchronization**: Efficient delta updates via Colyseus
- **Anti-cheat**: Server validates all player actions and state changes

## Testing Requirements

### Current Test Status

- **Passing Tests**: 27 tests across core packages
- **Failing Tests**: 79 tests (mostly archived legacy tests with missing dependencies)
- **Priority**: Stabilize core functionality tests before adding new features
- **Test Organization**: Active tests in packages/, archived tests need cleanup

### Coverage Standards

- **OSRS Calculations**: 100% coverage required for combat formulas
- **Core Game Logic**: 95% coverage minimum for game server functionality
- **API Endpoints**: Integration tests for all OSRS data access
- **Client Integration**: Connection and synchronization tests needed

### Test Types

- **Unit Tests**: Individual function validation (Jest)
- **Integration Tests**: API endpoint and data pipeline tests
- **OSRS Validation**: Calculations against known Wiki values
- **Multiplayer Tests**: Colyseus room and state synchronization

## Code Quality

### Error Handling

- Use try-catch for all async operations
- Implement graceful error recovery
- Add structured logging with context
- Provide meaningful error messages

### Documentation

- JSDoc for all public APIs
- Include code examples in documentation
- Document OSRS Wiki sources for calculations
- Maintain architectural decision records
