# RuneRogue

A RuneScape-inspired roguelike multiplayer game featuring a polyglot architecture with TypeScript game servers, web clients, and AI-assisted development.

## 🎮 Project Overview

RuneRogue combines the nostalgia of Old School RuneScape with modern roguelike mechanics, delivering a unique multiplayer gaming experience. The project features a comprehensive monorepo architecture with multiple client implementations and robust server infrastructure.

## 🏗️ Architecture

### Core Components

- **Game Server** (`packages/game-server/`) - Colyseus-based multiplayer game server
- **OSRS Data** (`packages/osrs-data/`) - Old School RuneScape data models and utilities
- **Phaser Client** (`packages/phaser-client/`) - Modern web-based game client
- **Shared Libraries** (`packages/shared/`) - Common types and utilities
- **Server Infrastructure** (`packages/server/`) - Express.js API server

### Client Implementations

- **React Web Client** (`client/`) - React-based web interface
- **Godot Client** (`client/godot/`) - Cross-platform game client

### Project Organization

- **`docs/`** - Documentation, session notes, and implementation reports
- **`scripts/`** - Build scripts, validation tools, and automation
- **`config/`** - Development tool configurations
- **`archives/`** - Historical code and deprecated implementations

For detailed project structure information, see [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md).

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PNPM (recommended package manager)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/aggis/runerogue.git
   cd runerogue
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build all packages:

   ```bash
   pnpm run build
   ```

4. Run development servers:
   ```bash
   pnpm run dev
   ```

### Environment Setup

Copy the environment template and configure your settings:

```bash
cp env.template .env
```

Required environment variables:

- Database connection settings
- API keys for external services
- Development/production configurations

## 🧪 Testing

Run the complete test suite:

```bash
pnpm run test
```

Run specific test types:

```bash
pnpm run test:unit      # Unit tests
pnpm run test:integration # Integration tests
pnpm run test:e2e       # End-to-end tests
```

## 🛠️ Development

### Workspace Structure

This is a monorepo managed with Lerna and PNPM workspaces:

- `packages/` - Core game packages
- `client/` - Client applications
- `docs/` - Documentation
- `scripts/` - Utility scripts
- `external-repos/` - External dependencies and tools

### AI-Assisted Development

RuneRogue leverages AI-assisted development through:

- **GitHub Copilot Agents** - Automated task assignment and code generation
- **Model Context Protocol (MCP)** - Enhanced AI tooling and integrations
- **Automated Testing** - AI-generated tests and validation

### Code Quality

- **TypeScript** - Strict type checking across all packages
- **ESLint** - Code linting and style enforcement
- **Prettier** - Code formatting
- **Jest** - Comprehensive testing framework

## 📚 Documentation

- [Contributing Guide](CONTRIBUTING.md)
- [Architecture Documentation](docs/)
- [API Documentation](packages/server/docs/)
- [Client Setup](client/README.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development workflow
- Code standards
- Testing requirements
- Pull request process

## 📋 Scripts

- `pnpm run build` - Build all packages
- `pnpm run test` - Run all tests
- `pnpm run lint` - Lint all packages
- `pnpm run dev` - Start development servers
- `pnpm run clean` - Clean build artifacts

## 🏷️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Features

- **Multiplayer** - Real-time multiplayer gameplay with Colyseus
- **OSRS-Inspired** - Authentic Old School RuneScape mechanics
- **Modern Tech Stack** - TypeScript, React, Phaser, Godot
- **Cross-Platform** - Web and desktop client support
- **AI-Enhanced** - AI-assisted development and maintenance
- **Comprehensive Testing** - Full test coverage with automated CI/CD

---

## 🔄 Multiplayer Reconnection Protocol

RuneRogue supports robust multiplayer reconnection using Colyseus's built-in protocol:

- When a client disconnects (network loss, tab close, etc.), the server preserves their player state for a 30-second grace period.
- If the client reconnects within this window (same session ID), their character and progress are fully restored.
- If not, the player is removed from the game state as normal.
- The browser client automatically attempts to reconnect up to 5 times, with exponential backoff, and provides clear UI feedback on connection status.
- Manual refresh is prompted if reconnection fails.

This ensures a seamless multiplayer experience and prevents ghost players or lost progress due to transient disconnects.

## 📈 In-Game Performance Monitor

The main browser client features a real-time performance monitor overlay (top-right):

- **FPS**: Frames per second, updated every second (target: 60fps)
- **Memory**: JS heap usage (if available)
- **Msgs/s**: Colyseus message rate per second

Use this overlay to validate performance, frame time, and network message rates during multiplayer sessions. This is essential for meeting the 60fps and stability requirements for 2-4 player games.

---

_RuneRogue Development Team - Building the future of nostalgic gaming_
