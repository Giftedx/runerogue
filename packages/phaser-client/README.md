# @runerogue/phaser-client

**Status: Active – Discord Activity Client**

This package contains the RuneRogue Discord Activity client. It is a web application built with TypeScript, React, Phaser 3, Zustand, Colyseus, and the Discord Embedded App SDK.

## Features

- **Discord Activity**: Runs in an iframe via the Discord Embedded App SDK
- **Phaser 3 Game Engine**: Real-time 2D rendering and logic
- **React 18 UI**: Menus, HUD, overlays
- **Zustand State Management**
- **Colyseus Multiplayer**: Real-time rooms and state sync
- **Tailwind CSS**: Styling
- **Vite Build Tool**: Fast dev and optimized builds

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

- The `discord-activity.json` manifest must be present in `public/`.
- Update `client_id` and URLs for your Discord application.

### Production Build

```bash
pnpm build
```

## Notes

- This repository does not include a canonical backend server. If testing multiplayer locally, run any available server prototype separately and set `VITE_GAME_SERVER_URL` accordingly.

## Contributing

See the root [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
