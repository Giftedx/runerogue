import { IWorld, defineQuery } from 'bitecs';
import * as Components from '../ecs/components';
import {
  GameRoomState,
  PlayerSchema,
  EnemySchema,
  Vector2Schema,
  HealthSchema,
  CombatStatsSchema,
  PrayerSchema,
  // Removed unused SpecialAttackSchema import
  EquipmentSchema,
  ItemSchema,
  EnemyStatsSchema,
  EquipmentBonusesSchema,
} from '@runerogue/shared';
import { Room } from 'colyseus';
import { EnemyType } from '@runerogue/shared';

/**
 * CRITICAL SYSTEM: Synchronizes ECS world state to Colyseus network state
 * This MUST run every server tick or clients won't see updates
 * Performance target: <5ms per tick with 4 players + 50 enemies
 */
export class StateSyncSystem {
  private room: Room<GameRoomState>;
  private world: IWorld;

  // Entity mapping (CRITICAL for maintaining sync)
  // These maps are managed by GameRoom on player/enemy creation/deletion
  public playerEntityMap: Map<string, number>; // sessionId -> ECS entity
  public entityPlayerMap: Map<number, string>; // ECS entity -> sessionId
  public enemyEntityMap: Map<string, number>; // enemyId (custom string) -> ECS entity
  public entityEnemyMap: Map<number, string>; // ECS entity -> enemyId (custom string)

  // Queries for performance (computed once, reused)
  private playerQuery = defineQuery([Components.Player, Components.Position, Components.Health]);
  private enemyQuery = defineQuery([Components.Enemy, Components.Position, Components.Health]);
  // Query for entities that have been marked for removal
  private deadEntityQuery = defineQuery([Components.Dead]);
  constructor(
    room: Room<GameRoomState>,
    world: IWorld,
    entityMaps: {
      playerEntityMap: Map<string, number>;
      entityPlayerMap: Map<number, string>;
      enemyEntityMap: Map<string, number>;
      entityEnemyMap: Map<number, string>;
    }
  ) {
    this.room = room;
    this.world = world;
    this.playerEntityMap = entityMaps.playerEntityMap;
    this.entityPlayerMap = entityMaps.entityPlayerMap;
    this.enemyEntityMap = entityMaps.enemyEntityMap;
    this.entityEnemyMap = entityMaps.entityEnemyMap;
  }

  execute(deltaTime: number) {
    const startTime = performance.now();
    try {
      this.syncPlayers();
      this.syncEnemies();
      this.cleanupDeadNetworkEntities(); // Important: remove from Colyseus state
      this.syncGameTimeAndWave();

      const endTime = performance.now();
      const executionTime = endTime - startTime;
      if (executionTime > 10) {
        // Increased threshold slightly
        console.warn(`StateSyncSystem took ${executionTime.toFixed(2)}ms (target: <10ms)`);
      }
    } catch (error) {
      console.error('StateSyncSystem error:', error);
    }
  }

  private syncPlayers() {
    const entities = this.playerQuery(this.world);
    for (const entity of entities) {
      const sessionId = this.entityPlayerMap.get(entity);
      if (!sessionId) continue;

      let playerState = this.room.state.players.get(sessionId);
      if (!playerState) {
        // This case should ideally be handled by GameRoom onJoin
        console.warn(`No player state for sessionId ${sessionId}, creating dynamically.`);
        playerState = new PlayerSchema();
        playerState.id = sessionId;
        // Populate with default/initial values if necessary
        this.room.state.players.set(sessionId, playerState);
      }

      this.syncPlayerName(playerState, entity);
      this.syncPlayerPosition(playerState, entity);
      this.syncPlayerHealth(playerState, entity);
      this.syncPlayerStats(playerState, entity);
      this.syncPlayerPrayer(playerState, entity);
      this.syncPlayerEquipment(playerState, entity);
      this.syncPlayerSpecialAttack(playerState, entity);
      this.syncPlayerCombatState(playerState, entity);
    }
  }
  /** Sync player name from ECS to schema */
  private syncPlayerName(playerState: PlayerSchema, entity: number) {
    if (Components.Name && Components.Name.value[entity]) {
      // Convert from number (string table index) to string via unknown
      playerState.name = Components.Name.value[entity] as unknown as string;
    }
  }

  /** Sync player position from ECS to schema */
  private syncPlayerPosition(playerState: PlayerSchema, entity: number) {
    this.syncVector2(
      playerState.position,
      Components.Position.x[entity],
      Components.Position.y[entity]
    );
  }

  /** Sync player health from ECS to schema */
  private syncPlayerHealth(playerState: PlayerSchema, entity: number) {
    this.syncHealth(
      playerState.health,
      Components.Health.current[entity],
      Components.Health.max[entity]
    );
  }

