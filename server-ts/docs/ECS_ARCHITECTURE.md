# ECS Architecture Design - RuneRogue

## Overview

This document outlines the Entity Component System (ECS) architecture for RuneRogue using bitECS. The design aims to replace the current direct state manipulation in GameRoom with a performant, data-oriented approach.

## Technology Choice: bitECS

### Why bitECS?
- **Performance**: Consistently ranks as one of the fastest ECS libraries in benchmarks
- **TypeScript Support**: Full TypeScript support with type safety
- **Data-Oriented**: Uses TypedArrays for optimal cache performance
- **Lightweight**: ~5kb minzipped with zero dependencies
- **Colyseus Compatible**: Can be integrated with Colyseus schemas

### Performance Benchmarks
Based on benchmark comparisons:
- **Iteration**: 335,064+ ops/sec (top performer)
- **Add/Remove**: 2,334+ ops/sec
- **Memory Efficient**: Uses TypedArrays for minimal memory footprint

## Component Architecture

### Core Components

#### 1. **Transform Component**
```typescript
const Transform = {
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
  rotation: Types.f32
}
```

#### 2. **Health Component**
```typescript
const Health = {
  current: Types.ui16,
  max: Types.ui16,
  regenRate: Types.f32
}
```

#### 3. **CombatStats Component**
```typescript
const CombatStats = {
  attack: Types.ui8,
  strength: Types.ui8,
  defence: Types.ui8,
  attackBonus: Types.i16,
  strengthBonus: Types.i16,
  defenceBonus: Types.i16
}
```

#### 4. **Equipment Component**
```typescript
const Equipment = {
  weapon: Types.ui32,    // Entity ID reference
  armor: Types.ui32,     
  shield: Types.ui32,
  helmet: Types.ui32,
  boots: Types.ui32,
  gloves: Types.ui32,
  cape: Types.ui32,
  ring: Types.ui32,
  amulet: Types.ui32
}
```

#### 5. **Skills Component**
```typescript
const Skills = {
  // Each skill stored as current level (0-99)
  attack: Types.ui8,
  strength: Types.ui8,
  defence: Types.ui8,
  ranged: Types.ui8,
  prayer: Types.ui8,
  magic: Types.ui8,
  runecrafting: Types.ui8,
  hitpoints: Types.ui8,
  crafting: Types.ui8,
  mining: Types.ui8,
  smithing: Types.ui8,
  fishing: Types.ui8,
  cooking: Types.ui8,
  firemaking: Types.ui8,
  woodcutting: Types.ui8,
  agility: Types.ui8,
  herblore: Types.ui8,
  thieving: Types.ui8,
  fletching: Types.ui8,
  slayer: Types.ui8,
  farming: Types.ui8,
  construction: Types.ui8,
  hunter: Types.ui8
}
```

#### 6. **SkillExperience Component**
```typescript
const SkillExperience = {
  // Experience stored as integers (0-200,000,000)
  attackXP: Types.ui32,
  strengthXP: Types.ui32,
  defenceXP: Types.ui32,
  // ... etc for all skills
}
```

#### 7. **Inventory Component**
```typescript
const Inventory = {
  // 28 slots for OSRS inventory
  slots: [Types.ui32, 28],      // Item entity IDs
  quantities: [Types.ui16, 28]  // Stack sizes
}
```

#### 8. **Item Component**
```typescript
const Item = {
  itemId: Types.ui16,        // OSRS item ID
  quantity: Types.ui16,      // Stack size
  noted: Types.ui8,          // 0 or 1
  charges: Types.ui16        // For degradable items
}
```

#### 9. **NPCData Component**
```typescript
const NPCData = {
  npcId: Types.ui16,         // OSRS NPC ID
  combatLevel: Types.ui8,
  aggroRange: Types.ui8,
  attackRange: Types.ui8,
  attackSpeed: Types.ui8,
  respawnTime: Types.ui16
}
```

#### 10. **Movement Component**
```typescript
const Movement = {
  velocityX: Types.f32,
  velocityY: Types.f32,
  speed: Types.f32,
  targetX: Types.f32,
  targetY: Types.f32
}
```

#### 11. **Player Component** (Tag)
```typescript
const Player = defineComponent()
```

#### 12. **NPC Component** (Tag)
```typescript
const NPC = defineComponent()
```

#### 13. **ActivePrayers Component**
```typescript
const ActivePrayers = {
  // Bitflags for active prayers
  prayers: Types.ui32
}
```

#### 14. **NetworkEntity Component**
```typescript
const NetworkEntity = {
  sessionId: Types.ui32,  // Hashed session ID
  lastUpdate: Types.f64   // Timestamp
}
```

