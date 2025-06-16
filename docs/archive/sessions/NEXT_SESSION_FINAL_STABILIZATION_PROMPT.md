# RuneRogue Final Stabilization - Critical Priority Task

## MISSION OVERVIEW

**PRIMARY OBJECTIVE**: Achieve ZERO TypeScript errors and stable test suite for the RuneRogue multiplayer game server.

**CURRENT STATUS**:

- TypeScript errors: **155 errors** (down from 278 - 44% reduction achieved)
- Main blocker: **`@runerogue/osrs-data` module resolution failures** affecting ALL gathering system tests
- ECS core systems are fundamentally working (AutoCombatSystem tests pass)
- Gathering systems are integrated but blocked by import issues

## CRITICAL BLOCKERS TO RESOLVE

### 1. **@runerogue/osrs-data Import Resolution (HIGHEST PRIORITY)**

**Root Cause**: All gathering systems (WoodcuttingSystem, MiningSystem, FishingSystem, CookingSystem, FiremakingSystem) import from `@runerogue/osrs-data` but the module is not being resolved correctly.

**Affected Files**:

```
src/server/ecs/systems/WoodcuttingSystem.ts:26
src/server/ecs/systems/MiningSystem.ts:25
src/server/ecs/systems/FishingSystem.ts:25
src/server/ecs/systems/CookingSystem.ts:25
src/server/ecs/systems/FiremakingSystem.ts:24
src/server/ecs/systems/AutoCombatSystem.ts:3
```

**Error Pattern**:

```typescript
Cannot find module '@runerogue/osrs-data' or its corresponding type declarations.
```

**SOLUTION APPROACH**:

1. **Option A**: Fix the `@runerogue/osrs-data` package.json exports and tsconfig paths
2. **Option B**: Update all imports to use relative paths to `packages/osrs-data/src/skills/gathering-data.ts`
3. **Option C**: Create a proper build pipeline for the osrs-data package

### 2. **Remaining TypeScript Errors (155 total)**

**Major Categories**:

- **Module resolution**: `@runerogue/osrs-data`, Phaser types, Discord SDK
- **Colyseus schema conflicts**: Type mismatches, property access issues
- **Asset pipeline**: Missing dependencies (sharp, ROT.js)
- **Client-side errors**: Phaser/Discord SDK integration (less critical for server)

### 3. **Test Infrastructure**

- **70 test suites failing** primarily due to the osrs-data import issue
- **37 test suites passing** (core ECS functionality working)
- Need to clean up legacy schema tests that reference missing files

## IMMEDIATE ACTION PLAN

### Phase 1: Fix Module Resolution (URGENT)

```bash
# Check osrs-data package structure
cd packages/osrs-data
npm run build
# Verify exports in package.json
# Fix TypeScript config paths
```

### Phase 2: Update Import Statements

Replace all `@runerogue/osrs-data` imports with relative paths if package resolution fails:

```typescript
// FROM:
import { TREES } from "@runerogue/osrs-data";

// TO:
import { TREES } from "../../../../packages/osrs-data/src/skills/gathering-data";
```

### Phase 3: TypeScript Error Cleanup

Target the remaining **155 errors** by category:

1. Fix missing module declarations (sharp, ROT.js)
2. Resolve Colyseus schema type conflicts
3. Update property access patterns
4. Fix client-side type issues (lower priority)

### Phase 4: Test Stabilization

1. Get gathering system tests passing
2. Clean up legacy schema test references
3. Verify ECS integration tests work
4. Ensure multiplayer tests can run

## CODE STATE REFERENCE

### Working Systems

- **ECS Core**: Components, world creation, entity management ✅
- **AutoCombatSystem**: Tests passing (3/3) ✅
- **Gathering Data**: OSRS data logic working (packages/osrs-data tests: 28/31 passing) ✅
- **Integration**: All gathering systems registered in world.ts GAME_SYSTEMS ✅

### Key Fixed Files

- `server-ts/src/server/ecs/components.ts` - ECS component exports fixed
- `server-ts/src/server/ecs/world.ts` - All gathering systems registered
- `server-ts/src/server/data/osrs-resource-data.ts` - OSRS data aggregation
- `packages/osrs-data/src/skills/gathering-data.ts` - Tool progression logic fixed

### Blocked Files (Need @runerogue/osrs-data fix)

- All gathering system implementations
- All gathering-related tests
- ECS integration tests
- Multiplayer tests

## SUCCESS CRITERIA

### Minimum Viable Goal

- [ ] **Zero TypeScript build errors** (`npm run build` succeeds)
- [ ] **Gathering system tests pass** (resolve osrs-data imports)
- [ ] **Core ECS tests stable** (maintain current AutoCombatSystem success)

### Stretch Goals

- [ ] **Multiplayer tests working** (player join, movement, gathering)
- [ ] **Clean test suite** (remove legacy/broken tests)
- [ ] **Asset pipeline stable** (address sharp/ROT.js dependencies)

## DEVELOPMENT ENVIRONMENT

**Project Structure**:

```
runerogue/
├── server-ts/          # Main game server (focus area)
├── packages/
│   ├── osrs-data/      # OSRS game data (needs fixing)
│   ├── shared/         # Shared types
│   └── game-server/    # Legacy server
```

**Commands**:

```bash
# Build check
npm run build

# Test suite
npm test

# Specific test patterns
npm test -- --testNamePattern="gathering"
npm test -- --testNamePattern="ECS"
```

**Key Technologies**:

- **TypeScript** (strict mode)
- **bitECS** (Entity Component System)
- **Colyseus** (multiplayer framework)
- **Jest** (testing)
- **Lerna** (monorepo management)

## CONTEXT FOR NEXT AGENT

This is a **critical continuation session**. The build system has been significantly stabilized (278 → 155 errors), but one major blocker remains: the `@runerogue/osrs-data` module resolution that's preventing all gathering systems from working.

**Prioritize**:

1. Diagnose and fix the osrs-data package exports/imports
2. Get gathering system tests passing
3. Achieve zero TypeScript errors
4. Clean up failing tests

The codebase is in a good state - the ECS architecture is solid, gathering logic is implemented, and systems are properly registered. The main issue is module resolution preventing everything from building correctly.

**DO NOT**:

- Rewrite major systems (they're working)
- Change the ECS architecture (it's correct)
- Remove gathering functionality (it's needed)

**DO**:

- Focus on module resolution and imports
- Fix TypeScript configuration issues
- Clean up test references to missing files
- Achieve a clean build state

This is the final push to get a working, stable multiplayer RuneRogue prototype with gathering skills fully integrated.
