# @runerogue/game-server

**Status: Legacy Prototype**

This package contains a simplified, alternative implementation of the RuneRogue game server. It was developed as a prototype and does **not** use the main ECS (Entity-Component-System) architecture, nor does it use the canonical schemas and data from the `@runerogue/shared` and `@runerogue/osrs-data` packages.

## Key Differences from Main Server

- **No ECS**: Manages state directly on Colyseus schema objects.
- **Simplified Schemas**: Uses its own simplified schemas defined in `src/schemas/`.
- **Hardcoded Logic**: Contains its own implementation of OSRS formulas and game logic, which may be out of sync with the main game.

## Recommendation

This package should be considered **deprecated** and is kept for historical reference only. All new server development should be done in the `@runerogue/server` package, which contains the active, canonical implementation of the game's backend.

The contents of this package are pending review for potential migration of useful concepts before being archived or deleted.
