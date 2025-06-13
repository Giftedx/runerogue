# 🎯 NEXT AGENT DEVELOPMENT PROMPT - RUNEROGUE SYSTEM STABILIZATION

**Mission:** Fix critical build system failures and integrate completed features  
**Status:** Architecture sound, implementation 80% complete, blocked by TypeScript compilation errors  
**Timeline:** 22-34 hours estimated for full system stabilization

---

## 🚨 CRITICAL SITUATION SUMMARY

### **THE PROBLEM**

RuneRogue has impressive technical architecture and substantial completed work, but **278 TypeScript compilation errors** in `server-ts/` are preventing any development progress. The documentation claims "100% complete" but reality shows critical build failures.

### **THE OPPORTUNITY**

- **ECS system 88.5% working** (23/26 tests passing) - nearly production ready
- **Gathering skills 100% complete** with all tests passing - just needs integration
- **Solid foundation** with bitECS, Colyseus, comprehensive OSRS data

### **THE MISSION**

Transform a sophisticated but broken build system into a working multiplayer game prototype.

---

## 🎯 IMMEDIATE PRIORITY: BUILD SYSTEM RECOVERY

### **Step 1: Diagnose TypeScript Errors**

```bash
cd server-ts
npm run build 2>&1 | head -50
```

**Focus on these error patterns:**

- `Module '"../components"' has no exported member` - Component export issues
- `Cannot find name 'Entity'` - bitECS import problems
- `Cannot find module` - Path resolution failures
- Colyseus schema conflicts

### **Step 2: Fix Component System**

**Examine:** `server-ts/src/server/ecs/components.ts`

```typescript
// Likely missing exports like:
export const Transform = defineComponent({ x: Types.f32, y: Types.f32 });
export const Health = defineComponent({ current: Types.ui16, max: Types.ui16 });
// etc.
```

**Check imports in systems:**

```typescript
// Files likely failing:
import { Transform, Health, Skills } from "../components";
```

### **Step 3: Verify bitECS Integration**

**Check bitECS imports across all files:**

```bash
grep -r "import.*bitecs" server-ts/src/
```

**Common patterns to fix:**

```typescript
// Wrong:
import { World } from "bitecs";
// Correct:
import { IWorld } from "bitecs";

// Wrong:
import { Entity } from "bitecs";
// Correct: Entity is a type alias for number
```

---

## 🔧 SYSTEMATIC REPAIR STRATEGY

### **Phase A: Core Build Recovery (4-6 hours)**

1. **Fix component exports** - Ensure all ECS components export correctly
2. **Resolve bitECS imports** - Fix Entity/World type usage
3. **Clean module paths** - Fix import/export consistency
4. **Achieve clean build** - Zero TypeScript errors

**Success Criteria:**

- [ ] `npm run build` succeeds in server-ts
- [ ] All packages build without errors
- [ ] Basic type checking passes

### **Phase B: ECS Integration (6-8 hours)**

1. **Complete ECS Automation Manager** - Fix remaining 3/26 failing tests
2. **System registration** - Ensure all systems load properly
3. **Entity/component flow** - Test creation and data flow
4. **Game loop integration** - Verify systems execute correctly

**Test Command:**

```bash
cd server-ts && npm test -- --testNamePattern="ECS"
```

**Success Criteria:**

- [ ] ECS Automation Manager 100% test success (currently 88.5%)
- [ ] All systems register without errors
- [ ] Entity creation/destruction works
- [ ] Component data synchronizes properly

### **Phase C: Gathering Skills Integration (4-6 hours)**

**The gathering skills are already complete with 31/31 tests passing.** Just need to integrate:

1. **Import gathering systems** to main ECS world
2. **Test basic gathering** - Woodcutting action end-to-end
3. **Resource node spawning** - Trees/rocks appear in world
4. **UI integration** - Basic gathering action buttons

**Key files ready for integration:**

```
packages/osrs-data/src/skills/gathering-data.ts  ✅ 790 lines of OSRS data
server-ts/src/server/ecs/systems/WoodcuttingSystem.ts  ✅ Complete
server-ts/src/server/ecs/systems/MiningSystem.ts      ✅ Complete
server-ts/src/server/ecs/systems/FishingSystem.ts     ✅ Complete
```

**Success Criteria:**

- [ ] Player can chop a tree and receive logs + XP
- [ ] Resource nodes deplete and respawn
- [ ] XP gain shows in UI
- [ ] Multiple players can gather simultaneously

