# Changelog

All notable changes to RuneRogue will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Repository cleanup and organization
- Comprehensive documentation structure
- Archived historical development files

### Changed

- Moved external dependencies to `external-repos/` directory
- Updated MCP configuration paths
- Organized documentation into logical categories

### Removed

- Empty directories and files
- Duplicate configuration files
- Outdated status reports

## [0.1.0] - 2025-06-14

### Added

- Initial project setup with monorepo structure
- OSRS data pipeline with authentic combat formulas
- Colyseus multiplayer server infrastructure
- bitECS entity component system
- Comprehensive test suite
- API server with OSRS data endpoints
- Player movement and synchronization systems
- Discord activity integration foundation

### Technical Stack

- **Frontend**: TypeScript, Phaser 3, React, Vite
- **Backend**: Node.js, Colyseus, Express, bitECS
- **Data**: PostgreSQL, Prisma ORM, OSRS Wiki API
- **Infrastructure**: Turborepo, pnpm, Jest, Docker