  /** Sync player stats from ECS to schema */
  private syncPlayerStats(playerState: PlayerSchema, entity: number) {
    if (Components.SkillLevels && Components.SkillXP) {
      this.syncCombatStats(playerState.stats, entity);
    }
  }

  /** Sync player prayer from ECS to schema */
  private syncPlayerPrayer(playerState: PlayerSchema, entity: number) {
    if (Components.Prayer) {
      this.syncPrayerState(playerState.prayer, entity);
    }
  }

  /** Sync player equipment from ECS to schema */
  private syncPlayerEquipment(playerState: PlayerSchema, entity: number) {
    if (Components.Equipment) {
      this.syncEquipment(playerState.equipment, entity);
    }
  }

  /** Sync player special attack from ECS to schema */
  private syncPlayerSpecialAttack(playerState: PlayerSchema, entity: number) {
    if (Components.SpecialAttack) {
      playerState.specialAttack.energy = Components.SpecialAttack.energy[entity] || 0;
      playerState.specialAttack.available =
        (Components.SpecialAttack.cooldownTimer[entity] || 0) <= 0;
    }
  }

  /** Sync player combat state from ECS to schema */
  private syncPlayerCombatState(playerState: PlayerSchema, entity: number) {
    playerState.target = this.getTargetId(Components.Target.id[entity]);
    playerState.lastAttackTick = Components.AttackTimer.lastAttack[entity] || 0;
    playerState.inCombat =
      (Components.CombatState && Components.CombatState.inCombatTimer[entity] > 0) || false;
  }

  private syncEnemies() {
    const entities = this.enemyQuery(this.world);
    for (const entity of entities) {
      const enemyId = this.entityEnemyMap.get(entity);
      if (!enemyId) continue;

      let enemyState = this.room.state.enemies.get(enemyId);
      if (!enemyState) {
        enemyState = new EnemySchema();
        enemyState.id = enemyId;
        this.room.state.enemies.set(enemyId, enemyState);
      }

      enemyState.type = this.getEnemyTypeName(Components.Enemy.type[entity]);
      this.syncVector2(
        enemyState.position,
        Components.Position.x[entity],
        Components.Position.y[entity]
      );
      this.syncHealth(
        enemyState.health,
        Components.Health.current[entity],
        Components.Health.max[entity]
      );

      // Compute combat level from SkillLevels for enemies if needed
      if (Components.SkillLevels) {
        // OSRS combat level formula
        const levels = Components.SkillLevels;
        const attack = levels.attack[entity] || 1;
        const strength = levels.strength[entity] || 1;
        const defence = levels.defence[entity] || 1;
        const hitpoints = levels.hitpoints[entity] || 10;
        const prayer = levels.prayer[entity] || 1;
        const ranged = levels.ranged[entity] || 1;
        const magic = levels.magic[entity] || 1;
        // OSRS combat level calculation
        const base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));
        const melee = 0.325 * (attack + strength);
        const range = 0.325 * (Math.floor(ranged / 2) + ranged);
        const mage = 0.325 * (Math.floor(magic / 2) + magic);
        enemyState.combatLevel = Math.floor(base + Math.max(melee, range, mage));
      }
      if (Components.EquipmentBonuses) {
        this.syncEquipmentBonuses(enemyState.bonuses, entity);
      }

