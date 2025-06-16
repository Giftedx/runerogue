/**
 * JSON-based state synchronization room with OSRS combat integration
 * Enhanced with authentic OSRS combat formulas and player stats
 */

// LEGACY: This room is not used in the current production server. Retained for reference, testing, or migration only.

import { Room, Client } from '@colyseus/core';
import {
  calculateCombatLevel,
  calculateMaxHit,
  calculateAccuracy,
  getAttackSpeed,
} from '@runerogue/osrs-data';
import { OSRSCombatStats, OSRSEquipmentBonuses } from '@runerogue/shared';
import {
  InteractiveObjectsManager,
  InteractiveObject,
  ObjectType,
  SkillType,
  OSRS_TREES,
  OSRS_ROCKS,
} from '../game/InteractiveObjects';
import { SkillsManager, SkillName } from '../game/Skills';
import { InventoryManager } from '../game/Inventory';

export interface JsonJoinOptions {
  username?: string;
  combatStats?: OSRSCombatStats;
}

export interface JsonPlayer {
  id: string;
  username: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  combatLevel: number;
  combatStats: OSRSCombatStats;
  equipmentBonuses: OSRSEquipmentBonuses;
  isInCombat: boolean;
  lastAttackTime: number;
  // New systems
  skills: SkillsManager;
  inventory: InventoryManager;
  totalLevel: number;
  totalExperience: number;
}

export interface JsonCombatResult {
  attackerId: string;
  defenderId: string;
  damage: number;
  wasHit: boolean;
  maxHit: number;
  accuracy: number;
  defenderHealth: number;
  timestamp: number;
}

export interface JsonGameState {
  tick: number;
  timestamp: number;
  playerCount: number;
  players: { [sessionId: string]: JsonPlayer };
  interactiveObjects: { [objectId: string]: InteractiveObject };
}

export class JsonGameRoom extends Room {
  maxClients = 4;
  patchRate = 1000 / 30; // 30 FPS

  private gameState: JsonGameState;
  private logger = console; // Use console for now, can be replaced with proper logger
  private objectsManager: InteractiveObjectsManager;

  onCreate(options: JsonJoinOptions) {
    this.logger.log('Enhanced JsonGameRoom with OSRS combat created:', options);

    // Initialize interactive objects manager
    this.objectsManager = new InteractiveObjectsManager();

    // Initialize JSON-based game state
    this.gameState = {
      tick: 0,
      timestamp: Date.now(),
      playerCount: 0,
      players: {},
      interactiveObjects: {},
    };

    // Spawn initial interactive objects (trees and rocks)
    this.spawnInitialObjects();

    // Set up message handlers
    this.onMessage('move', (client, message) => {
      this.handlePlayerMove(client, message);
    });

    this.onMessage('attack', (client, message) => {
      this.handlePlayerAttack(client, message);
    });

    this.onMessage('interact', (client, message) => {
      this.handleObjectInteraction(client, message);
    });

    this.onMessage('requestState', client => {
      client.send('fullState', this.gameState);
    });

    this.onMessage('requestSkills', client => {
      const player = this.gameState.players[client.sessionId];
      if (player) {
        client.send('skillsData', player.skills.exportSkills());
      }
    });

    this.onMessage('requestInventory', client => {
      const player = this.gameState.players[client.sessionId];
      if (player) {
        client.send('inventoryData', player.inventory.exportInventory());
      }
    });

    this.onMessage('chat', (client, message) => {
      this.handleChatMessage(client, message);
    });

    // Set up game loop
    this.setSimulationInterval(() => this.jsonUpdate());

    this.logger.log('Enhanced JsonGameRoom with OSRS combat initialized');
  }
  onJoin(client: Client, options: JsonJoinOptions) {
    this.logger.log(
      `Player ${client.sessionId} joining Enhanced JsonGameRoom with username: ${options.username}`
    );

    const username = options.username || `Player_${client.sessionId.slice(0, 6)}`;

    // Create default OSRS combat stats (level 40 balanced build)
    const defaultCombatStats: OSRSCombatStats = options.combatStats || {
      attack: 40,
      strength: 40,
      defence: 40,
      hitpoints: 40,
      prayer: 20,
      ranged: 30,
      magic: 30,
    };

    // Create default equipment bonuses (bronze scimitar equivalent)
    const defaultEquipment: OSRSEquipmentBonuses = {
      attackBonus: 20,
      strengthBonus: 17,
      defenceBonus: 10,
      attackStab: 20,
      attackSlash: 21,
      attackCrush: -2,
      defenceStab: 5,
      defenceSlash: 5,
      defenceCrush: 2,
    };

    const combatLevel = calculateCombatLevel(defaultCombatStats);
    const maxHealth = defaultCombatStats.hitpoints;

    // Initialize skills and inventory systems
    const skillsManager = new SkillsManager();
    const inventoryManager = new InventoryManager();

    // Give starter items
    inventoryManager.addItem('bronze_axe', 1);
    inventoryManager.addItem('bronze_pickaxe', 1);

    // Create enhanced player with OSRS stats
    const player: JsonPlayer = {
      id: client.sessionId,
      username,
      x: Math.floor(Math.random() * 100),
      y: Math.floor(Math.random() * 100),
      health: maxHealth,
      maxHealth,
      combatLevel,
      combatStats: defaultCombatStats,
      equipmentBonuses: defaultEquipment,
      isInCombat: false,
      lastAttackTime: 0,
      skills: skillsManager,
      inventory: inventoryManager,
      totalLevel: skillsManager.getTotalLevel(),
      totalExperience: skillsManager.getTotalExperience(),
    };

    // Add to state
    this.gameState.players[client.sessionId] = player;
    this.gameState.playerCount++;

    this.logger.log(
      `Player ${username} (CB Level ${combatLevel}) spawned at (${player.x}, ${player.y})`
    );
    this.logger.log(`Current players in room: ${this.gameState.playerCount}`);

    // Send full state to the new client
    client.send('fullState', this.gameState);

    // Broadcast enhanced player joined to all clients
    this.broadcast('playerJoined', player);
  }

