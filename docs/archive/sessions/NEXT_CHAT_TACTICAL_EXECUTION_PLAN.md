# 🎯 NEXT CHAT: RUNESTONE FINAL STABILIZATION - TACTICAL EXECUTION PLAN

## 🚨 MISSION CRITICAL: ZERO TYPESCRIPT ERRORS

**Current Status**: 146 TypeScript errors remaining (down from 278)
**Goal**: Achieve production-ready build with zero errors
**ETA**: Complete in this session

---

## 📋 STEP-BY-STEP EXECUTION PLAN

### **PHASE 1: DEPENDENCY FIXES (15 minutes)**

**Priority**: HIGHEST - Fixes ~30-40 errors immediately

#### Step 1.1: Install Missing Dependencies

```bash
cd server-ts

# Install Phaser and missing types
npm install phaser@^3.70.0
npm install sharp
npm install --save-dev @types/node @types/jest

# Verify installation
npm list phaser sharp
```

#### Step 1.2: Check Error Reduction

```bash
# Count current errors
npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object | Select-Object Count

# Expected result: Should drop from 146 to ~100-110 errors
```

### **PHASE 2: IMPORT EXTENSION FIXES (20 minutes)**

**Priority**: HIGH - Fixes ECMAScript import errors

#### Step 2.1: Fix Asset Import Extensions

**Target Files**:

- `src/assets/comprehensive-asset-coordinator.ts`
- `src/assets/osrs-cache-reader-fallback.ts`

**Find and Replace Pattern**:

```bash
# Search for: from './[filename]'
# Replace with: from './[filename].js'
```

**Specific Fixes Needed**:

```typescript
// In comprehensive-asset-coordinator.ts line 118
// Change: from './osrs-cache-reader'
// To: from './osrs-cache-reader.js'

// In osrs-cache-reader-fallback.ts line 201
// Change: from './mcp-osrs-extractor'
// To: from './mcp-osrs-extractor.js'

// In osrs-cache-reader-fallback.ts line 227
// Change: from './osrs-asset-extractor'
// To: from './osrs-asset-extractor.js'
```

#### Step 2.2: Verify Import Fixes

```bash
npx tsc --noEmit 2>&1 | Select-String "need explicit file extensions"
# Expected: No results (all fixed)
```

### **PHASE 3: CLIENT-SERVER BOUNDARY CLEANUP (25 minutes)**

**Priority**: HIGH - Removes cross-package import errors

#### Step 3.1: Fix Combat Event Handler

**File**: `src/client/networking/CombatEventHandler.ts`

**Remove These Imports**:

```typescript
// DELETE THESE LINES (around lines 11-13):
import { DamageNumberManager } from "../../../server/ecs/systems/DamageNumberSystem";
import { HealthBarManager } from "../../../server/ecs/systems/HealthBarSystem";
import { XPNotificationManager } from "../../../server/ecs/systems/XPNotificationSystem";
```

**Replace With Shared Types**:

```typescript
// ADD THESE IMPORTS INSTEAD:
import { DamageEvent, HealthUpdateEvent, XPGainEvent } from "@runerogue/shared";
```

#### Step 3.2: Fix Property Access Errors

**File**: `src/client/game/GameClient.ts`

**Fix Room ID Access** (line 57):

```typescript
// Change: room.id
// To: room.sessionId
```

**Fix Input Manager Call** (line 71):

```typescript
// Change: this.inputManager.initialize(some_argument)
// To: this.inputManager.initialize()
```

#### Step 3.3: Fix Discord SDK Usage

**Files**:

- `src/client/game/InputManager.ts` (lines 57, 71)
- `src/client/game/UIManager.ts` (lines 204, 209, 214, 219)
- `src/client/index.ts` (lines 24, 333)

**Pattern**: Replace `.on()` and `.register()` calls with proper Discord SDK API

### **PHASE 4: SCHEMA AND TYPE FIXES (20 minutes)**

**Priority**: MEDIUM - Fixes remaining type mismatches

#### Step 4.1: Fix Phaser Namespace Issues

**File**: `src/client/ui/DamageNumber.ts`

**Add Phaser Import**:

```typescript
// Add at top of file:
import * as Phaser from "phaser";
```

#### Step 4.2: Fix Asset Pipeline Types

**Files**:

- `src/assets/comprehensive-extractor-script.ts`
- `src/assets/comprehensive-osrs-extractor.ts`

**Pattern**: Add proper type assertions for `unknown` types

### **PHASE 5: VERIFICATION AND CLEANUP (10 minutes)**

#### Step 5.1: Final Error Check

```bash
# Check remaining errors
npx tsc --noEmit

# Goal: 0 errors
# If > 0, focus on highest frequency error types
```

