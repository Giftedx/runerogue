# /scripts Directory

**Status: Active Development Scripts & Tooling**

This directory contains standalone Node.js scripts used for various development and asset management tasks.

## Scripts

- **`extract-combat-assets.js`**: Scrapes the OSRS Wiki for combat-related image assets (e.g., hitsplats, projectiles) and saves them to the asset cache in `packages/server/assets/osrs-cache`.
- **`validate-phase3.js` / `validate-phase4.js`**: Validation scripts likely tied to specific development milestones. They may contain integration tests or logic checks for major feature sets.
- **`test-phase4-integration.js`**: A script for running integration tests related to "Phase 4" features.

## mcp-setup/

This subdirectory contains scripts related to setting up and managing the MCP (Model Context Protocol) servers used for AI agent tooling.

## Usage

These scripts are typically run from the command line (e.g., `node scripts/extract-combat-assets.js`) or via `npm run` commands defined in the root `package.json`.
