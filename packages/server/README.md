# @runerogue/server

**Status: Active Development (Canonical Backend)**

This package contains the main, canonical implementation of the RuneRogue game server and all related backend logic. This is the **active development area** for the game's backend.

## Architecture

- **ECS**: Uses `bitecs` for an Entity-Component-System architecture.
- **Colyseus**: The `RuneRogueGameRoom` is the primary, active game room.
- **Shared Packages**: Relies on `@runerogue/shared` for schemas and types, and `@runerogue/osrs-data` for game formulas.
- **Monolithic**: This package is currently a monolith containing the game logic, asset pipelines, database connections, and Discord integration.

## Current State

This package is currently undergoing a significant **code cleanup and refactoring**. It contains some legacy schemas and rooms that have been marked as `@deprecated`. The goal is to consolidate all active code, remove obsolete files, and improve the overall structure.

## Recommendation

All new server development should happen here. Please be mindful of the ongoing cleanup and ensure any new code adheres to the project's standards, using the shared schemas and ECS patterns.
