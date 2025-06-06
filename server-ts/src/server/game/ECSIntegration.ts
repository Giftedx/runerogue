/**
 * ECS Integration Layer for RuneRogue
 *
 * This system bridges the existing Colyseus schema-based architecture
 * with the new ECS system, allowing for gradual migration while
 * maintaining compatibility with existing multiplayer functionality.
 */

import { IWorld } from 'bitecs';
import {
  Combat,
  ECSWorld,
  Health,
  Inventory,
  InventoryItems,
  Movement,
  NPC as NPCComponent,
  Position,
  Prayer,
} from './ECS';
import { NPC, Player, WorldState } from './EntitySchemas';

/**
 * Manages the integration between Colyseus schemas and ECS components
 */
export class ECSIntegration {
  private ecsWorld: ECSWorld;
  private entityMap: Map<string, number> = new Map(); // Colyseus ID -> ECS Entity ID
  private reverseEntityMap: Map<number, string> = new Map(); // ECS Entity ID -> Colyseus ID

  constructor() {
    this.ecsWorld = new ECSWorld();
  }

  /**
   * Get the ECS world instance
   */
  public getWorld(): IWorld {
    return this.ecsWorld.world;
  }

  /**
   * Get the ECS world manager
   */
  public getECSWorld(): ECSWorld {
    return this.ecsWorld;
  }

  /**
   * Sync a Colyseus Player to ECS components
   */
  public syncPlayerToECS(playerId: string, player: Player): number {
    let entityId = this.entityMap.get(playerId);

    if (!entityId) {
      // Create new ECS entity for this player
      entityId = this.ecsWorld.createPlayer(playerId, player.username, player.x, player.y);
      this.entityMap.set(playerId, entityId);
      this.reverseEntityMap.set(entityId, playerId);
    }

    // Sync position
    Position.x[entityId] = player.x;
    Position.y[entityId] = player.y;
    Position.z[entityId] = 0;

    // Sync health
    Health.current[entityId] = player.health;
    Health.maximum[entityId] = player.maxHealth;

    // Sync combat stats
    Combat.attackLevel[entityId] = player.skills.attack.level;
    Combat.strengthLevel[entityId] = player.skills.strength.level;
    Combat.defenceLevel[entityId] = player.skills.defence.level;
    Combat.hitpointsLevel[entityId] = Math.floor(player.maxHealth / 10); // OSRS style
    Combat.prayerLevel[entityId] = player.skills.prayer.level;
    Combat.combatLevel[entityId] = player.getCombatLevel();
    Combat.inCombat[entityId] = player.inCombat ? 1 : 0;
    Combat.specialAttackEnergy[entityId] = player.specialEnergy;

    // Sync prayer
    Prayer.currentPoints[entityId] = player.prayerPoints;
    Prayer.maximumPoints[entityId] = player.maxPrayerPoints;

    // Convert active prayers array to bitfield
    let activePrayersBitfield = 0;
    for (let i = 0; i < player.activePrayers.length; i++) {
      const prayerId = parseInt(player.activePrayers[i]) || 0;
      if (prayerId > 0 && prayerId <= 32) {
        activePrayersBitfield |= 1 << (prayerId - 1);
      }
    }
    Prayer.activePrayers[entityId] = activePrayersBitfield;

    // Sync movement
    Movement.speed[entityId] = 1.0; // Base movement speed
    Movement.isMoving[entityId] = player.animation === 'walking' ? 1 : 0;

    // Sync inventory
    Inventory.size[entityId] = player.inventorySize;
    Inventory.itemCount[entityId] = player.inventory.length;

    // Sync inventory items
    for (let i = 0; i < 28; i++) {
      if (i < player.inventory.length) {
        const item = player.inventory[i];
        InventoryItems.items[entityId][i] = parseInt(item.itemId) || 0;
        InventoryItems.quantities[entityId][i] = item.quantity;
      } else {
        InventoryItems.items[entityId][i] = 0;
        InventoryItems.quantities[entityId][i] = 0;
      }
    }

    return entityId;
  }