  onLeave(client: Client, consented: boolean) {
    this.logger.log(`Player ${client.sessionId} left JsonGameRoom (consented: ${consented})`);

    // Remove player
    delete this.gameState.players[client.sessionId];
    this.gameState.playerCount--;

    this.logger.log(`Players remaining: ${this.gameState.playerCount}`);

    // Broadcast player left to all clients
    this.broadcast('playerLeft', { sessionId: client.sessionId });
  }
  onDispose() {
    this.logger.log('JsonGameRoom disposed');
  }
  private handlePlayerMove(client: Client, moveData: { x: number; y: number }) {
    const player = this.gameState.players[client.sessionId];
    if (player) {
      player.x = Math.max(0, Math.min(1000, moveData.x));
      player.y = Math.max(0, Math.min(1000, moveData.y));

      // Broadcast player update
      this.broadcast('playerUpdate', {
        sessionId: client.sessionId,
        x: player.x,
        y: player.y,
      });
    }
  }

  private handlePlayerAttack(client: Client, attackData: { targetSessionId: string }) {
    const attacker = this.gameState.players[client.sessionId];
    const defender = this.gameState.players[attackData.targetSessionId];

    if (!attacker || !defender) {
      client.send('combatError', { message: 'Invalid attack target' });
      return;
    }

    if (attacker.id === defender.id) {
      client.send('combatError', { message: 'Cannot attack yourself' });
      return;
    }

    // Check attack cooldown (4 ticks = ~133ms for fast weapons)
    const currentTime = Date.now();
    const attackSpeed = getAttackSpeed('scimitar'); // Default to scimitar speed
    const attackCooldown = (attackSpeed * 1000) / 30; // Convert ticks to milliseconds at 30 FPS

    if (currentTime - attacker.lastAttackTime < attackCooldown) {
      client.send('combatError', { message: 'Attack on cooldown' });
      return;
    }

    // Calculate OSRS combat mechanics
    const accuracy = calculateAccuracy(
      attacker.combatStats,
      attacker.equipmentBonuses,
      defender.combatStats,
      defender.equipmentBonuses
    );

    const maxHit = calculateMaxHit(attacker.combatStats, attacker.equipmentBonuses);

    // Determine if attack hits
    const hitRoll = Math.random();
    const wasHit = hitRoll < accuracy;

    // Calculate damage if hit
    const damage = wasHit ? Math.floor(Math.random() * (maxHit + 1)) : 0;

    // Apply damage
    if (wasHit && damage > 0) {
      defender.health = Math.max(0, defender.health - damage);
      defender.isInCombat = true;
    }

    attacker.isInCombat = true;
    attacker.lastAttackTime = currentTime;

    // Create combat result
    const combatResult: JsonCombatResult = {
      attackerId: attacker.id,
      defenderId: defender.id,
      damage,
      wasHit,
      maxHit,
      accuracy,
      defenderHealth: defender.health,
      timestamp: currentTime,
    };

    // Broadcast combat result to all clients
    this.broadcast('combatResult', combatResult);

    // Check if defender died
    if (defender.health <= 0) {
      this.handlePlayerDeath(defender);
    }

    this.logger.log(
      `Combat: ${attacker.username} -> ${defender.username} | Hit: ${wasHit} | Damage: ${damage}/${maxHit} | Acc: ${(accuracy * 100).toFixed(1)}%`
    );
  }

