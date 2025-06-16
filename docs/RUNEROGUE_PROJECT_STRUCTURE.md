# RuneRogue Project Structure
*Master Orchestrator's Definitive Architecture Document*

## Overview
RuneRogue combines Old School RuneScape mechanics with Vampire Survivors gameplay on Discord. This structure ensures modular, testable, and scalable development across our specialized AI agent team.

## Root Directory Structure

```
runerogue/
├── packages/                    # Monorepo packages
│   ├── osrs-data/              # [agent/osrs-data] OSRS Wiki data pipeline
│   │   ├── src/
│   │   │   ├── scrapers/       # Wiki scraping utilities
│   │   │   ├── parsers/        # Data parsing & validation
│   │   │   ├── calculators/    # OSRS formula implementations
│   │   │   └── api/           # Data service API
│   │   ├── data/              # Generated JSON data files
│   │   │   ├── items/         # Item definitions
│   │   │   ├── npcs/          # NPC/monster definitions
│   │   │   ├── combat/        # Combat formulas & tables
│   │   │   └── skills/        # Skill data & calculations
│   │   ├── tests/             # Data validation tests
│   │   └── package.json
│   │
│   ├── game-engine/           # [agent/gameplay-systems] Core game logic
│   │   ├── src/
│   │   │   ├── combat/        # Combat system (OSRS formulas)
│   │   │   ├── player/        # Player state management
│   │   │   ├── enemies/       # Enemy AI & behavior
│   │   │   ├── waves/         # Vampire Survivors wave system
│   │   │   ├── items/         # Item system & effects
│   │   │   ├── upgrades/      # Level-up upgrade system
│   │   │   └── physics/       # Movement & collision
│   │   ├── tests/             # Game logic unit tests
│   │   └── package.json
│   │
│   ├── discord-client/        # [agent/engine-client] Discord app client
│   │   ├── src/
│   │   │   ├── renderer/      # Game rendering (Pixi.js/Canvas)
│   │   │   ├── ui/           # OSRS-style UI components
│   │   │   ├── input/        # Player input handling
│   │   │   ├── discord/      # Discord SDK integration
│   │   │   ├── audio/        # Sound system
│   │   │   └── assets/       # Sprites & animations
│   │   ├── public/           # Static assets for Discord app
│   │   ├── tests/            # Client integration tests
│   │   └── package.json
│   │
│   ├── game-server/          # [agent/backend-infra] Multiplayer server
│   │   ├── src/
│   │   │   ├── rooms/        # Colyseus game rooms
│   │   │   ├── schemas/      # Game state schemas
│   │   │   ├── auth/         # Authentication logic
│   │   │   ├── persistence/  # Database operations
│   │   │   └── api/          # REST API endpoints
│   │   ├── tests/            # Server integration tests
│   │   └── package.json
│   │
│   └── shared/               # Shared types & utilities
│       ├── src/
│       │   ├── types/        # TypeScript definitions
│       │   ├── constants/    # Game constants
│       │   ├── utils/        # Shared utilities
│       │   └── validation/   # Data validation schemas
│       └── package.json
│
├── apps/                     # Application deployments
│   ├── discord-app/          # Main Discord application
│   └── dev-server/           # Development server setup
│
├── tools/                    # Development tools
│   ├── wiki-scraper/         # OSRS Wiki scraping tools
│   ├── asset-pipeline/       # Asset processing
│   └── test-runner/          # Custom test utilities
│
├── docs/                     # Documentation
│   ├── api/                  # API documentation
│   ├── game-design/          # Game design documents
│   ├── architecture/         # Technical architecture docs
│   └── deployment/           # Deployment guides
│
├── tests/                    # End-to-end tests
│   ├── e2e/                  # Full game flow tests
│   ├── integration/          # Cross-package integration tests
│   └── fixtures/             # Test data & mocks
│
├── config/                   # Configuration files
│   ├── discord/              # Discord app configuration
│   ├── database/             # Database schemas & migrations
│   └── deployment/           # Deployment configurations
│
├── assets/                   # Raw game assets
│   ├── sprites/              # Game sprites (OSRS style)
│   ├── audio/                # Sound effects & music
│   ├── ui/                   # UI elements
│   └── fonts/                # Game fonts
│
├── scripts/                  # Automation scripts
│   ├── setup/                # Environment setup scripts
│   ├── build/                # Build automation
│   └── deploy/               # Deployment scripts
│
├── .github/                  # GitHub Actions & templates
│   ├── workflows/            # CI/CD pipelines
│   └── ISSUE_TEMPLATE/       # Issue templates including copilot-agent-task
│
├── package.json              # Root package.json (workspace config)
├── lerna.json               # Lerna monorepo configuration
├── tsconfig.json            # Root TypeScript configuration
├── jest.config.js           # Jest testing configuration
├── .env.example             # Environment variables template
└── README.md                # Project overview & setup instructions
```

## Development Workflow Standards

### Agent Responsibilities
- **agent/osrs-data**: Owns `packages/osrs-data/` and `tools/wiki-scraper/`
- **agent/gameplay-systems**: Owns `packages/game-engine/` and related game logic
- **agent/engine-client**: Owns `packages/discord-client/` and client-side rendering
- **agent/backend-infra**: Owns `packages/game-server/` and deployment infrastructure
- **agent/qa-tester**: Owns `tests/` directory and validation across all packages

### Code Standards
- **TypeScript**: All packages use strict TypeScript with shared configuration
- **Testing**: Minimum 80% test coverage for all packages
- **Documentation**: JSDoc comments for all public APIs
- **Linting**: ESLint + Prettier with OSRS naming conventions where applicable
- **Validation**: All OSRS calculations must be validated against Wiki formulas

### Data Flow Architecture
1. **osrs-data** → Provides canonical OSRS data via clean JSON API
2. **game-engine** → Consumes OSRS data, implements game mechanics
3. **discord-client** → Renders game state, handles user input
4. **game-server** → Authoritative game state, multiplayer coordination
5. **qa-tester** → Validates all layers against OSRS Wiki specifications

## Next Steps
This structure will be implemented through GitHub Issues assigned to specialized agents, following the phased development roadmap in the Master Orchestration Plan. 