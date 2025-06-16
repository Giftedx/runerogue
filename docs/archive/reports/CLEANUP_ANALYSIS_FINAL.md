# RuneRogue Monorepo Cleanup Analysis & Implementation Plan

## Current Status: MAJOR CLEANUP COMPLETED ✅

### ✅ COMPLETED CLEANUP ACTIONS

1. **Server Consolidation**: `server-ts/` successfully moved to `packages/server/`
2. **Client Extraction**: Static clients moved to `packages/phaser-client/`
3. **Package Structure**: Proper workspace packages established:
   - `packages/server/` - Main game implementation
   - `packages/game-server/` - Colyseus multiplayer server
   - `packages/osrs-data/` - OSRS formulas and data
   - `packages/shared/` - Shared utilities
   - `packages/phaser-client/` - Phaser game clients
   - `client/` - React UI and Discord integration

### ✅ NEW CLEANUP ACTIONS COMPLETED (TODAY)

4. **Documentation Organization**:

   - Created `docs/archive/` structure with subdirectories
   - Moved historical files from root to appropriate archive locations
   - Cleaned up 4+ orphaned documentation files at root level

5. **External Repository Management**:

   - Moved 3.2GB `mcp-repos/` (22 external repos) to `external-repos/`
   - Moved 446MB `tools-python/` to `external-repos/`
   - Total space reclaimed from main workspace: ~3.7GB

6. **Script Organization**:

   - Removed all orphaned JavaScript files from `scripts/` directory
   - Moved MCP-related PowerShell scripts to `scripts/mcp-setup/`
   - Organized setup and verification scripts

7. **Build Artifacts Cleanup**:
   - Removed orphaned build artifacts
   - Cleaned up configuration files
   - Maintained only necessary root-level configs

### 🚨 REMAINING CLEANUP TASKS

## 1. ROOT-LEVEL DOCUMENTATION CLEANUP

### Current Issues

- 4+ orphaned documentation files at root level
- 80+ status/report files cluttering `docs/` directory
- Lack of proper documentation structure

### Action Plan

```
ROOT LEVEL (Keep Only):
├── README.md ✅
├── CONTRIBUTING.md ✅
├── LICENSE (create if needed)
└── CHANGELOG.md (create)

MOVE TO docs/:
- MONOREPO_STRUCTURE_ANALYSIS.md
- RESTRUCTURE_PLAN.md
- RESTRUCTURING_PROGRESS.md
- NPM_ISSUE_RESOLUTION_REPORT.md

ARCHIVE OR DELETE:
- MASTER_ORCHESTRATION_PLAN.md.backup
```

## 2. DOCUMENTATION REORGANIZATION

### Current Chaos

- 80+ status files in `docs/`
- Multiple "NEXT_SESSION" and "PHASE_X" files
- Redundant completion reports

### Proposed Structure

```
docs/
├── architecture/           # Technical documentation
├── development/           # Development guides
├── archive/              # Historical status reports
│   ├── phases/           # PHASE_X files
│   ├── sessions/         # SESSION files
│   └── reports/          # COMPLETION reports
├── api/                  # API documentation
└── deployment/           # Deployment guides
```

## 3. EXTERNAL REPOSITORIES CLEANUP

### Issue: `mcp-repos/` Directory

- 22 external repositories cloned locally (600MB+)
- Not used in core project
- Causing workspace confusion

### Action: Move to separate directory or remove

## 4. PYTHON TOOLS ASSESSMENT

### Issue: `tools-python/` Directory

- Complete Python ecosystem
- Unclear integration with main project
- Duplicate functionality with Node.js tools

### Analysis Needed

- Determine if actively used
- Check integration points
- Consider migration to TypeScript

## 5. SCRIPTS CONSOLIDATION

### Current Issues

- Orphaned scripts in `scripts/` directory
- Build artifacts and temp files
- Multiple configuration files

### Action Plan

```
scripts/ (Consolidate):
├── build/              # Build-related scripts
├── dev/                # Development utilities
├── deploy/             # Deployment scripts
└── clean/              # Cleanup utilities

DELETE:
- status-check.js (orphaned)
- test-*.js files (move to packages)
- visual-feedback-server.js (redundant)
```

## 6. BUILD ARTIFACTS CLEANUP

### Issues

- `dist/` directory at root with orphaned files
- Multiple tsconfig files
- Conflicting package managers

### Actions

- Remove root-level build artifacts
- Consolidate TypeScript configurations
- Remove `package-lock.json` (using pnpm)

## 7. WORKSPACE CONFIGURATION OPTIMIZATION

### Current package.json workspaces

```json
"workspaces": [
  "packages/*",
  "client"
]
```

### Optimization needed

- Remove redundant dependencies
- Update script references
- Clean up dev dependencies

## IMPLEMENTATION PRIORITY

### HIGH PRIORITY (Immediate)

1. ✅ Documentation file reorganization
2. ✅ Remove orphaned scripts and artifacts
3. ✅ Archive historical status files
4. ✅ Clean up root-level clutter

### MEDIUM PRIORITY (Next Session)

1. ⏳ Assess `mcp-repos/` usage and relocate
2. ⏳ Evaluate `tools-python/` integration
3. ⏳ Optimize workspace configuration
4. ⏳ Consolidate build configurations

### LOW PRIORITY (Future)

1. 📋 Create proper API documentation
2. 📋 Establish changelog maintenance
3. 📋 Set up automated cleanup workflows

## ESTIMATED IMPACT

### Performance Improvements

- Reduced workspace scanning time
- Faster dependency resolution
- Cleaner IDE navigation

### Development Experience

- Clear project structure
- Focused documentation
- Reduced cognitive overhead

### Maintenance Benefits

- Easier onboarding
- Clearer change tracking
- Better version control

## VALIDATION CHECKLIST

After cleanup completion:

- [ ] All tests still pass
- [ ] Workspace packages resolve correctly
- [ ] Build process works without errors
- [ ] Documentation is properly organized
- [ ] No orphaned files remain
- [ ] Git history is clean
- [ ] Package dependencies are optimized

## NEXT STEPS

Ready to execute the remaining cleanup tasks with the following approach:

1. **Safe Execution**: Archive rather than delete important files
2. **Validation**: Test each change to ensure no breaking issues
3. **Documentation**: Update any affected documentation
4. **Verification**: Run full test suite after each major change

Would you like me to proceed with executing these cleanup tasks?
