# NEXT SESSION TYPESCRIPT ERROR RESOLUTION MISSION

## MISSION OBJECTIVE

Systematically fix all remaining TypeScript build errors in the RuneRogue project using a prioritized, file-by-file approach. The codebase must achieve zero TypeScript errors while maintaining strict type safety, ESM compliance, and OSRS authenticity.

## CURRENT STATUS

- **Previous Progress**: Reduced from 88+ errors to 58 remaining errors
- **Last Build Status**: 58 TypeScript errors across multiple files
- **Node.js Environment**: ESM with node16 module resolution
- **Type Safety Level**: Strict mode with isolatedModules enabled

## ERROR CLASSIFICATION & PRIORITY

### PRIORITY 1: Export/Declaration Conflicts (Critical)

**Files**: `asset-pipeline-implementation-planner.ts`, `comprehensive-asset-coordinator.ts`, `osrs-cache-reader.ts`
**Errors**: Redeclared exported variables, export conflicts
**Impact**: Prevents module compilation
**Fix Strategy**: Remove duplicate exports, consolidate class/interface declarations

### PRIORITY 2: ESM Import Extensions (Breaking)

**Files**: `comprehensive-asset-coordinator.ts`, `osrs-cache-reader-fallback.ts`
**Errors**: Missing `.js` extensions in relative imports
**Impact**: Module resolution failures
**Fix Strategy**: Add explicit `.js` extensions to all relative imports

### PRIORITY 3: Type Safety Violations (High)

**Files**: `comprehensive-extractor-script.ts`, `comprehensive-osrs-extractor.ts`, `demo-assets.ts`
**Errors**: Property access on `unknown`, missing properties, object literal mismatches
**Impact**: Runtime type safety compromised
**Fix Strategy**: Add proper type guards, interface definitions, method implementations

### PRIORITY 4: Missing Dependencies/Modules (High)

**Files**: `ultimate-osrs-extractor.ts`, UI components, networking handlers
**Errors**: Cannot find module 'sharp', missing ECS system imports
**Impact**: Build failures, broken imports
**Fix Strategy**: Install missing packages, fix import paths, create missing modules

### PRIORITY 5: Phaser Type Integration (Medium)

**Files**: All UI components (`DamageNumber.ts`, `HealthBar.ts`, etc.)
**Errors**: Cannot find namespace 'Phaser'
**Impact**: UI system compilation failures
**Fix Strategy**: Fix Phaser type definitions, ensure proper imports

### PRIORITY 6: Interface Mismatches (Medium)

**Files**: Client game files, Discord SDK integrations
**Errors**: Property/method mismatches, argument count mismatches
**Impact**: Runtime errors, API incompatibilities
**Fix Strategy**: Update interfaces, add missing properties/methods

## DETAILED ERROR BREAKDOWN

### Asset Pipeline Errors (16 errors)

```
src/assets/asset-pipeline-implementation-planner.ts(31,14): Cannot redeclare exported variable
src/assets/comprehensive-asset-coordinator.ts(44,14): Cannot redeclare exported variable
src/assets/comprehensive-extractor-script.ts(116,50): Property 'id' does not exist on type 'unknown'
src/assets/demo-assets.ts(36,34): Property 'hasAsset' does not exist on type 'OSRSAssetLoader'
```

### Client/UI Errors (24 errors)

```
src/client/game/GameClient.ts(57,51): Property 'id' does not exist on type 'Room<any>'
src/client/ui/DamageNumber.ts(51,18): Cannot find namespace 'Phaser'
src/client/networking/CombatEventHandler.ts(11,35): Cannot find module '../../../server/ecs/systems/DamageNumberSystem'
```

### Configuration Errors (4 errors)

```
src/logger.ts(77,7): Type 'DailyRotateFile' is not assignable to parameter
src/server/auth/middleware.ts(37,14): Cannot redeclare block-scoped variable
```

## EXECUTION STRATEGY

### Phase 1: Critical Export Fixes (30 minutes)

1. **Fix duplicate exports** in asset pipeline files
2. **Consolidate class declarations** to prevent redeclaration errors
3. **Update re-export statements** to use `export type` for isolated modules

### Phase 2: ESM Import Compliance (20 minutes)

1. **Add `.js` extensions** to all relative imports
2. **Verify module resolution** paths are correct
3. **Test import chains** end-to-end

### Phase 3: Type Safety Restoration (45 minutes)

1. **Add type guards** for `unknown` property access
2. **Implement missing methods** like `hasAsset` in OSRSAssetLoader
3. **Fix object literal** property mismatches
4. **Update interface definitions** to match actual usage

### Phase 4: Dependency Resolution (30 minutes)

1. **Install missing packages** (`sharp`, etc.)
2. **Fix ECS system imports** and paths
3. **Create stub modules** for missing dependencies if needed

### Phase 5: Phaser Integration Fix (25 minutes)

1. **Update Phaser type definitions** in `src/types/phaser.d.ts`
2. **Ensure proper namespace exports**
3. **Fix UI component type references**

### Phase 6: Final Interface Alignment (20 minutes)

1. **Update Discord SDK integrations**
2. **Fix Room/GameState property mismatches**
3. **Align method signatures** across client/server boundary

## CRITICAL REQUIREMENTS

### Code Quality Standards

- **Zero TypeScript errors** - Build must pass cleanly
- **Strict type safety** - No `any` types, proper type guards
- **ESM compliance** - All imports use explicit extensions
- **OSRS authenticity** - Game mechanics remain faithful to original

### Testing Requirements

- **Build verification** after each major fix
- **Incremental validation** to prevent regression
- **Error count tracking** to measure progress

### Documentation Requirements

- **Explain non-obvious fixes** with inline comments
- **Document interface changes** that affect other systems
- **Note any temporary workarounds** that need future attention

## SPECIFIC FILE ACTIONS

### Immediate Actions Required

1. **`asset-pipeline-implementation-planner.ts`**

   - Remove duplicate export at line 747
   - Consolidate class definition
   - Ensure single export point

2. **`comprehensive-asset-coordinator.ts`**

   - Fix import extension on line 118
   - Remove duplicate export at line 423
   - Fix re-export statements to use `export type`
   - Fix return type mismatch on line 411

3. **`demo-assets.ts`**

   - Add `hasAsset` method to OSRSAssetLoader class
   - Ensure method signature matches usage

4. **`ultimate-osrs-extractor.ts`**

   - Install `sharp` package: `npm install sharp @types/sharp`
   - Or create conditional import with fallback

5. **UI Components**
   - Fix Phaser namespace imports
   - Update type definitions for proper namespace resolution

## SUCCESS METRICS

- **Target**: 0 TypeScript errors
- **Current**: 58 errors
- **Progress Tracking**: After each phase, run build and count remaining errors
- **Quality Gate**: All fixes maintain existing functionality

## FOLLOW-UP TASKS

After achieving zero errors:

1. Run comprehensive test suite
2. Verify game functionality end-to-end
3. Check for any runtime errors in browser console
4. Update documentation for any interface changes

---

**START HERE**: Begin with Priority 1 export conflicts, then work systematically through each priority level. Use `npm run build` after each major change to track progress and prevent regression.
