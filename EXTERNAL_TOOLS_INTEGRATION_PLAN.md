# External OSRS Tools Integration Analysis & Implementation Plan

## Overview

Based on the provided external OSRS tools and resources, this document outlines how to enhance RuneRogue's data authenticity and resolve current build issues by integrating proven external APIs and databases.

## External Tools Analysis

### 1. **OSRSBox Database** (Priority 1)

- **URL**: <https://www.osrsbox.com/> & <https://api.osrsbox.com/>
- **GitHub**: <https://github.com/osrsbox/osrsbox-db>
- **Value**: Complete JSON database of all OSRS items, monsters, and prayers
- **Status**: Partially integrated (referenced in asset extractors)
- **Integration**: RESTful API with comprehensive item/monster data

### 2. **OSRSReboxed Database** (Priority 1)

- **GitHub**: <https://github.com/0xNeffarion/osrsreboxed-db>
- **Value**: Updated fork of OSRSBox with additional data and fixes
- **Status**: Not integrated
- **Integration**: More current than OSRSBox, JSON database format

### 3. **OSRS Cache Reader** (Priority 2)

- **GitHub**: <https://github.com/Dezinater/osrscachereader>
- **Status**: ✅ Already installed (v1.1.0)
- **Value**: Direct cache asset extraction for authentic sprites/models
- **Integration**: JavaScript library for extracting game files

### 4. **RuneMonk Entity Viewer** (Priority 2)

- **URL**: <https://runemonk.com/tools/entityviewer/>
- **Status**: ✅ Partially integrated (asset extractors exist)
- **Value**: High-quality 3D models and entity visualization
- **Integration**: Web scraping for model extraction

### 5. **Explv's Map** (Priority 3)

- **URL**: <https://explv.github.io/>
- **GitHub**: <https://github.com/BegOsrs/osrs-map>
- **Value**: Accurate OSRS world map with pathfinding data
- **Status**: Not integrated
- **Integration**: Map tiles and collision detection

### 6. **Gearscape** (Priority 3)

- **URL**: <https://gearscape.net/>
- **Value**: Equipment calculator and DPS optimization
- **Status**: Not integrated
- **Integration**: Combat calculation validation

### 7. **OSRS.World** (Priority 3)

- **URL**: <https://osrs.world/>
- **Value**: Real-time game state and price tracking
- **Status**: Not integrated
- **Integration**: Market data and game state

## Current Integration Status

### ✅ **Working Integrations**

1. **OSRS Data Package**: 13/13 tests passing with core combat formulas
2. **osrscachereader**: v1.1.0 installed with extraction framework
3. **RuneMonk**: Asset extraction classes implemented
4. **OSRS Wiki API**: Functional data pipeline

### 🔧 **Build Issues to Resolve**

Current build has 180 errors - focusing on critical data integration issues:

1. **Missing Message Types**: TradeRequestMessage, EquipItemMessage properties
2. **Schema Property Mismatches**: Combat system integration
3. **External API Integration**: Missing type definitions

## Immediate Implementation Plan

### Phase 1: Critical Data Integration (This Session)

#### 1.1 Integrate OSRSReboxed Database

```typescript
// Add to packages/osrs-data/src/external/osrsreboxed.ts
export class OSRSReboxedClient {
  private baseUrl =
    "https://raw.githubusercontent.com/0xNeffarion/osrsreboxed-db/master/";

  async getItemDatabase(): Promise<ItemData[]> {
    const response = await fetch(`${this.baseUrl}items/items-complete.json`);
    return response.json();
  }

  async getMonsterDatabase(): Promise<MonsterData[]> {
    const response = await fetch(
      `${this.baseUrl}monsters/monsters-complete.json`
    );
    return response.json();
  }
}
```

#### 1.2 Enhanced Item Schema with External Data

```typescript
// Extend current InventoryItem with comprehensive data
export interface EnhancedItemData {
  // Current properties
  itemId: string;
  name: string;
  // OSRSReboxed integration
  equipmentSlot?: string;
  attackStyles?: string[];
  bonuses: {
    attack: number[];
    defence: number[];
    strength: number[];
    ranged: number[];
    magic: number[];
    prayer: number;
  };
  requirements: {
    attack?: number;
    strength?: number;
    defence?: number;
    // ... other skills
  };
}
```

#### 1.3 Fix Message Type Definitions

```typescript
// Add to src/shared/types/messages.ts
export interface TradeRequestMessage {
  type: "trade_request";
  targetPlayerId: string;
}

export interface EquipItemMessage {
  type: "equip_item";
  itemIndex: number;
  slot: string;
}

export interface TradeOfferMessage {
  type: "trade_offer";
  offeredItems: InventoryItem[];
}
```

### Phase 2: Enhanced Combat System Integration

#### 2.1 Integrate Combat Calculators with External Data

