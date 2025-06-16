# RUNEROGUE TYPESCRIPT BUILD COMPLETION - FINAL EXECUTION PROMPT

## MISSION CRITICAL OBJECTIVES

**PRIMARY GOAL**: Achieve zero TypeScript build errors in the RuneRogue project  
**TIMELINE**: Complete all 58 remaining errors in systematic phases  
**QUALITY STANDARDS**: Maintain strict type safety, ESM compliance, and OSRS authenticity

## CURRENT PROJECT STATE

- **Build Status**: 58 TypeScript errors remaining (reduced from 88+)
- **Environment**: Node.js ESM with strict TypeScript, node16 module resolution
- **Working Directory**: `c:\Users\aggis\GitHub\runerogue\server-ts`
- **Build Command**: `npm run build`
- **Previous Fixes**: EMFILE errors resolved, Phaser types added, basic ESM imports fixed

## EXECUTION PHASES - SYSTEMATIC APPROACH

### PHASE 1: CRITICAL BLOCKING ERRORS (First 30 minutes)

#### 1.1 Export Conflicts Resolution (8 errors - IMMEDIATE)

**Files to Fix**:

- `src/assets/asset-pipeline-implementation-planner.ts`
- `src/assets/comprehensive-asset-coordinator.ts`
- `src/assets/osrs-cache-reader.ts`

**Actions**:

```bash
# Run build to identify exact duplicate exports
npm run build

# For each file with export conflicts:
# 1. Search for duplicate export statements
# 2. Remove redundant exports
# 3. Consolidate to single export point
# 4. Test build after each fix
```

**Expected Pattern**:

```typescript
// REMOVE: Duplicate exports like this
export class MyClass {}
// ... later in file ...
export { MyClass }; // DELETE THIS LINE

// KEEP: Single export only
export class MyClass {}
```

#### 1.2 ESM Import Extensions (3 errors - IMMEDIATE)

**Files to Fix**:

- `src/assets/comprehensive-asset-coordinator.ts` (line 118)
- `src/assets/osrs-cache-reader-fallback.ts` (lines 201, 227)

**Actions**:

```typescript
// Find and fix missing .js extensions
// WRONG: import { something } from "./other-module";
// CORRECT: import { something } from "./other-module.js";
```

#### 1.3 Missing Dependencies Installation (4 errors - IMMEDIATE)

**Commands to Run**:

```bash
# Install missing sharp package
npm install sharp @types/sharp

# Verify installation
npm list sharp

# Test build
npm run build
```

### PHASE 2: TYPE SAFETY RESTORATION (Next 30 minutes)

#### 2.1 Unknown Type Access Fixes (9 errors)

**Files to Fix**:

- `src/assets/comprehensive-extractor-script.ts`
- `src/assets/comprehensive-osrs-extractor.ts`

**Fix Pattern**:

```typescript
// WRONG: Direct property access on unknown
const value = someUnknown.property;

// CORRECT: Type guard approach
if (
  typeof someUnknown === "object" &&
  someUnknown !== null &&
  "property" in someUnknown
) {
  const value = (someUnknown as { property: any }).property;
}

// OR: Safe optional access
const value = (someUnknown as { property?: any })?.property;
```

#### 2.2 Missing Method Implementations

**Required Additions**:

- Add missing `hasAsset` method to OSRSAssetLoader if not present
- Implement missing ECS system imports
- Add any missing utility functions

### PHASE 3: PHASER INTEGRATION COMPLETION (Next 20 minutes)

#### 3.1 Phaser Namespace Fix (15 errors)

**Current File**: `src/types/phaser.d.ts`
**Files Affected**: All UI components

**Actions**:

1. Verify Phaser type definitions are complete
2. Ensure proper namespace export in phaser.d.ts
3. Add reference paths to UI components if needed
4. Test each UI component individually

**Fix Pattern**:

