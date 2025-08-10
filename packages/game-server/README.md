# @runerogue/game-server

**Status: Legacy Prototype**

This package contains a simplified, alternative implementation of the RuneRogue game server. It was developed as a prototype and does not use the main ECS (Entity-Component-System) architecture, nor does it use canonical schemas and data from `@runerogue/shared` and `@runerogue/osrs-data`.

## Key Differences from a Future Canonical Server

- No ECS: State is managed directly on Colyseus schema objects
- Simplified Schemas: Uses package-local schemas under `src/schemas/`
- Hardcoded Logic: Some OSRS formulas and logic may be out of sync with shared libraries

## Recommendation

This package is retained for historical reference and experiments. There is currently no canonical backend server in this repository. If you need a server to test the client, you may run this package locally, but it is not maintained and may diverge from shared contracts.