  /**
   * Sync ECS components back to Colyseus Player
   */
  public syncPlayerFromECS(entityId: number, player: Player): void {
    // Sync position
    player.x = Position.x[entityId];
    player.y = Position.y[entityId];

    // Sync health
    player.health = Health.current[entityId];
    player.maxHealth = Health.maximum[entityId];

    // Sync combat status
    player.inCombat = Combat.inCombat[entityId] === 1;
    player.specialEnergy = Combat.specialAttackEnergy[entityId];

    // Sync prayer
    player.prayerPoints = Prayer.currentPoints[entityId];
    player.maxPrayerPoints = Prayer.maximumPoints[entityId];

    // Convert bitfield back to active prayers array
    const activePrayersBitfield = Prayer.activePrayers[entityId];
    player.activePrayers.clear();
    for (let i = 0; i < 32; i++) {
      if (activePrayersBitfield & (1 << i)) {
        player.activePrayers.push((i + 1).toString());
      }
    }

    // Update movement animation
    if (Movement.isMoving[entityId] === 1) {
      player.animation = 'walking';
    } else {
      player.animation = 'idle';
    }
  }

  /**
   * Sync a Colyseus NPC to ECS components
   */
  public syncNPCToECS(npcId: string, npc: NPC): number {
    let entityId = this.entityMap.get(npcId);

    if (!entityId) {
      // Create new ECS entity for this NPC
      entityId = this.ecsWorld.createNPC(parseInt(npcId) || 0, npc.x, npc.y);
      this.entityMap.set(npcId, entityId);
      this.reverseEntityMap.set(entityId, npcId);
    }

    // Sync position
    Position.x[entityId] = npc.x;
    Position.y[entityId] = npc.y;
    Position.z[entityId] = 0;

    // Sync health
    Health.current[entityId] = npc.health;
    Health.maximum[entityId] = npc.maxHealth;

    // Sync combat stats
    Combat.attackLevel[entityId] = npc.attack;
    Combat.defenceLevel[entityId] = npc.defense;
    Combat.inCombat[entityId] = 0; // Will be set by combat system

    // Sync NPC-specific data
    NPCComponent.aggroRange[entityId] = npc.aggroRange;
    NPCComponent.spawnX[entityId] = npc.x; // Assume spawn position is current position
    NPCComponent.spawnY[entityId] = npc.y;

    return entityId;
  }

  /**
   * Sync ECS components back to Colyseus NPC
   */
  public syncNPCFromECS(entityId: number, npc: NPC): void {
    // Sync position
    npc.x = Position.x[entityId];
    npc.y = Position.y[entityId];

    // Sync health
    npc.health = Health.current[entityId];
    npc.maxHealth = Health.maximum[entityId];
  }

  /**
   * Sync all Colyseus entities to ECS
   */
  public syncWorldToECS(worldState: WorldState): void {
    // Sync all players
    worldState.players.forEach((player, playerId) => {
      this.syncPlayerToECS(playerId, player);
    });

    // Sync all NPCs
    worldState.npcs.forEach((npc, npcId) => {
      this.syncNPCToECS(npcId, npc);
    });
  }

  /**
   * Sync ECS state back to Colyseus world
   */
  public syncWorldFromECS(worldState: WorldState): void {
    // Sync all tracked entities back to Colyseus
    this.entityMap.forEach((entityId, colyseusId) => {
      const player = worldState.players.get(colyseusId);
      if (player) {
        this.syncPlayerFromECS(entityId, player);
        return;
      }

      const npc = worldState.npcs.get(colyseusId);
      if (npc) {
        this.syncNPCFromECS(entityId, npc);
        return;
      }
    });
  }

  /**
   * Remove an entity from ECS when it's removed from Colyseus
   */
  public removeEntity(colyseusId: string): void {
    const entityId = this.entityMap.get(colyseusId);
    if (entityId) {
      this.ecsWorld.removeEntity(entityId);
      this.entityMap.delete(colyseusId);
      this.reverseEntityMap.delete(entityId);
    }
  }

  /**
   * Get ECS entity ID from Colyseus ID
   */
  public getEntityId(colyseusId: string): number | undefined {
    return this.entityMap.get(colyseusId);
  }

  /**
   * Get Colyseus ID from ECS entity ID
   */
  public getColyseusId(entityId: number): string | undefined {
    return this.reverseEntityMap.get(entityId);
  }

  /**
   * Process ECS systems
   */
  public update(_deltaTime: number): void {
    // For now, we don't have specific systems to update
    // This will be expanded when we add ECS systems
  }

  /**
   * Get all entities with specific components (for queries)
   */
  public getEntitiesWithComponents(_components: unknown[]): number[] {
    // This is a simplified version - in a full ECS implementation,
    // we would use proper queries
    return this.ecsWorld.getAllEntities();
  }
}