  private handlePlayerDeath(player: JsonPlayer) {
    // Respawn player at random location with full health
    player.health = player.maxHealth;
    player.x = Math.floor(Math.random() * 100);
    player.y = Math.floor(Math.random() * 100);
    player.isInCombat = false;

    // Broadcast death and respawn
    this.broadcast('playerDeath', {
      sessionId: player.id,
      respawnX: player.x,
      respawnY: player.y,
    });

    this.logger.log(`${player.username} died and respawned at (${player.x}, ${player.y})`);
  }

  private handleChatMessage(client: Client, chatData: { message: string }) {
    const player = this.gameState.players[client.sessionId];
    if (player && chatData.message.trim().length > 0) {
      const chatMessage = {
        username: player.username,
        message: chatData.message.trim(),
        timestamp: Date.now(),
      };

      // Broadcast chat message to all clients
      this.broadcast('chatMessage', chatMessage);
      this.logger.log(`Chat - ${player.username}: ${chatMessage.message}`);
    }
  }
  private jsonUpdate() {
    // Update game state
    this.gameState.tick++;
    this.gameState.timestamp = Date.now();

    // Handle health regeneration and combat state updates
    Object.values(this.gameState.players).forEach(player => {
      // Health regeneration (1 HP per 6 seconds when not in combat, OSRS-like)
      if (
        !player.isInCombat &&
        player.health < player.maxHealth &&
        this.gameState.tick % 180 === 0
      ) {
        player.health = Math.min(player.maxHealth, player.health + 1);
        this.broadcast('playerHealthUpdate', {
          sessionId: player.id,
          health: player.health,
          maxHealth: player.maxHealth,
        });
      }

      // Reset combat state after 10 seconds
      if (player.isInCombat && Date.now() - player.lastAttackTime > 10000) {
        player.isInCombat = false;
        this.broadcast('playerCombatState', {
          sessionId: player.id,
          isInCombat: false,
        });
      }
    });

    // Broadcast state updates periodically (every 30 ticks = 1 second at 30 FPS)
    if (this.gameState.tick % 30 === 0) {
      this.broadcast('stateUpdate', {
        tick: this.gameState.tick,
        timestamp: this.gameState.timestamp,
        playerCount: this.gameState.playerCount,
      });
      this.logger.log(
        `Enhanced JsonGameRoom tick: ${this.gameState.tick}, players: ${this.gameState.playerCount}`
      );
    }

    // Update interactive objects (respawn depleted objects)
    this.updateInteractiveObjects();
  }

  /**
   * Spawn initial interactive objects in the game world
   */
  private spawnInitialObjects(): void {
    // Spawn some trees for woodcutting
    const normalTree = this.objectsManager.spawnObject(
      ObjectType.TREE,
      100,
      100,
      OSRS_TREES.NORMAL_TREE
    );
    const oakTree = this.objectsManager.spawnObject(ObjectType.TREE, 150, 120, OSRS_TREES.OAK_TREE);
    const willowTree = this.objectsManager.spawnObject(
      ObjectType.TREE,
      200,
      100,
      OSRS_TREES.WILLOW_TREE
    );

    // Spawn some rocks for mining
    const copperRock = this.objectsManager.spawnObject(
      ObjectType.ROCK,
      80,
      200,
      OSRS_ROCKS.COPPER_ROCK
    );
    const ironRock = this.objectsManager.spawnObject(
      ObjectType.ROCK,
      120,
      220,
      OSRS_ROCKS.IRON_ROCK
    );

    // Add objects to game state
    this.gameState.interactiveObjects[normalTree.id] = normalTree;
    this.gameState.interactiveObjects[oakTree.id] = oakTree;
    this.gameState.interactiveObjects[willowTree.id] = willowTree;
    this.gameState.interactiveObjects[copperRock.id] = copperRock;
    this.gameState.interactiveObjects[ironRock.id] = ironRock;

    this.logger.log(
      `Spawned ${Object.keys(this.gameState.interactiveObjects).length} interactive objects`
    );
  }

