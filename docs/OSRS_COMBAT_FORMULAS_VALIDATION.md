# OSRS Combat Formulas Validation & Implementation Guide

## Executive Summary

This document validates and documents the exact OSRS combat formulas as implemented in RuneRogue, cross-referencing the official OSRS Wiki with our current codebase implementation in `CombatSystem.ts`.

## Official OSRS Combat Formulas (from OSRS Wiki)

### 1. Max Hit Calculation
```
Effective Strength = floor(Strength Level × Prayer Bonus × Other Bonuses) + Combat Style Bonus + 8
Max Hit = floor(1.3 + (Effective Strength × (Strength Bonus + 64)) / 640)
```

### 2. Attack Roll Calculation
```
Effective Attack = floor(Attack Level × Prayer Bonus × Other Bonuses) + Combat Style Bonus + 8
Max Attack Roll = Effective Attack × (Equipment Attack Bonus + 64)
```

### 3. Defense Roll Calculation
```
Effective Defence = floor(Defence Level × Prayer Bonus × Other Bonuses) + Combat Style Bonus + 8
Max Defence Roll = Effective Defence × (Equipment Defence Bonus + 64)
```

### 4. Hit Chance Calculation
```
if (Attack Roll > Defence Roll):
    Hit Chance = 1 - ((Defence Roll + 2) / (2 × (Attack Roll + 1)))
else:
    Hit Chance = Attack Roll / (2 × (Defence Roll + 1))
```

### 5. Combat Style Bonuses
- **Accurate**: +3 Attack levels
- **Aggressive**: +3 Strength levels  
- **Defensive**: +3 Defence levels
- **Controlled**: +1 to Attack, Strength, and Defence levels

## Current Implementation Analysis

### ✅ Correctly Implemented

1. **Combat Style Bonuses** (`calculateBaseDamage` method):
   ```typescript
   if (combatStyle === CombatStyle.AGGRESSIVE) {
     strengthLevel += 3;
   } else if (combatStyle === CombatStyle.CONTROLLED) {
     strengthLevel += 1;
   }
   ```

2. **Weapon Database Structure**: Proper attack types and strength bonuses defined

3. **Special Attack System**: Framework in place with energy costs and effects

### ❌ Requires Correction

1. **Max Hit Formula** - Current implementation in `calculateBaseDamage`:
   ```typescript
   // CURRENT (INCORRECT)
   let base = (strengthLevel * (strengthBonus + 64)) / 640;
   
   // SHOULD BE (OSRS ACCURATE)
   const effectiveStrength = strengthLevel + 8; // + combat style bonus
   const maxHit = Math.floor(1.3 + (effectiveStrength * (strengthBonus + 64)) / 640);
   ```

2. **Hit Chance Calculation** - Current implementation in `calculateHitChance`:
   ```typescript
   // CURRENT (SIMPLIFIED)
   const effectiveChance = attackLevel - defenseLevel + bonus;
   const chanceFraction = (effectiveChance + specialFactor) / 100;
   
   // SHOULD BE (OSRS ACCURATE)
   const attackRoll = effectiveAttack * (equipmentAttackBonus + 64);
   const defenseRoll = effectiveDefense * (equipmentDefenseBonus + 64);
   // Apply proper OSRS hit chance formula
   ```

3. **Missing Prayer Bonuses**: No prayer system implemented yet

4. **Missing Equipment Bonuses**: Defense bonuses not properly applied in calculations

## Implementation Priority Tasks

### Phase 1: Core Formula Corrections (High Priority)
1. **Fix Max Hit Calculation**
   - Implement proper effective strength calculation
   - Add the +8 base bonus and 1.3 constant
   - Apply combat style bonuses correctly

2. **Fix Hit Chance Calculation**
   - Implement proper attack/defense roll system
   - Add equipment attack/defense bonus application
   - Use correct OSRS hit chance formula

3. **Add Equipment Bonus System**
   - Implement `getAttackBonus()` and `getDefenseBonus()` methods
   - Apply equipment bonuses to combat calculations
   - Add armor defense bonus application

### Phase 2: System Enhancements (Medium Priority)
1. **Prayer System Integration**
   - Add prayer bonus multipliers to formulas
   - Implement prayer point consumption
   - Add combat-related prayers (Strength, Attack, Defense)

2. **Combat Style Refinement**
   - Add Accurate combat style (+3 Attack)
   - Add Defensive combat style (+3 Defense)
   - Implement proper experience distribution

3. **Special Attack Validation**
   - Validate weapon-specific special attacks against OSRS Wiki
   - Implement proper accuracy/damage multipliers
   - Add special attack effects (e.g., Dragon Dagger double hit)

### Phase 3: Advanced Features (Low Priority)
1. **Damage Types & Weaknesses**
   - Implement slash/stab/crush/magic/ranged distinctions
   - Add NPC-specific weaknesses
   - Apply proper defense bonuses by attack type

2. **Status Effects**
   - Poison mechanics
   - Stat draining effects
   - Combat effect stacking/interaction

## Agent Task Assignments

### OSRS Specialist Agent
- **Task**: Validate and document every combat formula against OSRS Wiki
- **Deliverable**: Complete formula reference with exact calculations
- **Timeline**: 2 days

### Lead Architect Agent  
- **Task**: Refactor `CombatSystem.ts` to implement correct OSRS formulas
- **Deliverable**: Updated combat system with proper calculations
- **Timeline**: 3 days

### QA & Balancing Agent
- **Task**: Create comprehensive test suite for combat formulas
- **Deliverable**: Test cases validating OSRS accuracy with edge cases
- **Timeline**: 2 days

## Testing & Validation Strategy

1. **Unit Tests**: Test each formula component individually
2. **Integration Tests**: Validate complete combat scenarios
3. **OSRS Comparison**: Compare outputs with known OSRS scenarios
4. **Performance Tests**: Ensure calculations don't impact game performance

## References

- [OSRS Wiki - Combat](https://oldschool.runescape.wiki/w/Combat)
- [OSRS Wiki - Damage per second/Melee](https://oldschool.runescape.wiki/w/Damage_per_second/Melee)
- [OSRS Wiki - Combat Options](https://oldschool.runescape.wiki/w/Combat_Options)
- Current Implementation: `server-ts/src/server/game/CombatSystem.ts`

## Next Steps

1. Implement Phase 1 corrections immediately
2. Create test cases for validation
3. Document any deviations from OSRS (if needed for game balance)
4. Begin Phase 2 enhancements once core formulas are validated

---

*This document will be updated as implementation progresses and additional OSRS mechanics are researched.*
