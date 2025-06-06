# OSRS Prayer System Implementation Specifications

## Overview

This document provides comprehensive specifications for implementing the OSRS prayer system in the runerogue game, based on detailed research from the OSRS Wiki and game data.

## Prayer System Core Mechanics

### Prayer Points System
- **Prayer Points**: Similar to hitpoints but for prayers
- **Maximum Prayer Points**: Determined by Prayer level (Prayer level = max prayer points)
- **Prayer Point Restoration**:
  - Prayer potions (restore varying amounts)
  - Burying bones (small amounts)
  - Prayer altars (full restoration)
  - Some food items (partial restoration)

### Prayer Drain Mechanics
- **Base Drain Rate**: Each prayer has a specific drain rate measured in points per minute
- **Prayer Bonus Effect**: Equipment with prayer bonus reduces drain rate
  - Formula: Each +1 prayer bonus = +3.333% prayer duration
  - +15 prayer bonus = 50% longer duration
  - +30 prayer bonus = 100% longer duration (double duration)
- **Game Tick System**: Prayer drain occurs every game tick (0.6 seconds in OSRS)

## Combat Prayer Categories & Effects

### Attack Prayers (Accuracy Boost)
1. **Clarity of Thought** (Level 7)
   - Effect: +5% Attack level
   - Drain: 6 points per minute

2. **Improved Reflexes** (Level 16)
   - Effect: +10% Attack level
   - Drain: 12 points per minute

3. **Incredible Reflexes** (Level 34)
   - Effect: +15% Attack level
   - Drain: 20 points per minute

### Strength Prayers (Damage Boost)
1. **Burst of Strength** (Level 4)
   - Effect: +5% Strength level
   - Drain: 6 points per minute

2. **Superhuman Strength** (Level 13)
   - Effect: +10% Strength level
   - Drain: 12 points per minute

3. **Ultimate Strength** (Level 31)
   - Effect: +15% Strength level
   - Drain: 20 points per minute

### Defence Prayers (Defence Boost)
1. **Thick Skin** (Level 1)
   - Effect: +5% Defence level
   - Drain: 6 points per minute

2. **Rock Skin** (Level 10)
   - Effect: +10% Defence level
   - Drain: 12 points per minute

3. **Steel Skin** (Level 28)
   - Effect: +15% Defence level
   - Drain: 20 points per minute

### Advanced Combat Prayers

#### Piety (Level 70) - Premium Combat Prayer
- **Requirements**: Level 70 Prayer, Level 70 Defence, King's Ransom quest
- **Effects**: 
  - +20% Attack level
  - +23% Strength level  
  - +25% Defence level
- **Drain Rate**: 40 points per minute (1 point per 1.5 seconds)
- **Restrictions**: Cannot be used with other stat-boosting prayers

#### Chivalry (Level 60) - Mid-tier Combat Prayer
- **Requirements**: Level 60 Prayer, Level 65 Defence, King's Ransom quest
- **Effects**:
  - +15% Attack level
  - +18% Strength level
  - +20% Defence level
- **Drain Rate**: 30 points per minute

### Protection Prayers
1. **Protect from Melee** (Level 43)
   - Effect: 100% protection from monster melee attacks, 40% from players
   - Drain: 20 points per minute (1 point per 3 seconds)

2. **Protect from Missiles** (Level 40)
   - Effect: 100% protection from monster ranged attacks, 40% from players
   - Drain: 20 points per minute

3. **Protect from Magic** (Level 37)
   - Effect: 100% protection from monster magic attacks, 40% from players
   - Drain: 20 points per minute

## Prayer Bonus Equipment System

### Prayer Bonus Sources
- **Holy Symbol**: +8 prayer bonus
- **Unholy Symbol**: +8 prayer bonus
- **God Books**: +5 prayer bonus
- **Monk Robes**: +6 prayer bonus (full set)
- **Proselyte Armour**: +8 prayer bonus (full set)
- **God Vestments**: Various bonuses (+5 to +8)

### Prayer Bonus Calculation
```typescript
// Prayer duration multiplier formula
const prayerDurationMultiplier = 1 + (prayerBonus * 0.03333);

// Actual drain rate calculation
const actualDrainRate = baseDrainRate / prayerDurationMultiplier;
```

## Implementation Architecture

### Core Prayer System Classes

#### PrayerSystem
```typescript
interface PrayerSystem {
  // Prayer point management
  getCurrentPrayerPoints(): number;
  getMaxPrayerPoints(): number;
  drainPrayerPoints(amount: number): void;
  restorePrayerPoints(amount: number): void;
  
  // Prayer activation/deactivation
  activatePrayer(prayerId: string): boolean;
  deactivatePrayer(prayerId: string): void;
  isActive(prayerId: string): boolean;
  
  // Prayer effects on combat
  getAttackBonus(): number;
  getStrengthBonus(): number;
  getDefenceBonus(): number;
  getProtectionEffects(): ProtectionType[];
}
```