      enemyState.target = this.getTargetId(Components.Target.id[entity]);
      enemyState.lastAttackTick = Components.AttackTimer.lastAttack[entity] || 0;
      enemyState.aggroRange = Components.AI.aggroRange[entity] || 5;
    }
  }

  private cleanupDeadNetworkEntities() {
    // Remove players that are no longer in playerEntityMap (handled by GameRoom onLeave)
    this.room.state.players.forEach((_, sessionId) => {
      if (!this.playerEntityMap.has(sessionId)) {
        this.room.state.players.delete(sessionId);
      }
    });

    // Remove enemies that are no longer in enemyEntityMap (e.g., killed and ECS entity removed)
    this.room.state.enemies.forEach((_, enemyId) => {
      if (!this.enemyEntityMap.has(enemyId)) {
        this.room.state.enemies.delete(enemyId);
      }
    });
  }

  private syncGameTimeAndWave() {
    this.room.state.gameTime.tick = this.room['tickCounter'] || 0; // Access from GameRoom
    this.room.state.gameTime.elapsed = Math.floor(
      this.room.state.gameTime.tick * (this.room['TICK_RATE'] / 1000)
    );

    this.room.state.wave.current = this.room['currentWave'] || 1;
    this.room.state.wave.enemiesRemaining = this.room.state.enemies.size;
    // nextWaveIn needs to be calculated in GameRoom based on wave completion
  }

  // Helper methods for syncing complex schema types
  private syncVector2(schema: Vector2Schema, x?: number, y?: number) {
    if (x !== undefined) schema.x = x;
    if (y !== undefined) schema.y = y;
  }

  private syncHealth(schema: HealthSchema, current?: number, max?: number) {
    if (current !== undefined) schema.current = current;
    if (max !== undefined) schema.max = max;
  }

  /**
   * Synchronize ECS SkillLevels and SkillXP components to Colyseus CombatStatsSchema.
   * @param schema The CombatStatsSchema to populate
   * @param entity The ECS entity id
   */
  private syncCombatStats(schema: CombatStatsSchema, entity: number) {
    const levels = Components.SkillLevels;
    const xp = Components.SkillXP;
    schema.attack.level = levels.attack[entity] || 1;
    schema.attack.xp = xp.attack[entity] || 0;
    schema.strength.level = levels.strength[entity] || 1;
    schema.strength.xp = xp.strength[entity] || 0;
    schema.defence.level = levels.defence[entity] || 1;
    schema.defence.xp = xp.defence[entity] || 0;
    schema.hitpoints.level = levels.hitpoints[entity] || 10;
    schema.hitpoints.xp = xp.hitpoints[entity] || 1154;
    schema.ranged.level = levels.ranged[entity] || 1;
    schema.ranged.xp = xp.ranged[entity] || 0;
    schema.prayer.level = levels.prayer[entity] || 1;
    schema.prayer.xp = xp.prayer[entity] || 0;
    schema.magic.level = levels.magic[entity] || 1;
    schema.magic.xp = xp.magic[entity] || 0;
  }

  private syncEnemyStats(schema: EnemyStatsSchema, entity: number) {
    const s = Components.CombatStats;
    schema.attack = s.attack[entity] || 1;
    schema.strength = s.strength[entity] || 1;
    schema.defence = s.defence[entity] || 1;
    schema.hitpoints = s.hitpoints[entity] || 1;
  }

  private syncPrayerState(schema: PrayerSchema, entity: number) {
    schema.points = Components.Prayer.points[entity] || 0;
    schema.drainRate = Components.Prayer.drainRate[entity] || 0;
    // Active prayers need to be converted from bitmask or array in ECS to ArraySchema
    // Example: if Components.Prayer.activeMask[entity] is a bitmask
    // schema.activePrayers.clear();
    // for (let i = 0; i < PRAYER_COUNT; i++) {
    //   if (Components.Prayer.activeMask[entity] & (1 << i)) {
    //     schema.activePrayers.push(PRAYER_NAMES[i]);
    //   }
    // }
  }

  private syncEquipment(schema: EquipmentSchema, entity: number) {
    const eq = Components.Equipment;
    this.syncItem(schema.weapon, eq.weapon[entity]);
    this.syncItem(schema.helmet, eq.helmet[entity]);
    // ... sync other slots
  }

  private syncItem(schemaItem?: ItemSchema, ecsItemId?: number) {
    if (!schemaItem) return; // Should not happen if schema is initialized
    if (ecsItemId === undefined || ecsItemId === 0) {
      // Assuming 0 means no item
      schemaItem.id = 0;
      schemaItem.name = ''; // Clear item
      // Removed redundant return
    }
    // Fetch item data from a (hypothetical) ItemDataStore or directly from components
    // const itemData: SharedItemData = ItemDataStore.get(ecsItemId);
    // For now, assuming item data is directly on components, which is not ideal
    // schemaItem.id = itemData.id;
    // schemaItem.name = itemData.name;
    // this.syncEquipmentBonuses(schemaItem.bonuses, ecsItemId); // if bonuses are per-item entity
  }

  private syncEquipmentBonuses(schema: EquipmentBonusesSchema, entity: number) {
    const eb = Components.EquipmentBonuses; // Assuming total bonuses on player/enemy entity
    schema.attackStab = eb.attackStab[entity] || 0;
    // ... sync all other bonus fields
  }

  private getTargetId(targetEcsId?: number): string {
    if (targetEcsId === undefined || targetEcsId === 0) return '';
    return this.entityPlayerMap.get(targetEcsId) || this.entityEnemyMap.get(targetEcsId) || '';
  }

  private getEnemyTypeName(typeId?: number): string {
    if (typeId === undefined) return 'unknown';
    const types: EnemyType[] = [
      'chicken',
      'rat',
      'spider',
      'cow',
      'goblin',
      'imp',
      'guard',
      'wizard',
      'dark_wizard',
      'hobgoblin',
      'hill_giant',
      'moss_giant',
      'lesser_demon',
      'greater_demon',
      'black_demon',
    ];
    return types[typeId] || 'unknown';
  }
}
