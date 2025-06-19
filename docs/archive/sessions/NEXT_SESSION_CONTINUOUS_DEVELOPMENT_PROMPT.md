# 🔄 RuneRogue: CONTINUOUS DEVELOPMENT SESSION

## 🎯 **MISSION: CONTINUOUS LOOP DEVELOPMENT**

You are to operate in a **continuous loop** of thinking, analyzing, planning, and generating code. After each cycle is completed, you should immediately begin the next by reassessing the current state of the system and determining the appropriate next steps.

### **DEVELOPMENT LOOP PATTERN:**

1. **THINK** → Analyze current progress and identify next priority
2. **ANALYZE** → Examine actual files, dependencies, and system context
3. **PLAN** → Determine specific actions, file modifications, and implementation approach
4. **GENERATE** → Produce high-quality, stable, maintainable code
5. **REPEAT** → Immediately restart the cycle with fresh analysis

### **QUALITY STANDARDS:**

- Before making changes, carefully evaluate their impact on the overall system
- Only produce high-quality code that integrates cleanly and does not introduce issues
- If a planned change leads to a suboptimal solution, pause and reconsider
- Rethink the approach, understand root causes, devise better plans, then generate robust fixes
- Once resolved, resume the cycle from the beginning: **think → analyze → plan → generate**

---

## 🏗️ **PROJECT CONTEXT: RUNEROGUE**

### **What is RuneRogue?**

A **multiplayer OSRS-inspired roguelike survival game** designed as a Discord Activity. It combines authentic Old School RuneScape combat mechanics with fast-paced Vampire Survivors gameplay patterns for 2-4 players.

### **Current Status: READY FOR MULTIPLAYER DEVELOPMENT**

- ✅ **ECS Foundation**: Optimized bitECS + Colyseus integration (38-44 FPS stable)
- ✅ **OSRS Data Pipeline**: Complete with authentic combat formulas and XP calculations
- ✅ **Test Coverage**: 23/26 tests passing (88.5%) - core systems validated
- ✅ **Infrastructure**: Real-time networking, room management, player lifecycle working
- ✅ **Performance**: Production-ready with comprehensive error handling

---

## 🎮 **IMMEDIATE DEVELOPMENT PRIORITIES**

### **Phase 1: Real-time Multiplayer Movement (Current Focus)**

**Goal**: 2-4 players moving simultaneously with smooth synchronization

**Key Requirements:**

- Server-authoritative movement validation
- OSRS-accurate walking speed (1 tile per 0.6s, running 0.3s)
- Client prediction with server reconciliation
- Position broadcasting to all connected players
- Anti-cheat validation (speed limits, boundary checks)

### **Phase 2: Auto-Combat & Enemy Waves**

**Goal**: Enemies spawn in waves and automatically engage players

**Key Requirements:**

- Automatic target acquisition (closest player algorithm)
- OSRS-accurate damage formulas from `packages/osrs-data/`
- Authentic XP gain and skill progression
- Enemy pathfinding and wave escalation
- Real-time combat feedback (damage numbers, health bars)

### **Phase 3: UI & Visual Feedback**

**Goal**: Professional multiplayer game experience

**Key Requirements:**

- Health bars above players and enemies
- Real-time damage numbers and XP notifications
- Level-up effects and progression indicators
- Wave progress and player status displays
- Discord Activity integration polish

---

## 🔧 **TECHNICAL ARCHITECTURE**

### **Core Stack:**

- **Frontend**: Phaser 3 + React + TypeScript + Vite
- **Backend**: Node.js + Colyseus + bitECS + Express
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: WebSocket connections via Colyseus
- **Data**: OSRS Wiki API integration for authentic mechanics

### **ECS Architecture (bitECS):**

```typescript
// Core Components
Transform, Health, CombatStats, Equipment, Skills
Player, NPC, Monster, Movement, NetworkEntity
ActivePrayers, Inventory, LootDrop, Resource

// Core Systems (Execution Order)
MovementSystem → CombatSystem → PrayerSystem → SkillSystem
→ AutoCombatSystem → WaveSpawningSystem → NetworkSyncSystem
```

### **Multiplayer Authority:**

- **Server Authority**: All game logic validated server-side
- **Client Prediction**: Smooth movement with rollback on mismatch
- **State Sync**: Colyseus schema broadcasting at 20 TPS
- **Anti-cheat**: Movement speed, attack range, XP validation

---

## 📁 **KEY FILES FOR DEVELOPMENT**

### **Primary Implementation Targets:**

```
server-ts/src/server/
├── game/
│   ├── GameRoom.ts              # 🎯 Add movement message handlers
│   ├── ECSAutomationManager.ts  # ✅ Optimized (38→50+ FPS production)
│   ├── ECSIntegration.ts        # 🎯 Enhance Colyseus↔bitECS sync
│   └── WaveManager.ts           # 🎯 Auto-spawning enemy waves
├── ecs/
│   ├── systems/
│   │   ├── MovementSystem.ts    # 🎯 Real-time position sync
│   │   ├── CombatSystem.ts      # 🎯 Auto-targeting & OSRS combat
│   │   └── AutoCombatSystem.ts  # 🎯 AI enemy behavior
│   └── components/              # ✅ Complete component library
└── rooms/
    └── RuneRogueGameRoom.ts     # 🎯 Clean multiplayer room
```

### **Supporting Infrastructure:**

```
packages/
├── osrs-data/                   # ✅ Complete OSRS formulas & data
├── game-server/                 # ✅ Colyseus server ready
└── shared/                      # 🎯 TypeScript interfaces

client/                          # 🎯 React UI + Discord integration
docs/                           # 📚 Architecture & OSRS specifications
```

