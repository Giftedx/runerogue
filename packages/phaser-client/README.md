# @runerogue/phaser-client

**Status: Active – Canonical Discord Activity Client**

This package contains the official, production-ready RuneRogue Discord Activity client. It is a modern web application built with TypeScript, React, Phaser 3, Zustand, Colyseus, and the Discord Embedded App SDK, following the architecture and requirements described in the project documentation.

## Features

- **Discord Activity**: Runs natively as a Discord Activity in an iframe, with full Discord SDK integration and authentication.
- **Phaser 3 Game Engine**: Real-time 2D game rendering and logic.
- **React 18 UI**: Modern, responsive UI for menus, HUD, and overlays.
- **Zustand State Management**: Efficient, scalable state for UI and player data.
- **Colyseus Multiplayer**: Real-time multiplayer rooms and state sync.
- **Tailwind CSS**: Discord-like styling and rapid UI development.
- **Vite Build Tool**: Fast development, HMR, and optimized production builds.
- **ECS Architecture**: Uses bitECS for performant entity-component-system logic.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- mkcert (for HTTPS in development)
- Discord Developer Application (for Activity testing)

### Installation

```bash
pnpm install
```

### Development

1. Generate HTTPS certificates (required for Discord Activity):
   ```bash
   mkcert -install
   mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1
   ```
2. Copy your Discord client ID to a `.env` file:
   ```env
   VITE_DISCORD_CLIENT_ID=your_discord_app_id
   VITE_GAME_SERVER_URL=wss://localhost:2567
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

### Discord Activity Manifest

- The `discord-activity.json` manifest must be present in the build output (public directory) for Discord to recognize the Activity.
- Update the `client_id` and URLs as needed for your Discord application.

### Production Build

```bash
pnpm build
```

## Architecture

- See the main project documentation for full technical details and architecture diagrams.
- This client implements all requirements for OSRS-authentic combat, multiplayer, and Discord integration.

## Contributing

See the root [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

---

_This is the canonical client for RuneRogue Discord Activity. All new development should occur here._
