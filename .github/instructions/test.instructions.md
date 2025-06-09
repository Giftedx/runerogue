---
applyTo: '**'
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

### ECS Design
- Use bitECS for all game entities and systems
- Keep components data-only, logic in systems
- Maintain clear system execution order
- Implement efficient entity queries

### Multiplayer Authority
- Server-authoritative design for all game logic
- Validate all client inputs server-side
- Use Colyseus for real-time synchronization
- Implement anti-cheat validation

## Testing Requirements

### Coverage Standards
- Game logic: 95% coverage minimum
- OSRS calculations: 100% coverage required
- Multiplayer systems: Integration tests required
- Performance: Load tests with 4+ players

### Test Types
- Unit tests for all utility functions
- Integration tests for API endpoints  
- Performance tests for ECS systems
- OSRS data validation against Wiki

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