# RuneRogue

A RuneScape-inspired roguelike multiplayer project organized as a TypeScript monorepo.

## Project Overview

- **Phaser Client** (`packages/phaser-client/`) — Active Discord Activity client (Vite + React + Phaser 3)
- **OSRS Data** (`packages/osrs-data/`) — OSRS data models, calculators, and a minimal API
- **Shared** (`packages/shared/`) — Shared types, constants, and utilities
- **Game Server (legacy)** (`packages/game-server/`) — Older Colyseus prototype retained for reference

Additional folders:
- `docs/` — Documentation and reports
- `scripts/` — Development scripts
- `config/` — Tooling configuration
- `archives/` — Historical and deprecated code

## Quick Start

Prerequisites:
- Node.js 18+
- pnpm 8+

Install and start development:
```bash
pnpm install
pnpm run dev
```

- This runs each package's `dev` script where available (e.g., Vite in `packages/phaser-client` and watch tasks elsewhere).
- The legacy server in `packages/game-server` can be run independently if needed; see its README and `.env` requirements.

## Scripts

From the repository root:
- `pnpm run build` — Build all packages
- `pnpm run test` — Run Jest tests where present
- `pnpm run lint` — Lint all packages
- `pnpm run dev` — Start development servers/watchers
- `pnpm run clean` — Remove build artifacts

## Testing

```bash
pnpm run test
```

Note: This project uses Jest; some packages may not currently define tests.

## Architecture Notes

- Network schemas and shared contracts live in `packages/shared`.
- `packages/game-server` is a legacy prototype and not the canonical backend. No active replacement server is included in this repository today.
- The Phaser client in `packages/phaser-client` is the current, supported client.

## Contributing

See `CONTRIBUTING.md` for guidelines.

## License

MIT — see `LICENSE`.
