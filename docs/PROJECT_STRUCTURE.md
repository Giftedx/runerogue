# RuneRogue Project Structure (Current State)

**Last Updated: [Current Date]** - _This document reflects the current, in-progress state of the repository and is being updated as part of a codebase-wide cleanup._

## Root Directory Organization

The RuneRogue repository is organized as a TypeScript monorepo. It is currently undergoing a refactoring, so you will find some legacy packages and duplicate implementations. This document serves as a guide to the **current, canonical** structure.

### 📁 Core Directories

- **`packages/`** - Monorepo packages. Contains both active and legacy packages.
- **`client/`** - **[Current]** The main Vite/React/Phaser frontend application.
- **`docs/`** - All documentation, reports, and session notes.
- **`scripts/`** - Build scripts, validation tools, and automation.
- **`config/`** - Configuration files for development tools (e.g., VS Code workspaces, AI agent tools).
- **`archives/`** - Historical code and deprecated implementations.
- **`external-repos/`** - Git submodules for external AI agent tooling (MCP servers).
- **`.github/`** - GitHub workflows, templates, and project instructions.

### 📋 Key Configuration Files

- **`package.json`** - Root monorepo configuration.
- **`pnpm-workspace.yaml`** - PNPM workspace definition.
- **`tsconfig.json`** - Root TypeScript configuration for the monorepo.

---

## Package Structure Overview

The `packages/` directory is the heart of the application, but contains a mix of active and legacy code.

### ✅ Active & Canonical Packages

- **`packages/server/`** - **[Current & Canonical]** The main game server. This is a monolithic package containing the ECS (`bitecs`) systems, Colyseus multiplayer logic, database integration, asset pipelines, and all core game mechanics. **All new server development should happen here.**
- **`packages/client/`** - **[Current & Canonical]** The main game client. Built with Vite, React, and Phaser. This is the entry point for the user-facing application.
- **`packages/shared/`** - **[Current & Canonical]** Contains shared types, interfaces, and Colyseus schemas used by both the client and server. The schemas are the single source of truth for network state.
- **`packages/osrs-data/`** - **[Current & Canonical]** A clean, well-maintained library for OSRS Wiki data integration, including combat formulas, skill data, and other calculations.

### ⚠️ Legacy & Deprecated Packages

- **`packages/game-server/`** - **[Legacy Prototype]** A simplified, non-ECS prototype of the game server. It is self-contained and does not use the canonical schemas or ECS architecture. It should not be used for new development and is pending archival.
- **`packages/phaser-client/`** - **[Legacy Prototype]** A collection of standalone HTML and JavaScript files from early experiments. It is not part of the current client application. It should not be used and is pending archival.

---

## Detailed Directory Notes

### `packages/server/src/server/`

This is the core of the active server.

- **`rooms/`**: Contains the Colyseus rooms.
  - `RuneRogueGameRoom.ts`: This is an old file. The main logic is in `CleanGameRoom.ts`.
  - `CleanGameRoom.ts`: **The primary, active game room.**
  - _Other files_ (`JsonGameRoom.ts`, `MinimalGameRoom.ts`, etc.): These are **deprecated** test rooms using legacy schemas. They have been marked with `@deprecated` notices and are pending removal.
- **`systems/`**: Contains the ECS (`bitecs`) systems that implement all game logic (e.g., `StateSyncSystem.ts`). This is where the core game mechanics live.
- **`schemas/`**: This directory is now **entirely deprecated**. It used to contain many different schema versions. The canonical schemas have been moved to `packages/shared/src/schemas`. All files remaining here are marked as `@deprecated` and are pending removal.
- **`ecs/`**: Contains component definitions and system initializations for the ECS world.

### `client/`

The canonical client.

- **`src/`**: Contains the React and Phaser source code.
- **`src/components/`**: React components for the UI.
- **`src/game/`**: Contains the Phaser game implementation, including scenes and the `GameClient.ts` for connecting to the Colyseus server.

---

## Cleanup & Refactoring Status

This structure was updated on **[Current Date]** as part of a deep clean. The primary goals of this refactoring are:

- Consolidate duplicated server and client implementations.
- Establish a single source of truth for network schemas in `packages/shared`.
- Clearly identify and document legacy and orphaned code.
- Provide a clear path forward for new contributors.

For more details on the cleanup process, see the latest AI agent session notes.
