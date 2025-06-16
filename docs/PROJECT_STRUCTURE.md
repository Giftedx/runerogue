# RuneRogue Project Structure

## Root Directory Organization

The RuneRogue repository is organized as a TypeScript monorepo with the following structure:

### 📁 Core Directories

- **`packages/`** - Monorepo packages (server, shared, osrs-data, game-server, phaser-client)
- **`client/`** - React/Vite frontend application
- **`docs/`** - All documentation, reports, and session notes
- **`scripts/`** - Build scripts, validation tools, and automation
- **`config/`** - Configuration files for development tools
- **`archives/`** - Historical code and deprecated implementations
- **`external-repos/`** - Git submodules and external dependencies
- **`.github/`** - GitHub workflows, templates, and project instructions

### 📋 Configuration Files

- **`package.json`** - Root monorepo configuration
- **`pnpm-workspace.yaml`** - PNPM workspace configuration
- **`lerna.json`** - Lerna monorepo orchestration
- **`tsconfig.json`** - Root TypeScript configuration
- **`jest.config.js`** - Monorepo-wide test configuration
- **`.env`** - Local environment variables
- **`env.template`** - Environment template for setup

### 📚 Documentation Structure

#### `docs/`

- **`sessions/`** - Development session notes and prompts
- **`reports/`** - Implementation reports and status updates
- **`PROJECT_STRUCTURE.md`** - This file
- **Individual guides** - Architecture, development workflow, etc.

#### `docs/sessions/`

- Development session planning documents
- Phase completion guides
- Quick start and continuation prompts

#### `docs/reports/`

- Phase implementation completion reports
- Asset extraction and integration status
- Success summaries and cleanup reports

### 🔧 Scripts Directory

#### `scripts/`

- **`validate-phase3.js`** - Phase 3 validation and testing
- **`validate-phase4.js`** - Phase 4 skill system validation
- **`test-phase4-integration.js`** - Integration testing
- **`extract-combat-assets.js`** - OSRS asset extraction
- **`mcp-setup/`** - MCP server setup scripts

### ⚙️ Configuration Directory

#### `config/`

- **`cursor-mcp-complete.json`** - Cursor IDE MCP configuration
- **`OAI_CONFIG_LIST.json`** - OpenAI API configuration
- **`mcp-repos.code-workspace`** - VS Code workspace settings

## Package Structure

### `packages/server/`

- Main game server with ECS systems
- Colyseus multiplayer integration
- OSRS-authentic game mechanics

### `packages/shared/`

- Shared types and utilities
- Cross-package interfaces
- Common constants and enums

### `packages/osrs-data/`

- OSRS Wiki data integration
- Combat formulas and calculations
- Skill system implementations

### `packages/game-server/`

- Colyseus game room implementation
- Real-time multiplayer logic
- Server-side validation

### `packages/phaser-client/`

- Phaser 3 game rendering
- Client-side game logic
- Visual effects and animations

### `client/`

- React frontend application
- Discord activity integration
- UI components and menus

## Development Workflow

1. **Start Development**: `pnpm dev` from root
2. **Run Tests**: `pnpm test` for all packages
3. **Build All**: `pnpm build` for production builds
4. **Validate**: Use scripts in `scripts/` directory

## File Naming Conventions

- **Configuration files**: `lowercase.extension`
- **Documentation**: `UPPERCASE_WITH_UNDERSCORES.md`
- **Scripts**: `kebab-case.js`
- **Source code**: Follow TypeScript/React conventions

## Cleanup Notes

This structure was reorganized on June 15, 2025 to:

- Consolidate development session documents
- Organize status reports and implementation guides
- Centralize configuration files
- Improve project navigation and maintenance
- Follow standard monorepo conventions

For historical reference, see `docs/reports/REPOSITORY_CLEANUP_FINAL_REPORT.md`.