## System Architecture

### Core Systems

#### 1. **MovementSystem**
- Updates entity positions based on velocity
- Handles collision detection
- Updates target positions

#### 2. **CombatSystem**
- Processes combat actions
- Calculates damage using OSRS formulas
- Handles special attacks
- Updates health values

#### 3. **SkillSystem**
- Calculates XP gains
- Updates skill levels
- Handles level-up events

#### 4. **PrayerSystem**
- Manages prayer activation/deactivation
- Drains prayer points
- Applies prayer effects

#### 5. **ItemSystem**
- Handles item pickups/drops
- Manages inventory operations
- Processes equipment changes

#### 6. **NPCSystem**
- AI behavior for NPCs
- Aggro detection
- Pathfinding
- Respawn handling

#### 7. **NetworkSyncSystem**
- Syncs ECS state with Colyseus schemas
- Handles entity creation/destruction
- Manages state interpolation

#### 8. **RespawnSystem**
- Handles player/NPC respawning
- Manages death animations
- Resets entity states

#### 9. **LootSystem**
- Generates loot drops
- Manages loot ownership
- Handles loot despawning

#### 10. **GatheringSystem**
- Processes resource gathering
- Updates resource states
- Grants XP and items

## Integration with Colyseus

### State Synchronization Strategy

1. **ECS as Source of Truth**
   - All game logic operates on ECS
   - Colyseus schemas mirror ECS state
   - One-way data flow: ECS → Colyseus

2. **Sync Adapter**
```typescript
class ECSToColyseusAdapter {
  private world: World;
  private roomState: WorldState;
  
  syncEntities() {
    // Query all networked entities
    const networked = query(world, [NetworkEntity]);
    
    // Update Colyseus schemas from ECS data
    for (const eid of networked) {
      this.syncEntity(eid);
    }
  }
  
  private syncEntity(eid: number) {
    // Map ECS components to Colyseus schema
    const player = this.roomState.players.get(sessionId);
    if (player) {
      player.x = Transform.x[eid];
      player.y = Transform.y[eid];
      player.health = Health.current[eid];
      // ... etc
    }
  }
}
```

### Entity ID Management

1. **Dual ID System**
   - ECS uses numeric entity IDs (0, 1, 2...)
   - Colyseus uses string session IDs
   - Maintain bidirectional mapping

2. **ID Mapping**
```typescript
class EntityIDMapper {
  private ecsToSession = new Map<number, string>();
  private sessionToEcs = new Map<string, number>();
  
  register(eid: number, sessionId: string) {
    this.ecsToSession.set(eid, sessionId);
    this.sessionToEcs.set(sessionId, eid);
  }
}
```

## Migration Plan

### Phase 1: Setup (Week 1)
- [ ] Install and configure bitECS
- [ ] Create component definitions
- [ ] Implement basic systems
- [ ] Create ECS-Colyseus adapter

### Phase 2: Core Systems (Week 2)
- [ ] Migrate movement logic to MovementSystem
- [ ] Migrate combat logic to CombatSystem
- [ ] Implement NetworkSyncSystem
- [ ] Test multiplayer synchronization

### Phase 3: Full Migration (Week 3)
- [ ] Migrate all game logic to ECS
- [ ] Remove direct schema manipulation
- [ ] Implement remaining systems
- [ ] Performance optimization

### Phase 4: Testing (Week 4)
- [ ] Unit tests for all systems
- [ ] Integration tests
- [ ] Performance benchmarks
- [ ] Load testing

## Performance Considerations

1. **Query Caching**
   - Cache frequently used queries
   - Update queries only when entity composition changes

2. **System Ordering**
   - Critical systems (movement, combat) run first
   - Network sync runs last
   - Visual/audio systems can be throttled

3. **Component Packing**
   - Group related components for cache efficiency
   - Use appropriate data types (ui8 vs ui32)
   - Align component sizes for optimal memory layout

## Benefits of This Architecture

1. **Performance**
   - Cache-efficient iteration
   - Minimal memory allocations
   - Fast component access

2. **Flexibility**
   - Easy to add/remove components
   - Systems are modular and reusable
   - Clear separation of concerns

3. **Maintainability**
   - Logic is centralized in systems
   - Components are just data
   - Easy to debug and test

4. **Scalability**
   - Can handle thousands of entities
   - Systems can be parallelized
   - Memory usage is predictable

## Next Steps

1. Create proof-of-concept with basic movement
2. Benchmark against current implementation
3. Implement combat system as test case
4. Begin incremental migration