#### Prayer Definition
```typescript
interface Prayer {
  id: string;
  name: string;
  levelRequired: number;
  baseDrainRate: number; // points per minute
  category: PrayerCategory;
  effects: PrayerEffect[];
  conflictsWith: string[]; // prayers that cannot be active simultaneously
}

enum PrayerCategory {
  ATTACK = 'attack',
  STRENGTH = 'strength',
  DEFENCE = 'defence',
  PROTECTION = 'protection',
  RESTORATION = 'restoration',
  OVERHEAD = 'overhead'
}

interface PrayerEffect {
  type: EffectType;
  value: number; // percentage or flat value
  target: StatType;
}
```

### Integration with Combat System

#### Modified Combat Calculations
```typescript
// Enhanced getEffectiveAttackLevel with prayer support
getEffectiveAttackLevel(
  attackLevel: number, 
  combatStyle: CombatStyle,
  prayerBonus: number = 0 // from prayer system
): number {
  const styleBonus = this.getCombatStyleBonus(combatStyle, 'attack');
  const totalBonus = styleBonus + prayerBonus;
  return attackLevel + totalBonus;
}

// Enhanced getEffectiveStrengthLevel with prayer support
getEffectiveStrengthLevel(
  strengthLevel: number,
  combatStyle: CombatStyle,
  prayerBonus: number = 0 // from prayer system
): number {
  const styleBonus = this.getCombatStyleBonus(combatStyle, 'strength');
  const totalBonus = styleBonus + prayerBonus;
  return strengthLevel + totalBonus;
}

// Enhanced getEffectiveDefenceLevel with prayer support
getEffectiveDefenceLevel(
  defenceLevel: number,
  combatStyle: CombatStyle,
  prayerBonus: number = 0 // from prayer system
): number {
  const styleBonus = this.getCombatStyleBonus(combatStyle, 'defence');
  const totalBonus = styleBonus + prayerBonus;
  return defenceLevel + totalBonus;
}
```

### Prayer Drain System

#### Automatic Drain Processing
```typescript
class PrayerDrainManager {
  private drainInterval: NodeJS.Timeout;
  
  startDrainProcessing(): void {
    // Process prayer drain every game tick (600ms)
    this.drainInterval = setInterval(() => {
      this.processPrayerDrain();
    }, 600);
  }
  
  private processPrayerDrain(): void {
    const activePrayers = this.getActivePrayers();
    const totalDrainRate = this.calculateTotalDrainRate(activePrayers);
    const prayerBonus = this.getEquipmentPrayerBonus();
    
    const actualDrainRate = totalDrainRate / (1 + prayerBonus * 0.03333);
    const drainAmount = actualDrainRate / 100; // per tick
    
    this.drainPrayerPoints(drainAmount);
    
    // Auto-deactivate prayers when out of points
    if (this.getCurrentPrayerPoints() <= 0) {
      this.deactivateAllPrayers();
    }
  }
}
```

## Prayer Data Configuration

