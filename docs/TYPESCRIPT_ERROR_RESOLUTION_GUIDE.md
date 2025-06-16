# TYPESCRIPT ERROR ANALYSIS & RESOLUTION PLAN

## CURRENT BUILD STATUS

**Total Errors**: 58 TypeScript compilation errors
**Build Command**: `npm run build` in `server-ts` directory
**Last Successful Build**: None (project has ongoing type issues)

## ERROR CATEGORIES & SOLUTIONS

### 1. EXPORT CONFLICTS (8 errors) - CRITICAL PRIORITY

#### Files Affected:

- `src/assets/asset-pipeline-implementation-planner.ts`
- `src/assets/comprehensive-asset-coordinator.ts`
- `src/assets/osrs-cache-reader.ts`

#### Root Cause:

Multiple export declarations for the same class/variable name within single files.

#### Solution Strategy:

```typescript
// WRONG: Multiple exports
export class MyClass {}
// ... later in file ...
export { MyClass }; // ERROR: Cannot redeclare

// CORRECT: Single export point
class MyClass {}
// ... later in file ...
export { MyClass };
```

### 2. ESM IMPORT EXTENSIONS (3 errors) - CRITICAL PRIORITY

#### Files Affected:

- `src/assets/comprehensive-asset-coordinator.ts` (line 118)
- `src/assets/osrs-cache-reader-fallback.ts` (lines 201, 227)

#### Root Cause:

Node16 module resolution requires explicit `.js` extensions for relative imports.

#### Solution Strategy:

```typescript
// WRONG
import { something } from "./other-module";

// CORRECT
import { something } from "./other-module.js";
```

### 3. UNKNOWN TYPE ACCESS (9 errors) - HIGH PRIORITY

#### Files Affected:

- `src/assets/comprehensive-extractor-script.ts`
- `src/assets/comprehensive-osrs-extractor.ts`

#### Root Cause:

Accessing properties on `unknown` type without proper type guards.

#### Solution Strategy:

```typescript
// WRONG
const value = someUnknown.property; // Error on unknown

// CORRECT
const value = (someUnknown as { property?: any })?.property;
// OR with type guard
if (
  typeof someUnknown === "object" &&
  someUnknown &&
  "property" in someUnknown
) {
  const value = (someUnknown as any).property;
}
```

### 4. MISSING MODULE DEPENDENCIES (4 errors) - HIGH PRIORITY

#### Missing Package:

- `sharp` module in `ultimate-osrs-extractor.ts`

#### Missing ECS Imports:

- `DamageNumberSystem`
- `HealthBarSystem`
- `XPNotificationSystem`

#### Solution Strategy:

```bash
# Install missing dependency
npm install sharp @types/sharp

# Fix import paths or create stub modules
```

### 5. PHASER NAMESPACE ISSUES (15 errors) - MEDIUM PRIORITY

#### Files Affected:

- All UI components (`DamageNumber.ts`, `HealthBar.ts`, etc.)

#### Root Cause:

Phaser namespace not properly imported/declared.

#### Current Type Definition Location:

`src/types/phaser.d.ts` - needs enhancement

#### Solution Strategy:

```typescript
// In phaser.d.ts - ensure proper namespace export
declare global {
  namespace Phaser {
    // ... existing definitions
  }
}

// In component files - ensure proper import
/// <reference path="../types/phaser.d.ts" />
```

### 6. INTERFACE MISMATCHES (12 errors) - MEDIUM PRIORITY

#### Files Affected:

- `src/client/game/GameClient.ts`
- `src/client/game/InputManager.ts`
- `src/client/game/UIManager.ts`

#### Root Cause:

Discord SDK, Room objects, and game state interfaces don't match expected properties.

#### Solution Strategy:

Update interfaces or add missing properties/methods.

### 7. OBJECT LITERAL MISMATCHES (4 errors) - LOW PRIORITY

#### Files Affected:

- `src/assets/comprehensive-extractor-script.ts`

#### Root Cause:

Object literals include properties not defined in target interface.

#### Solution Strategy:

Either update interface or remove extra properties.

## IMMEDIATE ACTION PLAN

### Step 1: Fix Export Conflicts (15 minutes)

1. Open `asset-pipeline-implementation-planner.ts`
2. Remove duplicate export at line 747
3. Repeat for `comprehensive-asset-coordinator.ts` and `osrs-cache-reader.ts`

### Step 2: Add ESM Extensions (10 minutes)

1. Add `.js` extensions to imports in affected files
2. Verify all relative import paths

### Step 3: Install Missing Dependencies (5 minutes)

```bash
cd server-ts
npm install sharp @types/sharp
```

### Step 4: Fix Missing Methods (10 minutes)

1. Add `hasAsset` method to `OSRSAssetLoader` class
2. Update method signatures to match usage

### Step 5: Fix Unknown Type Access (20 minutes)

1. Add type guards for property access
2. Update interfaces to include missing properties

### Step 6: Fix Phaser Types (15 minutes)

1. Update `src/types/phaser.d.ts`
2. Ensure proper namespace declarations

## VERIFICATION COMMANDS

After each step:

```bash
cd server-ts
npm run build | tee build_status.txt
```

Count remaining errors:

```bash
grep "error TS" build_status.txt | wc -l
```

## SUCCESS CRITERIA

- **Target**: 0 TypeScript errors
- **Quality**: No use of `any` types where avoidable
- **Functionality**: All existing features remain working
- **Performance**: Build time under 30 seconds

## RISK MITIGATION

- Make incremental changes
- Test build after each major change
- Keep backup of working state
- Document any breaking changes

## FILES TO MONITOR

Critical files that may need updates during fixes:

- `src/types/phaser.d.ts`
- `src/types/ecs-events.d.ts`
- `src/assets/osrs-asset-loader.ts`
- `package.json` (for new dependencies)

---

**EXECUTION ORDER**: Start with export conflicts, then ESM extensions, then missing dependencies. This order resolves blocking issues first before tackling type safety improvements.