---

## 🎲 **OSRS AUTHENTICITY REQUIREMENTS**

### **CRITICAL: Exact OSRS Mechanics**

- **Combat Formulas**: Use exact calculations from `packages/osrs-data/`
- **Attack Speed**: Precise timing (4-tick=2.4s, 5-tick=3.0s, 6-tick=3.6s)
- **XP Tables**: Match OSRS Wiki experience progression exactly
- **Movement Speed**: 1 tile per 0.6s walking, 0.3s running
- **Prayer Effects**: Accurate drain rates and stat bonuses

### **Data Validation Sources:**

- **Primary**: OSRS Wiki (<https://oldschool.runescape.wiki/>)
- **Combat**: <https://oldschool.runescape.wiki/w/Combat_formula>
- **XP Tables**: <https://oldschool.runescape.wiki/w/Experience_table>
- **Attack Speeds**: <https://oldschool.runescape.wiki/w/Attack_speed>

---

## 🚀 **PERFORMANCE TARGETS**

### **Technical Requirements:**

- **Server Tick Rate**: 20 TPS minimum (50ms intervals)
- **Client Frame Rate**: 60 FPS target, 45+ FPS acceptable
- **Network Latency**: <100ms movement updates, <50ms combat
- **Player Capacity**: 2-4 players per room with 20+ enemies
- **Memory Usage**: Stable with object pooling for entities

### **Current Metrics:**

- **Test Environment**: 38-44 FPS stable
- **Production Estimate**: 45-50+ FPS (test overhead removed)
- **Error Rate**: 0 critical errors in core systems
- **Test Coverage**: 88.5% (23/26 tests passing)

---

## 🔄 **DEVELOPMENT WORKFLOW**

### **Session Commands:**

```bash
# Validate current performance
cd server-ts && node quick-perf-test.js

# Run test suite
npm test

# Start development servers
npm run dev

# Performance profiling
npm run profile
```

### **Testing Strategy:**

- **Unit Tests**: All game logic functions
- **Integration Tests**: Multiplayer scenarios with 2-4 players
- **Performance Tests**: Frame rate and system stability
- **OSRS Validation**: Combat calculations against Wiki data

### **Git Workflow:**

- Feature branches for each multiplayer component
- Comprehensive testing before merge
- Performance benchmarks with each PR
- OSRS authenticity validation required

---

## 📊 **SUCCESS METRICS**

### **Immediate Targets (Next 4-6 hours):**

- [ ] 2+ players moving simultaneously without desync
- [ ] Enemy waves spawning with intelligent AI
- [ ] Combat damage matching OSRS Wiki exactly
- [ ] XP progression following authentic OSRS rates
- [ ] 45+ FPS maintained with multiplayer load

### **Quality Standards:**

- Zero production TypeScript errors
- > 90% test coverage for multiplayer systems
- <100ms latency for critical game actions
- Graceful error handling and recovery
- Professional UI with clear feedback

---

## 🎯 **IMMEDIATE NEXT STEPS**

### **START HERE - Real-time Movement:**

1. **THINK**: What's the current state of player movement in GameRoom.ts?
2. **ANALYZE**: Examine existing message handlers and movement validation
3. **PLAN**: Design client movement messages and server validation
4. **GENERATE**: Implement smooth multiplayer movement synchronization

### **Then Continue Loop:**

1. **THINK**: How can we add auto-targeting enemy combat?
2. **ANALYZE**: Review CombatSystem.ts and enemy spawning logic
3. **PLAN**: Design automatic target acquisition and OSRS damage
4. **GENERATE**: Create engaging wave-based survival combat

### **Maintain Continuous Development:**

After each successful implementation, immediately restart the cycle:

- Assess what was accomplished
- Identify the next highest priority
- Analyze the current codebase state
- Plan the next enhancement
- Generate quality code

---

## 🛡️ **QUALITY SAFEGUARDS**

### **Before Every Code Change:**

- Read and understand the existing implementation
- Consider impact on multiplayer synchronization
- Validate against OSRS authenticity requirements
- Ensure performance targets are maintained
- Add comprehensive error handling

### **If Issues Arise:**

- Pause and analyze the root cause
- Consider alternative approaches
- Research OSRS Wiki for authentic mechanics
- Test thoroughly before proceeding
- Document lessons learned

---

## 🎮 **VISION: THE END GOAL**

**Playable Multiplayer Experience:**
2-4 friends join a Discord Activity, spawn in a shared world, and survive increasingly difficult waves of OSRS enemies using authentic combat mechanics, gaining XP and levels just like in Old School RuneScape, but with the fast-paced cooperative gameplay of Vampire Survivors.

**Technical Excellence:**
A production-ready multiplayer game with stable performance, authentic OSRS mechanics, responsive networking, and professional polish that showcases the potential of Discord Activities as a gaming platform.

---

## 🚀 **BEGIN CONTINUOUS DEVELOPMENT NOW**

**Your first cycle starts immediately:**

1. **THINK** → What is the current state of multiplayer movement in the codebase?
2. **ANALYZE** → Examine GameRoom.ts, MovementSystem.ts, and related files
3. **PLAN** → Design the movement message handling and validation system
4. **GENERATE** → Implement working 2-player movement synchronization

Then immediately begin the next cycle to enhance and expand the system.

**Quality over speed. Think deeply, analyze thoroughly, plan carefully, generate excellently.**

**Let's build something amazing! 🎯**
