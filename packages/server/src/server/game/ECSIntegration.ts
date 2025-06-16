/**
 * ECS Integration Layer for RuneRogue
 *
 * This system bridges the existing Colyseus schema-based architecture
 * with the new ECS system, allowing for gradual migration while
 * maintaining compatibility with existing multiplayer functionality.
 */

import { createWorld, hasComponent, removeComponent, IWorld } from 'bitecs';
import { Transform, Health, Skills, Player, NetworkEntity } from '../ecs/components';
import { createPlayer } from '../ecs/world';
import { MovementSystem } from '../ecs/systems/MovementSystem';
import { CombatSystem } from '../ecs/systems/CombatSystem';
import { PrayerSystem } from '../ecs/systems/PrayerSystem';
import { SkillSystem } from '../ecs/systems/SkillSystem';
import { NetworkSyncSystem, setNetworkBroadcaster } from '../ecs/systems/NetworkSyncSystem';
import { WaveSpawningSystem } from '../ecs/systems/WaveSpawningSystem';
import { HealthBarSystem, setHealthEventBroadcaster } from '../ecs/systems/HealthBarSystem';
import { DamageNumberSystem, setDamageNumberBroadcaster } from '../ecs/systems/DamageNumberSystem';
import { XPNotificationSystem, setXPEventBroadcaster } from '../ecs/systems/XPNotificationSystem';
// Phase 4 systems - only non-excluded systems
import { SmithingSystem } from '../ecs/systems/SmithingSystem';
import { EquipmentSystem } from '../ecs/systems/EquipmentSystem';
import { ConsumableSystem } from '../ecs/systems/ConsumableSystem';
import { XPSystem } from '../ecs/systems/XPSystem';

/**
 * Player schema interface for ECS integration
 */
interface PlayerSchema {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  skills?: {
    attack?: { level: number };
    defence?: { level: number };
    strength?: { level: number };
    hitpoints?: { level: number };
    ranged?: { level: number };
    magic?: { level: number };
    prayer?: { level: number };
  };
  _positionUpdated?: boolean;
  _healthUpdated?: boolean;
}

/**
 * NPC schema interface for ECS integration
 */
interface NPCSchema {
  id: string;
  name: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  combatLevel: number;
}

/**
 * Extended world interface with custom properties
 */
interface ExtendedWorld extends IWorld {
  deltaTime?: number;
  networkBroadcaster?: (type: string, data: unknown) => void;
}

/**
 * ECS System function type
 */
type ECSSystem = (world: IWorld) => void;

/**
 * Manages the integration between Colyseus schemas and ECS components
 */
export class ECSIntegration {
  private world = createWorld();
  private entityMap = new Map<string, number>(); // Colyseus ID -> ECS Entity ID
  private reverseEntityMap = new Map<number, string>(); // ECS Entity ID -> Colyseus ID
  private systems: ECSSystem[] = [];
  private broadcaster?: (type: string, data: unknown) => void;

  constructor() {
    this.initializeSystems();
    this.registerComponents();
  }

  /**
   * Initialize ECS systems
   */
  private initializeSystems() {
    this.systems = [
      MovementSystem,
      CombatSystem,
      // AutoCombatSystem, // temporarily excluded
      PrayerSystem,
      SkillSystem,
      WaveSpawningSystem,
      NetworkSyncSystem,
      HealthBarSystem,
      DamageNumberSystem,
      XPNotificationSystem,
      // Phase 4 systems - only non-excluded
      // MagicCombatSystem, // temporarily excluded
      // RangedCombatSystem, // temporarily excluded
      SmithingSystem,
      EquipmentSystem,
      ConsumableSystem,
      XPSystem,
    ];
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
   * Simple hash function for string values
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Sync a Colyseus Player to ECS components
   */
  syncPlayerToECS(player: PlayerSchema): number {
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
    } // Sync skills (using Skills component, not CombatStats)
    if (hasComponent(this.world, Skills, entityId) && player.skills) {
      Skills.attack[entityId] = player.skills.attack?.level || 1;
      Skills.defence[entityId] = player.skills.defence?.level || 1;
      Skills.strength[entityId] = player.skills.strength?.level || 1;
      Skills.hitpoints[entityId] = player.skills.hitpoints?.level || 10;
      Skills.ranged[entityId] = player.skills.ranged?.level || 1;
      Skills.magic[entityId] = player.skills.magic?.level || 1;
      Skills.prayer[entityId] = player.skills.prayer?.level || 1;
    }

    // Add NetworkEntity component for multiplayer sync
    if (hasComponent(this.world, NetworkEntity, entityId)) {
      NetworkEntity.sessionHash[entityId] = this.hashString(player.id);
      NetworkEntity.lastUpdate[entityId] = Date.now();
    }

    return entityId;
  }

  /**
   * Sync ECS components back to Colyseus Player
   */
  syncECSToPlayer(entityId: number, player: PlayerSchema): void {
    if (!hasComponent(this.world, Transform, entityId)) {
      return;
    }

    // Check if position has changed significantly to avoid unnecessary updates
    const newX = Transform.x[entityId];
    const newY = Transform.y[entityId];
    const threshold = 0.01; // Small threshold to avoid floating point issues

    const positionChanged =
      Math.abs(player.x - newX) > threshold || Math.abs(player.y - newY) > threshold;

    if (positionChanged) {
      // Sync position
      player.x = newX;
      player.y = newY;

      // Mark that this player has had a position update
      player._positionUpdated = true;
    }

    // Sync health
    if (hasComponent(this.world, Health, entityId)) {
      const healthChanged =
        player.health !== Health.current[entityId] || player.maxHealth !== Health.max[entityId];

      if (healthChanged) {
        player.health = Health.current[entityId];
        player.maxHealth = Health.max[entityId];
        player._healthUpdated = true;
      }
    }

    // Note: Skills are typically not synced back from ECS to schema
    // as they are managed by the schema system directly
  }
  /**
   * Run all ECS systems for one frame (optimized)
   */
  update(deltaTime: number = 16.67): void {
    try {
      // Only run systems if there are entities to process
      if (this.entityMap.size === 0) {
        return;
      }

      // Set delta time on world for systems to use
      const extendedWorld = this.world as ExtendedWorld;
      extendedWorld.deltaTime = deltaTime / 1000; // Convert to seconds

      // Run each system with error isolation
      for (const system of this.systems) {
        if (typeof system === 'function') {
          try {
            system(this.world);
          } catch (systemError) {
            console.error(`ECS System Error in ${system.name || 'unnamed system'}:`, systemError);
            // Continue with other systems
          }
        }
      }
    } catch (error) {
      console.error('ECS Integration Update Error:', error);
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

  /**
   * Set up network broadcaster for ECS systems
   */
  public setNetworkBroadcaster(broadcaster: (type: string, data: unknown) => void): void {
    this.broadcaster = broadcaster;

    // Set up the broadcaster for the NetworkSyncSystem
    setNetworkBroadcaster(this.world, broadcaster);

    // Set up the broadcaster for visual feedback systems
    setHealthEventBroadcaster(broadcaster);
    setDamageNumberBroadcaster(broadcaster);
    setXPEventBroadcaster(broadcaster);

    // Set up the broadcaster for network systems
    const extendedWorld = this.world as ExtendedWorld;
    extendedWorld.networkBroadcaster = broadcaster;
  }

  /**
   * Create an ECS enemy entity from NPC data
   */
  public createEnemyEntity(_npc: NPCSchema): number {
    // This will be implemented when we have enemy creation functions
    // For now, return a placeholder
    return 0;
  }
}
