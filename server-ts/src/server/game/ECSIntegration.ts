/**
 * ECS Integration Layer for RuneRogue
 *
 * This system bridges the existing Colyseus schema-based architecture
 * with the new ECS system, allowing for gradual migration while
 * maintaining compatibility with existing multiplayer functionality.
 */

import { createWorld, hasComponent, removeComponent } from 'bitecs';
import { Transform, Health, Skills, Player } from '../ecs/components';
import { createPlayer } from '../ecs/world';
import { MovementSystem } from '../ecs/systems/MovementSystem';
import { CombatSystem } from '../ecs/systems/CombatSystem';
import { PrayerSystem } from '../ecs/systems/PrayerSystem';
import { SkillSystem } from '../ecs/systems/SkillSystem';

/**
 * Manages the integration between Colyseus schemas and ECS components
 */
export class ECSIntegration {
  private world = createWorld();
  private entityMap = new Map<string, number>(); // Colyseus ID -> ECS Entity ID
  private reverseEntityMap = new Map<number, string>(); // ECS Entity ID -> Colyseus ID
  private systems: Array<(world: any) => void> = [];

  constructor() {
    this.initializeSystems();
    this.registerComponents();
  }

  /**
   * Initialize ECS systems
   */
  private initializeSystems() {
    this.systems = [MovementSystem, CombatSystem, PrayerSystem, SkillSystem];
  }
  /**
   * Register all ECS components with the world
   */
  private registerComponents() {
    // In bitECS, components are automatically registered when first used
    // No manual registration is needed - this method is kept for compatibility
  }

  /**
   * Get the ECS world instance
   */
  getWorld() {
    return this.world;
  }

  /**
   * Sync a Colyseus Player to ECS components
   */ syncPlayerToECS(player: any): number {
    if (!player || !player.id) {
      throw new Error('Player must have an id property');
    }

    let entityId = this.entityMap.get(player.id);
    if (!entityId) {
      // Create new ECS entity for this player
      entityId = createPlayer(this.world, player.id, player.x || 0, player.y || 0);

      this.entityMap.set(player.id, entityId);
      this.reverseEntityMap.set(entityId, player.id);
    }

    // Sync position using Transform component
    if (hasComponent(this.world, Transform, entityId)) {
      Transform.x[entityId] = player.x || 0;
      Transform.y[entityId] = player.y || 0;
      Transform.z[entityId] = 0;
    }

    // Sync health
    if (hasComponent(this.world, Health, entityId)) {
      Health.current[entityId] = player.health || 100;
      Health.max[entityId] = player.maxHealth || 100;
    }

    // Sync skills (using Skills component, not CombatStats)
    if (hasComponent(this.world, Skills, entityId) && player.skills) {
      Skills.attack[entityId] = player.skills.attack?.level || 1;
      Skills.defence[entityId] = player.skills.defence?.level || 1;
      Skills.strength[entityId] = player.skills.strength?.level || 1;
      Skills.hitpoints[entityId] = player.skills.hitpoints?.level || 10;
      Skills.ranged[entityId] = player.skills.ranged?.level || 1;
      Skills.magic[entityId] = player.skills.magic?.level || 1;
      Skills.prayer[entityId] = player.skills.prayer?.level || 1;
    }

    return entityId;
  }
  /**
   * Sync ECS components back to Colyseus Player
   */
  syncECSToPlayer(entityId: number, player: any): void {
    if (!hasComponent(this.world, Transform, entityId)) {
      return;
    }

    // Sync position
    player.x = Transform.x[entityId];
    player.y = Transform.y[entityId];

    // Sync health
    if (hasComponent(this.world, Health, entityId)) {
      player.health = Health.current[entityId];
      player.maxHealth = Health.max[entityId];
    }

    // Note: Skills are typically not synced back from ECS to schema
    // as they are managed by the schema system directly
  }

  /**
   * Run all ECS systems for one frame
   */
  update(deltaTime: number = 16.67): void {
    try {
      for (const system of this.systems) {
        if (typeof system === 'function') {
          system(this.world);
        }
      }
    } catch (error) {
      console.error('ECS System Update Error:', error);
      // Continue running other systems even if one fails
    }
  }

  /**
   * Remove a player from the ECS world
   */
  removePlayer(playerId: string): void {
    const entityId = this.entityMap.get(playerId);
    if (entityId !== undefined) {
      // Remove all components from entity
      if (hasComponent(this.world, Transform, entityId)) {
        removeComponent(this.world, Transform, entityId);
      }
      if (hasComponent(this.world, Health, entityId)) {
        removeComponent(this.world, Health, entityId);
      }
      if (hasComponent(this.world, Skills, entityId)) {
        removeComponent(this.world, Skills, entityId);
      }
      if (hasComponent(this.world, Player, entityId)) {
        removeComponent(this.world, Player, entityId);
      }

      // Clean up maps
      this.entityMap.delete(playerId);
      this.reverseEntityMap.delete(entityId);
    }
  }

  /**
   * Get ECS entity ID for a Colyseus player ID
   */
  getEntityId(playerId: string): number | undefined {
    return this.entityMap.get(playerId);
  }

  /**
   * Get Colyseus player ID for an ECS entity ID
   */
  getPlayerId(entityId: number): string | undefined {
    return this.reverseEntityMap.get(entityId);
  }

  /**
   * Get all managed entities
   */
  getAllEntities(): number[] {
    return Array.from(this.reverseEntityMap.keys());
  }

  /**
   * Get stats for debugging
   */
  getStats(): {
    entityCount: number;
    systemCount: number;
    registeredComponents: string[];
  } {
    return {
      entityCount: this.entityMap.size,
      systemCount: this.systems.length,
      registeredComponents: ['Transform', 'Health', 'Skills', 'Player'],
    };
  }
}