### Prayer Definitions
```typescript
const PRAYER_DEFINITIONS: Prayer[] = [
  // Attack Prayers
  {
    id: 'clarity_of_thought',
    name: 'Clarity of Thought',
    levelRequired: 7,
    baseDrainRate: 6, // points per minute
    category: PrayerCategory.ATTACK,
    effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 5, target: StatType.ATTACK }],
    conflictsWith: ['improved_reflexes', 'incredible_reflexes', 'piety', 'chivalry']
  },
  {
    id: 'improved_reflexes',
    name: 'Improved Reflexes',
    levelRequired: 16,
    baseDrainRate: 12,
    category: PrayerCategory.ATTACK,
    effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 10, target: StatType.ATTACK }],
    conflictsWith: ['clarity_of_thought', 'incredible_reflexes', 'piety', 'chivalry']
  },
  {
    id: 'incredible_reflexes',
    name: 'Incredible Reflexes',
    levelRequired: 34,
    baseDrainRate: 20,
    category: PrayerCategory.ATTACK,
    effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 15, target: StatType.ATTACK }],
    conflictsWith: ['clarity_of_thought', 'improved_reflexes', 'piety', 'chivalry']
  },
  
  // Strength Prayers
  {
    id: 'burst_of_strength',
    name: 'Burst of Strength',
    levelRequired: 4,
    baseDrainRate: 6,
    category: PrayerCategory.STRENGTH,
    effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 5, target: StatType.STRENGTH }],
    conflictsWith: ['superhuman_strength', 'ultimate_strength', 'piety', 'chivalry']
  },
  {
    id: 'superhuman_strength',
    name: 'Superhuman Strength',
    levelRequired: 13,
    baseDrainRate: 12,
    category: PrayerCategory.STRENGTH,
    effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 10, target: StatType.STRENGTH }],
    conflictsWith: ['burst_of_strength', 'ultimate_strength', 'piety', 'chivalry']
  },
  {
    id: 'ultimate_strength',
    name: 'Ultimate Strength',
    levelRequired: 31,
    baseDrainRate: 20,
    category: PrayerCategory.STRENGTH,
    effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 15, target: StatType.STRENGTH }],
    conflictsWith: ['burst_of_strength', 'superhuman_strength', 'piety', 'chivalry']
  },
  
  // Defence Prayers
  {
    id: 'thick_skin',
    name: 'Thick Skin',
    levelRequired: 1,
    baseDrainRate: 6,
    category: PrayerCategory.DEFENCE,
    effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 5, target: StatType.DEFENCE }],
    conflictsWith: ['rock_skin', 'steel_skin', 'piety', 'chivalry']
  },
  {
    id: 'rock_skin',
    name: 'Rock Skin',
    levelRequired: 10,
    baseDrainRate: 12,
    category: PrayerCategory.DEFENCE,
    effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 10, target: StatType.DEFENCE }],
    conflictsWith: ['thick_skin', 'steel_skin', 'piety', 'chivalry']
  },
  {
    id: 'steel_skin',
    name: 'Steel Skin',
    levelRequired: 28,
    baseDrainRate: 20,
    category: PrayerCategory.DEFENCE,
    effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 15, target: StatType.DEFENCE }],
    conflictsWith: ['thick_skin', 'rock_skin', 'piety', 'chivalry']
  },
  
  // Advanced Combat Prayers
  {
    id: 'piety',
    name: 'Piety',
    levelRequired: 70,
    baseDrainRate: 40,
    category: PrayerCategory.OVERHEAD,
    effects: [
      { type: EffectType.PERCENTAGE_BOOST, value: 20, target: StatType.ATTACK },
      { type: EffectType.PERCENTAGE_BOOST, value: 23, target: StatType.STRENGTH },
      { type: EffectType.PERCENTAGE_BOOST, value: 25, target: StatType.DEFENCE }
    ],
    conflictsWith: ['chivalry', 'clarity_of_thought', 'improved_reflexes', 'incredible_reflexes', 
                    'burst_of_strength', 'superhuman_strength', 'ultimate_strength',
                    'thick_skin', 'rock_skin', 'steel_skin']
  },
  
  // Protection Prayers
  {
    id: 'protect_from_melee',
    name: 'Protect from Melee',
    levelRequired: 43,
    baseDrainRate: 20,
    category: PrayerCategory.PROTECTION,
    effects: [{ type: EffectType.DAMAGE_REDUCTION, value: 100, target: StatType.MELEE_PROTECTION }],
    conflictsWith: ['protect_from_missiles', 'protect_from_magic']
  }
];
```

## Implementation Phases

### Phase 1: Core Prayer System (Priority 1)
1. **Prayer Point Management**
   - Add prayer points to player state
   - Implement prayer point restoration methods
   - Add prayer level tracking

2. **Basic Prayer Activation**
   - Prayer activation/deactivation system
   - Prayer conflict management
   - Prayer requirement validation

### Phase 2: Combat Integration (Priority 1)
1. **Combat Formula Enhancement**
   - Integrate prayer bonuses into existing combat calculations
   - Update `getEffectiveAttackLevel`, `getEffectiveStrengthLevel`, `getEffectiveDefenceLevel`
   - Ensure OSRS-accurate prayer bonus application

2. **Prayer Effect Processing**
   - Real-time prayer bonus calculation
   - Combat stat modification system

### Phase 3: Prayer Drain System (Priority 2)
1. **Automatic Drain Processing**
   - Game tick-based drain system
   - Prayer bonus effect on drain rates
   - Auto-deactivation when out of prayer points

2. **Equipment Prayer Bonus**
   - Prayer bonus equipment detection
   - Prayer bonus calculation integration

### Phase 4: Protection Prayers (Priority 3)
1. **Protection Prayer Effects**
   - Damage reduction mechanics
   - PvP vs PvE protection differences
   - Protection prayer switching

2. **Advanced Prayer Features**
   - Quick prayers system
   - Prayer switching mechanics

## Testing Requirements

### Unit Tests
1. **Prayer Point Management Tests**
2. **Prayer Activation/Deactivation Tests**
3. **Combat Integration Tests**
4. **Prayer Drain Calculation Tests**
5. **Equipment Prayer Bonus Tests**

### Integration Tests
1. **Combat System with Prayer Effects**
2. **Prayer Drain Performance Tests**
3. **Multi-player Prayer State Synchronization**

## Performance Considerations

### Optimization Strategies
1. **Efficient Prayer State Management**
   - Cache active prayer effects
   - Minimize recalculation of prayer bonuses
   - Batch prayer drain processing

2. **Memory Management**
   - Efficient prayer data structures
   - Minimize object creation in drain loops

3. **Network Optimization**
   - Efficient prayer state synchronization
   - Batch prayer updates for multiplayer

## Future Enhancements

### Advanced Features (Future Phases)
1. **Ancient Prayers** (Curses from OSRS)
2. **Prayer Scrolls and Special Prayers**
3. **Prayer Experience System**
4. **Prayer Skill Training Methods**

---

**Status**: Ready for Implementation
**Priority**: High - Critical for accurate OSRS combat system
**Dependencies**: Completed combat formula implementation
**Estimated Implementation Time**: 2-3 weeks