```typescript
// In phaser.d.ts - ensure this structure
declare global {
  namespace Phaser {
    // All Phaser types here
  }
}

// In UI components - add if needed
/// <reference path="../types/phaser.d.ts" />
```

### PHASE 4: INTERFACE ALIGNMENT (Next 15 minutes)

#### 4.1 Discord SDK & Game State Fixes (12 errors)

**Files to Fix**:

- GameClient.ts
- InputManager.ts
- UIManager.ts

**Actions**:

1. Fix property/method mismatches
2. Update interface definitions
3. Add missing properties to object literals
4. Align method signatures

### PHASE 5: FINAL VALIDATION (Last 15 minutes)

#### 5.1 Complete Build Verification

```bash
# Run full build
npm run build

# Verify zero errors
echo "Expected: 0 errors"

# Run type check
npm run type-check

# Run linting
npm run lint
```

#### 5.2 Quality Assurance Checks

- All imports use proper ESM .js extensions
- No 'any' types introduced without justification
- All OSRS authenticity maintained
- No runtime functionality broken

## DETAILED ERROR TRACKING

### Start Each Phase With:

```bash
# Check current error count
npm run build 2>&1 | grep -E "error TS[0-9]+" | wc -l

# Or on Windows PowerShell:
npm run build 2>&1 | Select-String "error TS" | Measure-Object | Select-Object Count
```

### After Each Fix:

1. Run `npm run build`
2. Count remaining errors
3. Document progress
4. Move to next priority error

## SUCCESS CRITERIA

### Technical Requirements:

- ✅ Zero TypeScript compilation errors
- ✅ All ESM imports use .js extensions
- ✅ No 'any' types without proper justification
- ✅ Strict type safety maintained
- ✅ All Phaser UI components compile

### Quality Standards:

- ✅ OSRS authenticity preserved
- ✅ Performance implications considered
- ✅ Clean, maintainable code
- ✅ Proper error handling maintained

### Validation Commands:

```bash
# Final verification suite
npm run build          # Must show 0 errors
npm run type-check      # Must pass
npm run lint           # Must pass (or only minor warnings)
npm test               # Should pass (if tests exist)
```

## EMERGENCY PROCEDURES

### If Stuck on Specific Error:

1. Isolate the specific file causing issues
2. Read the full file context
3. Check import/export chains
4. Temporarily comment out problematic code
5. Fix incrementally and test

### If Build Time Becomes Excessive:

1. Check for infinite type recursion
2. Verify no circular dependencies
3. Restart TypeScript language server
4. Clear node_modules and reinstall if needed

## WORKFLOW COMMANDS

### Session Startup:

```bash
cd c:\Users\aggis\GitHub\runerogue\server-ts
npm run build
# Note starting error count
```

### Progress Tracking:

```bash
# After each major fix
npm run build | grep "error TS" | wc -l
```

### Session End Verification:

```bash
npm run build
# Must show: "Found 0 errors."
```

## EXPECTED TIMELINE

- **0-30 min**: Phase 1 (Critical blocking errors) - Target: 40 errors remaining
- **30-60 min**: Phase 2 (Type safety) - Target: 25 errors remaining
- **60-80 min**: Phase 3 (Phaser integration) - Target: 10 errors remaining
- **80-95 min**: Phase 4 (Interface alignment) - Target: 0 errors remaining
- **95-110 min**: Phase 5 (Final validation) - Target: All quality checks pass

## COMPLETION CONFIRMATION

### Final Success Message Expected:

```
Found 0 errors. Watching for file changes.
```

### Post-Completion Actions:

1. Create completion status report
2. Document any architectural improvements made
3. Update project documentation
4. Prepare for next development phase

---

**CRITICAL REMINDER**: This is a systematic, methodical approach. Fix errors in priority order, test after each change, and maintain code quality throughout. The goal is not just zero errors, but zero errors with maintained type safety and OSRS authenticity.

**START COMMAND**: `cd c:\Users\aggis\GitHub\runerogue\server-ts && npm run build`