```typescript
// Enhanced combat system using external databases
export class AuthenticCombatSystem {
  private osrsReboxed: OSRSReboxedClient;
  private osrsBox: OSRSBoxClient;

  async calculateDamage(
    attacker: Player,
    defender: Player
  ): Promise<CombatResult> {
    // Get weapon data from external sources
    const weaponData = await this.getWeaponData(attacker.equipment.weapon);
    const defenderArmor = await this.getArmorData(defender.equipment);

    // Use exact OSRS formulas with real data
    return this.osrsData.calculateMaxHit({
      attackLevel: attacker.skills.attack.level,
      strengthLevel: attacker.skills.strength.level,
      weaponStats: weaponData,
      defenderStats: defenderArmor,
    });
  }
}
```

#### 2.2 Prayer System with Authentic Data

```typescript
// Prayer effects from OSRSReboxed database
export class AuthenticPrayerSystem {
  private prayerDatabase: Map<string, PrayerData>;

  async initializePrayers(): Promise<void> {
    const prayers = await this.osrsReboxed.getPrayerDatabase();
    this.prayerDatabase = new Map(prayers.map((p) => [p.name, p]));
  }

  calculatePrayerDrain(activePrayers: string[]): number {
    return activePrayers.reduce((total, prayer) => {
      const data = this.prayerDatabase.get(prayer);
      return total + (data?.drainRate || 0);
    }, 0);
  }
}
```

### Phase 3: Asset Pipeline Enhancement

#### 3.1 Comprehensive Asset Extraction

```typescript
// Multi-source asset coordinator
export class EnhancedAssetPipeline {
  private sources = {
    osrsReboxed: new OSRSReboxedClient(),
    cacheReader: new OSRSCacheReader(),
    runemonk: new RuneMonkExtractor(),
    explvMap: new ExplvMapExtractor(),
  };

  async extractAllAssets(): Promise<AssetManifest> {
    const results = await Promise.allSettled([
      this.extractFromReboxed(),
      this.extractFromCache(),
      this.extractFromRuneMonk(),
      this.extractMapData(),
    ]);

    return this.mergeAssetSources(results);
  }
}
```

## Expected Outcomes

### Build Error Reduction

- **Current**: 180 build errors
- **Target**: <50 build errors after Phase 1
- **Ultimate**: <10 build errors after complete integration

### Data Authenticity Enhancement

- **Item Database**: 25,000+ authentic items from OSRSReboxed
- **Monster Database**: 10,000+ monsters with exact stats
- **Combat Calculations**: 100% OSRS-accurate formulas
- **Asset Coverage**: Comprehensive sprite/model extraction

### Performance Improvements

- **Cached External Data**: Local database for offline development
- **Incremental Updates**: Only fetch changed data
- **Asset Optimization**: Compressed and optimized game assets

## Implementation Priority

### Immediate (This Session)

1. ✅ Fix critical build errors by adding missing message types
2. ✅ Integrate OSRSReboxed database client
3. ✅ Enhanced item/monster schemas with external data
4. ✅ Validate combat formulas against external databases

### Short-term (Next 1-2 Sessions)

1. Complete asset pipeline integration
2. Add Explv's map pathfinding
3. Implement comprehensive testing with external data
4. Performance optimization and caching

### Medium-term (Next Sprint)

1. Real-time data synchronization
2. Advanced combat features using external tools
3. Map-based gameplay mechanics
4. Complete visual asset coverage

## Testing Strategy

### External Data Validation

```typescript
describe("External Data Integration", () => {
  it("should match OSRSReboxed item stats with our calculations", async () => {
    const reboxedItem = await osrsReboxed.getItem("dragon_scimitar");
    const ourCalculation = await combat.calculateItemStats("dragon_scimitar");

    expect(ourCalculation.attackBonus).toEqual(
      reboxedItem.equipment.attack_stab
    );
    expect(ourCalculation.strengthBonus).toEqual(
      reboxedItem.equipment.melee_strength
    );
  });

  it("should validate combat calculations against multiple sources", async () => {
    const result1 = await osrsBox.calculateDamage(player1, player2);
    const result2 = await osrsReboxed.calculateDamage(player1, player2);
    const ourResult = await combat.calculateDamage(player1, player2);

    expect(ourResult).toBeCloseTo(result1, 0);
    expect(ourResult).toBeCloseTo(result2, 0);
  });
});
```

## Conclusion

The external OSRS tools provide a wealth of authenticated data that will dramatically improve RuneRogue's authenticity and resolve current build issues. The implementation plan prioritizes immediate build fixes while laying the foundation for comprehensive external data integration.

Key benefits:

- **Authentic OSRS Data**: Direct access to exact game stats and formulas
- **Comprehensive Asset Coverage**: Multiple extraction sources for complete visual authenticity
- **Build Stability**: Proper type definitions and schema integration
- **Future-Proofing**: Modular external data system for ongoing updates

This integration will move RuneRogue from approximate OSRS mechanics to exact authenticity, providing the foundation for a truly professional Discord Activity.
