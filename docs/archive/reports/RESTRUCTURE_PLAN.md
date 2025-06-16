# MONOREPO RESTRUCTURING PLAN

## Phase 1: Analysis and Backup

- [x] Complete structure analysis
- [ ] Examine orphaned files for important code
- [ ] Create backup of current state
- [ ] Create proper directory structure

## Phase 2: Move Packages

- [ ] Move server-ts to packages/server
- [ ] Extract phaser clients to packages/phaser-client
- [ ] Consolidate documentation to docs/
- [ ] Update workspace configuration

## Phase 3: Clean Up

- [ ] Remove duplicates
- [ ] Update all package.json files
- [ ] Fix import paths
- [ ] Test builds

## Phase 4: Validation

- [ ] Ensure server still runs
- [ ] Verify all clients work
- [ ] Run tests
- [ ] Document new structure

## IMPORTANT FILES TO PRESERVE

### Orphaned Root Files to Check:

- status-check.js
- test-enhanced-movement-system.js
- test-multiplayer-movement.js
- visual-feedback-server.js

### Key Packages:

- packages/game-server/ (preserve)
- packages/osrs-data/ (preserve)
- packages/shared/ (preserve)
- server-ts/ (move to packages/server)
- client/ (enhance and preserve)

### Critical Configs:

- Root package.json (update workspaces)
- pnpm-workspace.yaml (update)
- All tsconfig.json files (preserve)

## RESTRUCTURE TARGET:

```
runerogue/
├── packages/
│   ├── server/           # from server-ts/
│   ├── phaser-client/    # from server-ts/static/
│   ├── client/           # enhanced React client
│   ├── game-server/      # preserve
│   ├── osrs-data/        # preserve
│   └── shared/           # preserve
├── docs/                 # all .md files
├── scripts/              # orphaned .js files
└── [clean root configs]
```
