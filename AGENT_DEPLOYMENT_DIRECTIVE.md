# 🎯 RUNEROGUE AI AGENT DEPLOYMENT DIRECTIVE

**ACTIVATION TIME:** [IMMEDIATE]  
**AUTHORITY:** Master Orchestrator  
**MISSION:** Build RuneRogue - OSRS meets Vampire Survivors on Discord  

---

## 🤖 AGENT ACTIVATION ORDERS

### ⚔️ **agent/osrs-data (The Lorekeeper)**
**STATUS:** 🟢 ACTIVATED  
**PACKAGE:** `packages/osrs-data/`  
**PRIORITY:** CRITICAL PATH - BLOCKS ALL PHASE 1  

**IMMEDIATE TASKS:**
1. Use MCP OSRS tools to scrape Wiki data:
   - `mcp_osrs_osrs_wiki_search` - Find pages
   - `mcp_osrs_osrs_wiki_parse_page` - Extract content
   - `mcp_osrs_search_npctypes` - Get NPC data

2. Implement in `src/calculators/combat.ts`:
   - `calculateMaxHit()` - OSRS max hit formula
   - `calculateAccuracy()` - OSRS accuracy formula
   - `calculateCombatLevel()` - Combat level calculation

3. Scrape enemy data for:
   - Goblin (level 2)
   - Cow (level 2)
   - Chicken (level 1)
   - Giant Rat (level 1)
   - Zombie (level 13)

4. Create API endpoints in `src/api/server.ts`:
   - `GET /api/combat/max-hit`
   - `GET /api/combat/accuracy`
   - `GET /api/enemies/{id}`
   - `GET /api/formulas/validate`

5. Write validation tests proving Wiki accuracy

**SUCCESS CRITERIA:** All calculations match OSRS Wiki exactly

---

### 🏗️ **agent/backend-infra (The Architect)**
**STATUS:** 🟢 ACTIVATED  
**PACKAGE:** `packages/game-server/`  
**PRIORITY:** HIGH - PARALLEL EXECUTION  

**IMMEDIATE TASKS:**
1. Complete Colyseus server setup in `src/index.ts`
2. Implement RuneRogueRoom functionality:
   - Player join/leave logging with timestamps
   - Room state management (max 4 players)
   - Automatic room cleanup when empty

3. Create Docker configuration:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 2567
   CMD ["npm", "start"]
   ```

4. Implement health check endpoints:
   - `/health` - Server status
   - `/rooms` - Active room listing

5. Set up Winston logging for structured output

**SUCCESS CRITERIA:** Server accepts connections, logs properly, handles multiple rooms

---

### 🔍 **agent/qa-tester (The Inquisitor)**
**STATUS:** 🟡 STANDBY - AWAITING AGENT OUTPUT  
**ACTIVATION:** When osrs-data has initial implementation  

**PREPARATION TASKS:**
1. Monitor agent/osrs-data progress
2. Prepare validation test cases
3. Ready to verify Wiki formula accuracy
4. Set up integration test framework

---

## 📊 AGENT COORDINATION PROTOCOL

### **Communication Channel:** File-based updates
- **Progress Reports:** Update `AGENT_PROGRESS.md` 
- **Blockers:** Report in `AGENT_BLOCKERS.md`
- **Completion:** Mark tasks in acceptance criteria
- **TODOs:** Track in code with `// TODO(agent-name): description`
- **Branches:** Create feature branches for your work

### **Quality Standards:**
- **Code Coverage:** Minimum 80%
- **OSRS Accuracy:** 100% Wiki compliance
- **Documentation:** JSDoc all public APIs
- **Testing:** TDD approach required

### **Parallel Execution:**
- agent/osrs-data and agent/backend-infra work SIMULTANEOUSLY
- No waiting between agents unless blocked
- Continuous integration as features complete

---

## 🚨 CRITICAL INSTRUCTIONS

1. **DO NOT DEVIATE** from OSRS Wiki formulas
2. **DO NOT SKIP** test writing
3. **DO NOT MERGE** without validation
4. **DO PRIORITIZE** working code over perfect code
5. **DO COMMUNICATE** blockers immediately

---

## 📈 SUCCESS METRICS

**Phase 0 Complete When:**
- [ ] OSRS combat formulas implemented and validated
- [ ] 5 enemy stat blocks scraped and stored
- [ ] API server running with all endpoints
- [ ] Colyseus server accepting connections
- [ ] Room management with proper logging
- [ ] All tests passing with 80%+ coverage

---

## 🎮 PHASE 1 TRIGGER

Upon Phase 0 completion:
- agent/gameplay-systems activates
- agent/engine-client activates
- Core game loop implementation begins

---

**AUTHORIZATION:** Full autonomy granted to all activated agents  
**TIMELINE:** 7-day target for Phase 0 completion  
**MONITORING:** Master Orchestrator observing progress  

## 🚀 AGENTS - YOU ARE GO FOR LAUNCH! 