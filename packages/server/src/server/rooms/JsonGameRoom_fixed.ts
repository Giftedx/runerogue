/**
 * JSON-based state synchronization room with OSRS combat integration
 * Enhanced with authentic OSRS combat formulas and player stats
 */

import { Room, Client } from '@colyseus/core';
import {
  calculateCombatLevel,
  calculateMaxHit,
  calculateAccuracy,
  getAttackSpeed,
} from '@runerogue/osrs-data';
import { OSRSCombatStats, OSRSEquipmentBonuses } from '@runerogue/shared';

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
}

export class JsonGameRoom extends Room {
  maxClients = 4;
  patchRate = 1000 / 30; // 30 FPS

  private gameState: JsonGameState;
  onCreate(options: any) {
    console.log('Enhanced JsonGameRoom with OSRS combat created:', options);

    // Initialize JSON-based game state
    this.gameState = {
      tick: 0,
      timestamp: Date.now(),
      playerCount: 0,
      players: {},
    };

    // Set up message handlers
    this.onMessage('move', (client, message) => {
      this.handlePlayerMove(client, message);
    });

    this.onMessage('attack', (client, message) => {
      this.handlePlayerAttack(client, message);
    });

    this.onMessage('requestState', client => {
      client.send('fullState', this.gameState);
    });

    this.onMessage('chat', (client, message) => {
      this.handleChatMessage(client, message);
    });

    // Set up game loop
    this.setSimulationInterval(() => this.jsonUpdate());

    console.log('Enhanced JsonGameRoom with OSRS combat initialized');
  }
  onJoin(client: Client, options: JsonJoinOptions) {
    console.log(
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
    };

    // Add to state
    this.gameState.players[client.sessionId] = player;
    this.gameState.playerCount++;

    console.log(
      `Player ${username} (CB Level ${combatLevel}) spawned at (${player.x}, ${player.y})`
    );
    console.log(`Current players in room: ${this.gameState.playerCount}`);

    // Send full state to the new client
    client.send('fullState', this.gameState);

    // Broadcast enhanced player joined to all clients
    this.broadcast('playerJoined', player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Player ${client.sessionId} left JsonGameRoom (consented: ${consented})`);

    // Remove player
    delete this.gameState.players[client.sessionId];
    this.gameState.playerCount--;

    console.log(`Players remaining: ${this.gameState.playerCount}`);

    // Broadcast player left to all clients
    this.broadcast('playerLeft', { sessionId: client.sessionId });
  }
  onDispose() {
    console.log('JsonGameRoom disposed');
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

    console.log(
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

    console.log(`${player.username} died and respawned at (${player.x}, ${player.y})`);
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
      console.log(`Chat - ${player.username}: ${chatMessage.message}`);
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
      console.log(
        `Enhanced JsonGameRoom tick: ${this.gameState.tick}, players: ${this.gameState.playerCount}`
      );
    }
  }
}
