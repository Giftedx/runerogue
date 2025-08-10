# RuneRogue Project Structure (Current State)

This document reflects the current contents of the repository.

## Root Layout

- `packages/` — Monorepo packages
- `docs/` — Documentation, reports, and session notes
- `scripts/` — Build and utility scripts
- `config/` — Tooling configuration
- `archives/` — Historical/deprecated code and experiments
- `.github/` — GitHub workflow and templates

## Packages

### Active
- `packages/phaser-client/` — Discord Activity client (Vite + React + Phaser 3)
- `packages/shared/` — Shared types, constants, utilities, and schemas
- `packages/osrs-data/` — OSRS data models, calculators, and minimal API utilities

### Legacy
- `packages/game-server/` — Older Colyseus server prototype (non‑ECS). Kept for reference only.

## Notes

- There is currently no canonical backend server package in this repository. The legacy server can be used for experiments but is not maintained.
- `pnpm-workspace.yaml` includes only `packages/*` as workspace packages.
- TypeScript configuration is centralized with `tsconfig.base.json` and package-level `tsconfig.json` files.