  /**
   * Handle player interaction with objects (woodcutting, mining, etc.)
   */
  private handleObjectInteraction(
    client: Client,
    message: { objectId: string; skillType: SkillType }
  ): void {
    const player = this.gameState.players[client.sessionId];
    const object = this.gameState.interactiveObjects[message.objectId];

    if (!player || !object) {
      client.send('interactionResult', {
        success: false,
        message: 'Invalid player or object',
        xpGained: 0,
        resourcesGained: [],
      });
      return;
    }

    // Check if object is respawning
    if (object.isRespawning) {
      client.send('interactionResult', {
        success: false,
        message: `${object.name} is respawning...`,
        xpGained: 0,
        resourcesGained: [],
      });
      return;
    }

    // Get player skill level from the skills manager
    const skillName = this.getSkillNameFromType(message.skillType);
    const playerSkillLevel = player.skills.getSkillLevel(skillName);

    // Check level requirement
    if (playerSkillLevel < object.level) {
      client.send('interactionResult', {
        success: false,
        message: `You need level ${object.level} ${message.skillType} to interact with this ${object.name}`,
        xpGained: 0,
        resourcesGained: [],
      });
      return;
    }

    // Perform interaction
    const result = this.objectsManager.interactWithObject(
      object.id,
      client.sessionId,
      playerSkillLevel,
      message.skillType
    );

    if (result.success) {
      // Add XP to player's skills
      const levelUpResult = player.skills.addExperience(skillName, result.xpGained);

      // Add resources to player's inventory
      for (const resource of result.resourcesGained) {
        const inventoryResult = player.inventory.addItem(resource.itemId, resource.quantity);
        if (!inventoryResult.success) {
          client.send('message', {
            type: 'inventory',
            message: inventoryResult.message,
          });
        }
      }

      // Update player totals
      player.totalLevel = player.skills.getTotalLevel();
      player.totalExperience = player.skills.getTotalExperience();

      // Update object in game state
      this.gameState.interactiveObjects[object.id] = this.objectsManager.getObject(object.id)!;

      // Send level up notification if applicable
      if (levelUpResult) {
        this.broadcast('levelUp', {
          playerId: client.sessionId,
          playerName: player.username,
          ...levelUpResult,
        });

        client.send('levelUp', {
          message: `Congratulations! You have leveled up your ${levelUpResult.skillName} to level ${levelUpResult.newLevel}!`,
          ...levelUpResult,
        });
      }

      // Send updated player data
      client.send('playerUpdate', {
        skills: player.skills.exportSkills(),
        inventory: player.inventory.exportInventory(),
        totalLevel: player.totalLevel,
        totalExperience: player.totalExperience,
      });

      // Broadcast interaction to all clients
      this.broadcast('objectInteraction', {
        playerId: client.sessionId,
        objectId: message.objectId,
        skillType: message.skillType,
        result: result,
      });

      this.logger.log(
        `Player ${player.username} ${message.skillType} ${object.name}: ${result.message} (+${result.xpGained} XP)`
      );
    }

    // Send result to player
    client.send('interactionResult', result);
  }

  /**
   * Convert SkillType to SkillName
   */
  private getSkillNameFromType(skillType: SkillType): SkillName {
    switch (skillType) {
      case SkillType.WOODCUTTING:
        return SkillName.WOODCUTTING;
      case SkillType.MINING:
        return SkillName.MINING;
      case SkillType.FISHING:
        return SkillName.FISHING;
      case SkillType.COOKING:
        return SkillName.COOKING;
      case SkillType.SMITHING:
        return SkillName.SMITHING;
      case SkillType.CRAFTING:
        return SkillName.CRAFTING;
      case SkillType.PRAYER:
        return SkillName.PRAYER;
      default:
        return SkillName.WOODCUTTING; // Default fallback
    }
  }

  /**
   * Update interactive objects (handle respawning, etc.)
   */
  private updateInteractiveObjects(): void {
    const currentTime = Date.now();

    Object.values(this.gameState.interactiveObjects).forEach(object => {
      if (object.isRespawning) {
        const timeSinceDepletion = (currentTime - object.lastInteraction) / 1000;

        if (timeSinceDepletion >= object.respawnTime) {
          // Respawn the object
          object.health = object.maxHealth;
          object.isRespawning = false;

          this.logger.log(`${object.name} at (${object.x}, ${object.y}) has respawned`);

          // Broadcast respawn to all clients
          this.broadcast('objectRespawned', {
            objectId: object.id,
            object: object,
          });
        }
      }
    });
  }
}