### **Phase D: Multiplayer Stabilization (4-6 hours)**

1. **Player synchronization** - ECS ↔ Colyseus state sync
2. **Movement replication** - Players see each other move
3. **Action broadcasting** - Gathering actions visible to others
4. **Connection handling** - Graceful disconnect/reconnect

**Success Criteria:**

- [ ] 2-4 players can join same room
- [ ] Player movement synchronizes across clients
- [ ] Gathering actions replicate to other players
- [ ] No crashes on player disconnect

---

## 📊 CURRENT CODEBASE STRENGTHS

### **What's Already Working**

- **OSRS data pipeline** - Comprehensive Wiki data extraction
- **Gathering skills** - 31/31 tests passing, OSRS-authentic
- **ECS architecture** - Sophisticated bitECS implementation
- **Colyseus server** - Basic multiplayer infrastructure
- **Performance monitoring** - 60 FPS targeting system

### **What's Nearly Working**

- **ECS Automation Manager** - 88.5% test success rate
- **Combat system** - Formulas researched, partially implemented
- **GameRoom management** - Player join/leave handling
- **Asset pipeline** - OSRS cache reading capabilities

### **What Needs Integration**

- **Client-server sync** - ECS to Colyseus state bridging
- **UI systems** - Inventory, health bars, skill interfaces
- **World generation** - Resource node placement and management
- **Visual feedback** - Damage numbers, XP notifications

---

## 🎮 TESTING APPROACH

### **Incremental Testing Strategy**

**Test 1: Build Health**

```bash
cd server-ts && npm run build && echo "BUILD SUCCESS"
cd packages/osrs-data && npm test && echo "DATA SUCCESS"
cd packages/game-server && npm test && echo "SERVER SUCCESS"
```

**Test 2: ECS Integration**

```bash
# Start server and verify systems load
cd server-ts && npm start
# In another terminal, test system execution
curl http://localhost:2567/health
```

**Test 3: Gathering Skill**

```bash
# Create test scenario:
# 1. Spawn a tree resource node
# 2. Create a player entity near the tree
# 3. Execute woodcutting action
# 4. Verify XP gain and log collection
```

**Test 4: Multiplayer Sync**

```bash
# Open 2 browser windows
# Connect both to same room
# Test movement synchronization
# Test gathering action visibility
```

---

## ⚠️ CRITICAL WARNINGS

### **DO NOT:**

- Start new features until build system works
- Rewrite existing ECS implementation (it's 88.5% working)
- Ignore gathering skills code (it's complete and tested)
- Change core architecture without understanding current state

### **DO:**

- Focus exclusively on fixing TypeScript compilation errors first
- Test incrementally after each fix
- Preserve existing working components
- Update documentation to reflect reality

### **LIKELY TIME TRAPS:**

- Trying to understand entire codebase before fixing build errors
- Rewriting instead of fixing existing implementations
- Adding new features before stabilizing core systems
- Ignoring test failures in favor of "making it work"

---

## 🏆 SUCCESS DEFINITION

### **Minimum Viable Success (Day 1-2)**

- Zero TypeScript compilation errors
- ECS systems load and execute
- One gathering skill works end-to-end

### **Full Success (Day 3-4)**

- 2 players can join same room
- Players see each other move
- Gathering actions work for all players
- Basic UI shows health, XP, inventory

### **Excellence (Day 5+)**

- All gathering skills functional
- Combat system working
- Robust error handling
- Performance targets achieved (60 FPS)

---

## 📁 KEY FILES TO EXAMINE FIRST

```
server-ts/
├── src/server/ecs/
│   ├── components.ts           # ⚠️ Fix exports here
│   ├── systems/index.ts        # ⚠️ System registration
│   └── world.ts               # ⚠️ Entity creation
├── package.json               # ⚠️ Dependencies
├── tsconfig.json              # ⚠️ TypeScript config
└── src/server/rooms/GameRoom.ts # ⚠️ Colyseus integration

packages/osrs-data/             # ✅ Working, don't touch
packages/game-server/           # ✅ Basic Colyseus setup
```

---

## 🚀 FINAL INSTRUCTION

**Your mission is to transform 278 TypeScript errors into 0 errors, then integrate the completed gathering skills system to create a working multiplayer prototype where players can join a room, move around, and gather resources together.**

**The technical foundation is solid. The architecture is sophisticated. The features are implemented. You just need to make it compile and integrate the pieces.**

**Start with the build system. Everything else depends on it.**