#### Step 5.2: Test Validation

```bash
# Run gathering system tests
npm test -- --testNamePattern="gathering"

# Run ECS tests
npm test -- --testNamePattern="ECS"

# Full test suite
npm test
```

---

## 🎯 **ERROR PRIORITY MATRIX**

### **HIGH IMPACT (Fix First)**

1. ✅ Missing dependencies (Phaser, sharp, @types/\*)
2. ✅ Import path extensions (.js requirements)
3. ✅ Cross-package imports (client importing server)

### **MEDIUM IMPACT (Fix Second)**

4. Discord SDK property access errors
5. Colyseus Room/State property mismatches
6. Phaser namespace resolution

### **LOW IMPACT (Fix Last)**

7. Asset pipeline type assertions
8. Configuration object mismatches
9. Re-export type declarations

---

## 🚀 **QUICK WINS CHECKLIST**

### **Immediate Fixes (5 minutes each)**

- [ ] Install Phaser: `npm install phaser@^3.70.0`
- [ ] Install sharp: `npm install sharp`
- [ ] Install types: `npm install --save-dev @types/node @types/jest`
- [ ] Add `.js` to import paths in asset files
- [ ] Remove server imports from client files

### **Medium Fixes (10-15 minutes each)**

- [ ] Fix Discord SDK property access patterns
- [ ] Update Colyseus Room property usage
- [ ] Add Phaser namespace imports
- [ ] Fix unknown type assertions in asset pipeline

### **Complex Fixes (20+ minutes)**

- [ ] Refactor cross-package dependencies
- [ ] Update schema property access patterns
- [ ] Clean up legacy import references

---

## 📊 **SUCCESS METRICS**

### **Technical Targets**

- **TypeScript Errors**: 146 → 0 ✅
- **Build Success**: `npx tsc --noEmit` passes ✅
- **Test Stability**: Gathering tests pass ✅

### **Validation Commands**

```bash
# Error count tracking
npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object

# Build validation
npm run build

# Test validation
npm test -- --testNamePattern="AutoCombat|gathering"
```

---

## 🛠️ **DEVELOPMENT ENVIRONMENT**

### **Working Directory**

```bash
cd c:\Users\aggis\GitHub\runerogue\server-ts
```

### **Key Files for Editing**

```
HIGH PRIORITY:
├── src/assets/comprehensive-asset-coordinator.ts
├── src/assets/osrs-cache-reader-fallback.ts
├── src/client/networking/CombatEventHandler.ts
├── src/client/game/GameClient.ts
├── src/client/game/InputManager.ts
├── src/client/game/UIManager.ts
└── src/client/index.ts

MEDIUM PRIORITY:
├── src/client/ui/DamageNumber.ts
├── src/assets/comprehensive-extractor-script.ts
└── src/assets/comprehensive-osrs-extractor.ts
```

### **Status Validation**

```bash
# Before starting
npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object

# After each phase
npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object

# Final validation
npx tsc --noEmit && echo "SUCCESS: Zero TypeScript errors!" || echo "ERRORS REMAINING"
```

---

## 🎯 **ARCHITECTURAL CONTEXT**

### **What's Already Working ✅**

- **ECS Core**: All 6 gathering systems functional
- **OSRS Data**: Authentic calculations accessible
- **Module Resolution**: Import issues resolved
- **Test Foundation**: Core systems tested and stable

### **What Needs Stabilization 🔧**

- **Build Pipeline**: TypeScript compilation errors
- **Client Dependencies**: Missing Phaser/Discord types
- **Import Paths**: ECMAScript module extensions
- **Type Safety**: Unknown type assertions and property access

---

## 🚨 **CRITICAL SUCCESS FACTORS**

1. **Focus on Error Reduction**: Each fix should reduce error count
2. **Maintain Working Systems**: Don't break ECS or gathering functionality
3. **Validate Incrementally**: Check progress after each phase
4. **Document Changes**: Note any architectural decisions
5. **Test Early**: Run tests after major fixes

---

## 🎖️ **MISSION COMPLETION CRITERIA**

### **MUST ACHIEVE**

- ✅ Zero TypeScript compilation errors
- ✅ Gathering system tests passing
- ✅ Build pipeline stable

### **SHOULD ACHIEVE**

- ✅ Client code compiles successfully
- ✅ No cross-package import violations
- ✅ All dependency conflicts resolved

### **COULD ACHIEVE**

- ✅ Full test suite passing
- ✅ Asset pipeline operational
- ✅ Performance optimizations

---

**🚀 READY FOR EXECUTION - LET'S ACHIEVE ZERO ERRORS AND SHIP A STABLE RUNEROGUE PROTOTYPE!**
