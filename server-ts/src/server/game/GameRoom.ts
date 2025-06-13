// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for current project goals and persistent AI context.
import 'reflect-metadata';
import '../utils/room-level-metadata-fix';
import '../utils/symbol-metadata-polyfill';

import { Client, Room } from '@colyseus/core';
import { ZodError } from 'zod';
import { sendGameEventNotification } from '../discord-bot';
import economyIntegration from '../economy-integration';
import { CombatSystem } from './CombatSystem';
import { ECSIntegration } from './ECSIntegration';
import { ECSAutomationManager } from './ECSAutomationManager';
import {
  AreaMap,
  ArraySchema,
  DropItemMessage,
  EquipItemMessage,
  InventoryItem,
  NPC,
  Player,
  Trade,
  TradeAcceptMessage,
  TradeCancelMessage,
  TradeOfferMessage,
  TradeRequestMessage,
  WorldState,
} from './EntitySchemas';
import { GatheringSystem } from './GatheringSystem';
import { ItemManager } from './ItemManager';
import { LootManager } from './LootManager';
import { MapBlueprintSchema, type MapBlueprint } from './MapBlueprintSchema';
import { WaveManager } from './WaveManager';

export class GameRoom extends Room<WorldState> {
  // Method to load, validate, and add a map blueprint
  public loadAndValidateMapBlueprint(
    blueprintData: unknown,
    makeCurrent: boolean = true
  ): AreaMap | null {
    try {
      const validatedBlueprint = MapBlueprintSchema.parse(blueprintData) as MapBlueprint;

      // Create AreaMap instance from validated data
      // Note: The AreaMap constructor in EntitySchemas.ts currently auto-generates an ID.
      // If blueprintData.id is preferred, the AreaMap constructor or this logic might need adjustment.
      const newMap = new AreaMap(
        validatedBlueprint.name,
        validatedBlueprint.width,
        validatedBlueprint.height
      );
      newMap.id = validatedBlueprint.id; // Override auto-generated ID if schema provides one
      newMap.biome = validatedBlueprint.biome || 'plains'; // Set biome, defaulting if necessary
      newMap.collisionMap = validatedBlueprint.collisionMap;

      this.state.maps.set(newMap.id, newMap);
      console.log(
        `Map blueprint '${newMap.name}' (ID: ${newMap.id}) loaded and validated successfully.`
      );

      if (makeCurrent || !this.state.currentMapId) {
        this.state.currentMapId = newMap.id;
        console.log(`Map '${newMap.name}' set as current map.`);
      }
      return newMap;
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('Map blueprint validation failed:', error.errors);
      } else {
        console.error('An unexpected error occurred during map blueprint loading:', error);
      }
      return null;
    }
  }

  private initializeDefaultMap(): void {
    // Example of loading a default map blueprint
    // In a real scenario, this data would come from a file, database, or configuration
    const defaultMapBlueprintData = {
      id: 'default_map_001',
      name: 'Starting Plains',
      width: 20,
      height: 15,
      biome: 'plains',
      collisionMap: Array(15)
        .fill(null)
        .map(() => Array(20).fill(false)), // Example: 15x20 all walkable
      // Example of adding a collision point:
      // collisionMap[5][10] = true;
    };

    // Modify a point for testing collisionMap validation if dimensions mismatch in schema
    // defaultMapBlueprintData.collisionMap[0] = Array(19).fill(false); // This would fail width validation
    // defaultMapBlueprintData.height = 14; // This would fail height validation

    const map = this.loadAndValidateMapBlueprint(defaultMapBlueprintData, true);
    if (map) {
      // Example: Add a collision point to the loaded map
      map.addCollision(5, 5);
      console.log(`Collision added at 5,5 on map ${map.id}`);
      // NPCs could be loaded here based on map data if blueprints included NPC spawns
    } else {
      console.error(
        'Failed to initialize default map. GameRoom may not function correctly without a map.'
      );
      // Potentially throw an error or prevent room creation if a map is critical
    }

    // Invalid blueprint testing has been moved to dedicated unit tests
    // to avoid cluttering the initialization process with expected error logs
  }

  maxClients = 4;
  private combatSystem!: CombatSystem;
  private itemManager!: ItemManager;
  private gatheringSystem!: GatheringSystem;
  private ecsAutomationManager!: ECSAutomationManager;
  private waveManager!: WaveManager;
  private lootPickupRadius = 50; // Distance in pixels for loot pickup validation
  private lastUpdateTime: number = 0;

  // Enhanced movement tracking for anti-cheat and rate limiting
  private playerMovementLog: Map<string, Array<{ timestamp: number; x: number; y: number }>> =
    new Map();
  private readonly MAX_MOVEMENT_HISTORY = 10;
  private readonly MOVEMENT_RATE_LIMIT = 5; // Max 5 moves per second
  private readonly MOVEMENT_DISTANCE_CHECK = 2; // Max 2 tiles per move (allows diagonal)

  /**
   * Ensure all schema instances have Symbol.metadata for serialization
   */
  private ensureStateMetadata(): void {
    const { ensureInstanceMetadata } = require('../utils/room-level-metadata-fix');

    if (this.state) {
      ensureInstanceMetadata(this.state);

      // Ensure metadata for all nested collections
      if (this.state.players) {
        this.state.players.forEach((player: Player) => ensureInstanceMetadata(player));
      }
      if (this.state.npcs) {
        this.state.npcs.forEach((npc: NPC) => ensureInstanceMetadata(npc));
      }
      if (this.state.trades) {
        this.state.trades.forEach((trade: Trade) => ensureInstanceMetadata(trade));
      }
      if (this.state.lootDrops) {
        this.state.lootDrops.forEach((loot: any) => ensureInstanceMetadata(loot));
      }
      if (this.state.maps) {
        this.state.maps.forEach((map: AreaMap) => ensureInstanceMetadata(map));
      }
      if (this.state.resources) {
        this.state.resources.forEach((resource: any) => ensureInstanceMetadata(resource));
      }
    }
  }

  /**
   * Ensure trade instance has Symbol.metadata for serialization
   */
  private ensureTradeMetadata(trade: Trade): void {
    const { ensureInstanceMetadata } = require('../utils/room-level-metadata-fix');

    // Ensure metadata for the trade instance
    ensureInstanceMetadata(trade);

    // Ensure metadata for proposerItems and accepterItems ArraySchemas
    if (trade.proposerItems) {
      ensureInstanceMetadata(trade.proposerItems);
      trade.proposerItems.forEach((item: InventoryItem) => ensureInstanceMetadata(item));
    }
    if (trade.accepterItems) {
      ensureInstanceMetadata(trade.accepterItems);
      trade.accepterItems.forEach((item: InventoryItem) => ensureInstanceMetadata(item));
    }
  }

  onCreate(options: any): void {
    this.state = new WorldState();

    // Ensure state has metadata for serialization
    this.ensureStateMetadata();

    this.initializeDefaultMap(); // Initialize with a default or sample map

    // Initialize ECS automation manager for fully automated ECS systems
    this.ecsAutomationManager = new ECSAutomationManager({
      targetFrameRate: 60,
      performanceMonitoringEnabled: true,
      autoRecoveryEnabled: true,
      maxErrorsPerSecond: 5,
    });

    // Initialize systems
    this.itemManager = ItemManager.getInstance();
    this.gatheringSystem = GatheringSystem.getInstance();
    this.combatSystem = new CombatSystem(
      this.state as any,
      this.itemManager,
      new (require('./PrayerSystem').PrayerSystem)()
    );
    // Enhanced combat event handling with wave integration
    this.combatSystem.setCombatEventBroadcaster((type, payload) => {
      // Broadcast to all clients
      this.broadcast(type, payload);

      // Handle enemy deaths for wave progression
      if (type === 'npc_death' && payload.npcId) {
        this.waveManager.onEnemyDefeated(payload.npcId);
      }

      // Handle player deaths for game state management
      if (type === 'player_death' && payload.playerId) {
        const deadPlayer = this.state.players.get(payload.playerId);
        if (deadPlayer) {
          deadPlayer.health = 0;
          // Could implement respawn mechanics here
          console.log(`💀 Player ${deadPlayer.username} has been defeated!`);
        }
      }
    }); // Initialize wave manager with enhanced enemy-ECS integration
    const waveManagerEcsWorld = this.ecsAutomationManager.getECSIntegration().getWorld();
    this.waveManager = new WaveManager(
      this.state as any,
      this.itemManager,
      (type, payload) => this.broadcast(type, payload),
      npc => {
        // Enhanced ECS integration for spawned enemies
        try {
          const npcIdNum = parseInt(npc.npcId, 10) || 0;
          const combatLevel = npc.combatLevel || 1;
          const isMonster = true;

          // Mark as wave enemy for proper tracking
          npc.isWaveEnemy = true;

          // Create ECS entity with enhanced combat capabilities
          require('../ecs/world').createNPC(
            waveManagerEcsWorld,
            npcIdNum,
            npc.x,
            npc.y,
            combatLevel,
            isMonster
          );

          console.log(
            `🏆 Wave enemy spawned: ${npc.name} (Level ${combatLevel}) at (${npc.x}, ${npc.y})`
          );
        } catch (err) {
          console.error('Failed to create ECS entity for wave enemy:', npc, err);
        }
      }
    );

    // Start automatic wave progression after room initialization
    setTimeout(() => {
      if (this.state.players.size > 0) {
        this.waveManager.startAutomaticWaveProgression();
        console.log('🌊 Automatic wave progression started');
      }
    }, 3000); // 3 second delay for room stabilization

    // Spawn resources after map initialization
    const currentMap = this.state.maps.get(this.state.currentMapId);
    if (currentMap) {
      this.gatheringSystem.spawnResources(this.state, currentMap.width, currentMap.height);
    }

    // Start the ECS automation manager for fully automated systems
    this.ecsAutomationManager.start().catch(error => {
      console.error('Failed to start ECS automation:', error);
    });

    // Set up network broadcaster for ECS systems
    // Create a unified network broadcaster for all ECS visual systems
    const ecsNetworkBroadcaster = (type: string, data: unknown) => {
      this.broadcast(type, data);
    };

    // Set up broadcasters for all visual feedback systems
    this.ecsAutomationManager.getECSIntegration().setNetworkBroadcaster(ecsNetworkBroadcaster);

    // Main game loop: Legacy systems + ECS sync
    this.setSimulationInterval(() => {
      // Sync ECS positions back to Colyseus schemas for connected players
      this.syncECSToColyseus();

      // Update wave manager (survivor mechanics)
      this.waveManager.update();

      // Update legacy systems that haven't been converted to ECS yet
      this.updateNPCs();
      this.updateNPCBehavior();
      this.gatheringSystem.updateResources(this.state);
    }, 1000 / 60); // 60 FPS for smooth gameplay

    // Legacy NPCs for testing (will be removed when wave system takes over)
    const goblin1 = new NPC('goblin_1', 'Goblin', 5, 5, 'goblin', [
      { itemId: 'bronze_sword', probability: 0.5 },
      { itemId: 'bronze_plate', probability: 0.25 },
    ]);
    const orc1 = new NPC('orc_1', 'Orc', 15, 15, 'orc', [
      { itemId: 'iron_sword', probability: 0.7 },
    ]);
    this.state.npcs.set(goblin1.id, goblin1);
    this.state.npcs.set(orc1.id, orc1);

    console.log(
      'Initial NPCs added:',
      Array.from(this.state.npcs.values()).map(npc => npc.name)
    );

    console.log('GameRoom created:', options);

    // Validate initial state integrity
    this.validateStateIntegrity();

    this.onMessage('player_action', async (client, message) => {
      console.log(`Player action from ${client.sessionId}:`, message);
      const actionResult = this.combatSystem.handlePlayerAction(client.sessionId, message);
      if (actionResult) {
        const { result, targetId } = actionResult;
        // Apply damage to target
        const targetEntity = this.state.npcs.get(targetId) || this.state.players.get(targetId);
        if (targetEntity) {
          targetEntity.health = Math.max(0, targetEntity.health - result.damage);
          this.broadcast('entity_update', { entityId: targetId, health: targetEntity.health });
          // Handle death
          if (targetEntity.health === 0) {
            if (this.state.npcs.has(targetId)) {
              const npc = this.state.npcs.get(targetId)!;
              const lootDrop = await LootManager.dropLootFromNPC(this.state, npc, npc.lootTable);
              if (lootDrop) {
                this.broadcast('loot_spawn', lootDrop);

                // Check for rare drops and send Discord notification
                for (const item of lootDrop.items) {
                  const itemDef = await this.itemManager.getItemDefinition(item.itemId);
                  // Consider items with high base value as rare (e.g., > 10000)
                  // Or items with specific names containing 'dragon', 'rune', etc.
                  if (
                    itemDef &&
                    (itemDef.baseValue > 10000 ||
                      itemDef.name.toLowerCase().includes('dragon') ||
                      itemDef.name.toLowerCase().includes('rune') ||
                      itemDef.name.toLowerCase().includes('unique'))
                  ) {
                    sendGameEventNotification('rare_drop', {
                      playerName: this.state.players.get(client.sessionId)?.username || 'Unknown',
                      itemName: itemDef.name,
                      source: npc.name,
                      dropRate: 100, // Mock drop rate for now
                    });
                  }
                }
              }
              this.broadcast('npc_dead', { npcId: targetId });
              this.state.npcs.delete(targetId);
            } else {
              // Player death
              const deadPlayer = this.state.players.get(targetId);
              const killer = this.state.players.get(client.sessionId);

              if (deadPlayer && killer) {
                sendGameEventNotification('player_death', {
                  playerName: deadPlayer.username,
                  killedBy: killer.username,
                  x: deadPlayer.x,
                  y: deadPlayer.y,
                  combatLevel: deadPlayer.combatLevel || 1,
                });
              }

              client.send('player_dead', { playerId: targetId });
            }
          }
        }
        client.send('attack_result', { attackerId: client.sessionId, targetId, result });
        const targetClient = this.clients.find(c => c.sessionId === targetId);
        if (targetClient) {
          targetClient.send('attack_result', { attackerId: client.sessionId, targetId, result });
        } // Broadcast updated health or other state to both
        const attackerState = this.state.players.get(client.sessionId);
        if (attackerState)
          this.broadcast('updatePlayerState', {
            playerId: client.sessionId,
            playerState: attackerState,
          });
        const defenderState = this.state.players.get(targetId);
        if (defenderState)
          this.broadcast('updatePlayerState', { playerId: targetId, playerState: defenderState });
      }
    });
    this.onMessage('player_movement', (client, message) => {
      /**
       * Enhanced, secure, OSRS-authentic movement handler with ECS integration.
       * Uses ECS as authoritative source for movement validation and state.
       * Now with improved multiplayer synchronization.
       */
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const now = Date.now();
      const playerId = client.sessionId;

      // Initialize movement log for new players
      if (!this.playerMovementLog.has(playerId)) {
        this.playerMovementLog.set(playerId, []);
      }

      const movementHistory = this.playerMovementLog.get(playerId)!;

      // Rate limiting: Check recent moves
      const recentMoves = movementHistory.filter(move => now - move.timestamp < 1000);
      if (recentMoves.length >= this.MOVEMENT_RATE_LIMIT) {
        client.send('move_error', {
          message: 'Movement rate limit exceeded. Please slow down.',
          code: 'RATE_LIMIT',
        });
        return;
      }

      // Validate target position is within map bounds
      const currentMap = this.state.maps.get(this.state.currentMapId);
      if (!currentMap) return;
      const { width, height, collisionMap } = currentMap;
      const { targetX, targetY } = message;

      if (
        typeof targetX !== 'number' ||
        typeof targetY !== 'number' ||
        targetX < 0 ||
        targetY < 0 ||
        targetX >= width ||
        targetY >= height
      ) {
        client.send('move_error', {
          message: 'Invalid move: out of bounds.',
          code: 'OUT_OF_BOUNDS',
        });
        return;
      }

      // Check collision map (if tile is walkable)
      if (collisionMap && collisionMap[targetY] && collisionMap[targetY][targetX]) {
        client.send('move_error', {
          message: 'Invalid move: tile is blocked.',
          code: 'BLOCKED_TILE',
        });
        return;
      }

      // Enhanced distance validation
      const dx = targetX - player.x;
      const dy = targetY - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this.MOVEMENT_DISTANCE_CHECK) {
        client.send('move_error', {
          message: 'Invalid move: distance too far.',
          code: 'DISTANCE_TOO_FAR',
          maxDistance: this.MOVEMENT_DISTANCE_CHECK,
        });
        return;
      }

      // Log this movement for rate limiting and anti-cheat
      movementHistory.push({ timestamp: now, x: targetX, y: targetY });

      // Keep only recent history
      if (movementHistory.length > this.MAX_MOVEMENT_HISTORY) {
        movementHistory.shift();
      }

      // Get ECS entity ID for this player and sync to ECS
      let entityId;
      try {
        entityId = this.ecsAutomationManager.getECSIntegration().syncPlayerToECS(player);
      } catch (ecsError) {
        console.warn('Failed to sync player to ECS for movement:', ecsError);
        return;
      }

      // OSRS walking speed: 1 tile per 0.6s (base run speed is faster)
      const OSRS_TILE_TIME = player.isRunning ? 0.3 : 0.6; // Running is 2x faster
      const OSRS_TILE_SIZE = 1; // tile is 1 unit

      // Set ECS movement target and speed (ECS is now authoritative)
      const movementEcsWorld = this.ecsAutomationManager.getECSIntegration().getWorld();
      const { setMovementTarget } = require('../ecs/systems/MovementSystem');
      const { Movement } = require('../ecs/components');

      setMovementTarget(movementEcsWorld, entityId, targetX, targetY);
      if (Movement.speed[entityId] !== undefined) {
        Movement.speed[entityId] = OSRS_TILE_SIZE / OSRS_TILE_TIME;
      }

      // UPDATE: Immediately update Colyseus state for responsive client feedback
      player.x = targetX;
      player.y = targetY;
      player.lastMovementTime = now;

      // Send movement confirmation to the requesting player
      client.send('move_confirmed', {
        x: targetX,
        y: targetY,
        timestamp: now,
        entityId: entityId,
      });

      // Broadcast real-time position update to all other players for immediate synchronization
      this.broadcast(
        'player_position_update',
        {
          playerId: client.sessionId,
          x: targetX,
          y: targetY,
          timestamp: now,
          isRunning: player.isRunning || false,
        },
        { except: client }
      );

      console.log(
        `Player ${client.sessionId} moved to (${targetX}, ${targetY}) - broadcasted to ${this.clients.length - 1} other players`
      );

      // Note: Additional ECS validation and interpolation is handled by NetworkSyncSystem
    });

    // Equip item handler
    this.onMessage('equip_item', (client, message: EquipItemMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return client.send('equip_error', { message: 'Player not found.' });
      const invItem = player.inventory[message.itemIndex];
      if (!invItem) return client.send('equip_error', { message: 'Inventory slot empty.' });
      player.inventory.splice(message.itemIndex, 1);
      player.equipment[message.slot] = invItem.itemId;
      this.broadcast('updatePlayerState', { playerId: client.sessionId, playerState: player });
    });

    // Drop item handler
    this.onMessage('drop_item', async (client, message: DropItemMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return client.send('drop_error', { message: 'Player not found.' });
      const invItem = player.inventory[message.itemIndex];
      if (!invItem) return client.send('drop_error', { message: 'Inventory slot empty.' });
      const quantity = message.quantity || invItem.quantity;
      const lootDrop = await LootManager.dropSpecificItem(
        this.state,
        player,
        invItem.itemId,
        quantity
      );
      if (lootDrop) {
        this.broadcast('loot_spawn', lootDrop);
        this.broadcast('updatePlayerState', { playerId: client.sessionId, playerState: player });
      }
    });

    // Handler for gathering from resources
    this.onMessage('gather_resource', async (client, message: { resourceId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        console.warn(`Player ${client.sessionId} not found for resource gathering.`);
        return;
      }

      const { resourceId } = message;
      const result = await this.gatheringSystem.gatherResource(this.state, player, resourceId);

      if (result.success) {
        console.log(`Player ${player.username} started gathering from resource ${resourceId}`);
        client.send('gather_started', {
          message: result.message,
          resourceId,
        });
        // Update player state to show busy status
        this.broadcast('updatePlayerState', { playerId: client.sessionId, playerState: player });
      } else {
        client.send('gather_error', {
          message: result.message,
        });
      }
    });

    // Trade request handler
    this.onMessage('trade_request', (client, message: TradeRequestMessage) => {
      // eslint-disable-next-line no-console
      console.log(`🎯 DEBUG: trade_request from ${client.sessionId} to ${message.targetPlayerId}`, {
        playersCount: this.state.players.size,
        tradesCount: this.state.trades.size,
      });

      const player = this.state.players.get(client.sessionId);
      const targetPlayer = this.state.players.get(message.targetPlayerId);

      if (!player || !targetPlayer) {
        client.send('trade_error', { message: 'Player or target not found.' });
        return;
      }

      if (player.isBusy || targetPlayer.isBusy) {
        client.send('trade_error', { message: 'One of the players is currently busy.' });
        return;
      }

      // Check if either player is already in a trade
      const existingTrade = Array.from(this.state.trades.values()).find(
        trade =>
          trade.proposerId === player.id ||
          trade.accepterId === player.id ||
          trade.proposerId === targetPlayer.id ||
          trade.accepterId === targetPlayer.id
      );

      if (existingTrade) {
        client.send('trade_error', { message: 'One of the players is already in a trade.' });
        return;
      }

      const tradeId = `trade_${Date.now()}_${player.id}_${targetPlayer.id}`;

      // ========== DEBUG LOGGING START ==========
      console.log(`🔍 DEBUG: Creating new trade with ID: ${tradeId}`);

      const newTrade = new Trade(tradeId, player.id, targetPlayer.id);

      // Log the newly created trade object
      console.log(`🔍 DEBUG: Created trade object:`, {
        tradeId: newTrade.tradeId,
        proposerId: newTrade.proposerId,
        accepterId: newTrade.accepterId,
        proposerItemsConstructor: newTrade.proposerItems?.constructor?.name,
        accepterItemsConstructor: newTrade.accepterItems?.constructor?.name,
        proposerItemsLength: newTrade.proposerItems?.length,
        accepterItemsLength: newTrade.accepterItems?.length,
      });

      // Check if proposerItems and accepterItems have schema metadata
      console.log(`🔍 DEBUG: Schema metadata check:`, {
        proposerItemsMetadata: newTrade.proposerItems?.['Symbol(Symbol.metadata)'] !== undefined,
        accepterItemsMetadata: newTrade.accepterItems?.['Symbol(Symbol.metadata)'] !== undefined,
        proposerItemsProto: Object.getPrototypeOf(newTrade.proposerItems)?.constructor?.name,
        accepterItemsProto: Object.getPrototypeOf(newTrade.accepterItems)?.constructor?.name,
      });

      // Defensive: ensure proposerItems and accepterItems are ArraySchema and all items are InventoryItem
      if (!(newTrade.proposerItems instanceof ArraySchema)) {
        console.log(`🔍 DEBUG: proposerItems is not ArraySchema, creating new one`);
        newTrade.proposerItems = new ArraySchema();
      }
      if (!(newTrade.accepterItems instanceof ArraySchema)) {
        console.log(`🔍 DEBUG: accepterItems is not ArraySchema, creating new one`);
        newTrade.accepterItems = new ArraySchema();
      }

      console.log(`🔍 DEBUG: After defensive ArraySchema creation:`, {
        proposerItemsConstructor: newTrade.proposerItems?.constructor?.name,
        accepterItemsConstructor: newTrade.accepterItems?.constructor?.name,
        proposerItemsMetadata: newTrade.proposerItems?.['Symbol(Symbol.metadata)'] !== undefined,
        accepterItemsMetadata: newTrade.accepterItems?.['Symbol(Symbol.metadata)'] !== undefined,
      });

      // Defensive: wrap any non-InventoryItem in proposerItems
      for (let i = 0; i < newTrade.proposerItems.length; i++) {
        const item: any = newTrade.proposerItems[i];
        console.log(`🔍 DEBUG: Checking proposerItems[${i}]:`, {
          itemConstructor: item?.constructor?.name,
          isInventoryItem: item instanceof InventoryItem,
          itemId: item?.itemId,
        });
        if (
          !(item instanceof InventoryItem) &&
          item &&
          typeof item === 'object' &&
          'itemId' in item
        ) {
          console.log(`🔍 DEBUG: Wrapping non-InventoryItem at proposerItems[${i}]`);
          newTrade.proposerItems[i] = new InventoryItem(item, (item as any).quantity || 1);
        }
      }
      for (let i = 0; i < newTrade.accepterItems.length; i++) {
        const item: any = newTrade.accepterItems[i];
        if (
          !(item instanceof InventoryItem) &&
          item &&
          typeof item === 'object' &&
          'itemId' in item
        ) {
          newTrade.accepterItems[i] = new InventoryItem(item, (item as any).quantity || 1);
        }
      }

      // Ensure trade has metadata before adding to state
      this.ensureTradeMetadata(newTrade);

      this.state.trades.set(tradeId, newTrade);

      // Start trade timeout timer
      this.startTradeTimeout(tradeId);

      // Validate state after trade creation
      this.validateStateIntegrity();

      // RUNTIME TYPE ASSERTION AND LOGGING
      // eslint-disable-next-line no-console
      console.log('TRADE CREATED DEBUG:', {
        tradeType: newTrade?.constructor?.name,
        proposerItemsType: newTrade?.proposerItems?.constructor?.name,
        accepterItemsType: newTrade?.accepterItems?.constructor?.name,
        proposerItems: newTrade?.proposerItems,
        accepterItems: newTrade?.accepterItems,
        proposerItemsFirst: newTrade?.proposerItems?.[0]?.constructor?.name,
        accepterItemsFirst: newTrade?.accepterItems?.[0]?.constructor?.name,
      });
      if (!(newTrade instanceof Trade)) {
        console.error('Trade is not instance of Trade:', newTrade);
      }
      if (!(newTrade.proposerItems instanceof ArraySchema)) {
        console.error('proposerItems is not ArraySchema:', newTrade.proposerItems);
      }
      if (!(newTrade.accepterItems instanceof ArraySchema)) {
        console.error('accepterItems is not ArraySchema:', newTrade.accepterItems);
      }

      // RUNTIME TYPE ASSERTIONS before serialization/broadcast
      function logSchemaType(label, obj) {
        const stack = new Error().stack;
        // eslint-disable-next-line no-console
        console.log(label, {
          type: obj?.constructor?.name,
          isArraySchema: obj instanceof ArraySchema,
          isInventoryItem: obj instanceof InventoryItem,
          isSchema: obj && obj.constructor && obj.constructor.name.includes('Schema'),
          hasMetadata: obj && obj.constructor && obj.constructor[Symbol.metadata] !== undefined,
          prototype: obj && Object.getPrototypeOf(obj)?.constructor?.name,
          keys: obj && typeof obj === 'object' ? Object.keys(obj) : undefined,
          stack: stack?.split('\n').slice(1, 4).join('\n'),
        });
      }
      logSchemaType('DEBUG: trade', newTrade);
      logSchemaType('DEBUG: proposerItems', newTrade.proposerItems);
      logSchemaType('DEBUG: accepterItems', newTrade.accepterItems);
      if (newTrade.proposerItems && Array.isArray(newTrade.proposerItems)) {
        for (const item of newTrade.proposerItems) {
          logSchemaType('DEBUG: proposerItem', item);
        }
      }
      if (newTrade.accepterItems && Array.isArray(newTrade.accepterItems)) {
        for (const item of newTrade.accepterItems) {
          logSchemaType('DEBUG: accepterItem', item);
        }
      }
      // Notify both players
      client.send('trade_request_sent', { tradeId, targetPlayerName: targetPlayer.username });
      this.clients
        .find(c => c.sessionId === targetPlayer.id)
        ?.send('trade_request_received', {
          tradeId,
          proposerPlayerId: player.id,
          proposerPlayerName: player.username,
        });

      console.log(
        `Trade request sent from ${player.username} to ${targetPlayer.username} (ID: ${tradeId})`
      );
    });

    // Trade offer handler
    this.onMessage('trade_offer', async (client, message: TradeOfferMessage) => {
      const player = this.state.players.get(client.sessionId);
      const trade = Array.from(this.state.trades.values()).find(
        t => (t.proposerId === player?.id || t.accepterId === player?.id) && t.status === 'pending'
      );

      if (!player || !trade) {
        client.send('trade_error', { message: 'Player not found or no pending trade.' });
        return;
      }

      // Determine if player is proposer or accepter in this trade
      const isProposer = trade.proposerId === player.id;

      // Clear previous offer if any using safe methods
      if (isProposer) {
        trade.clearProposerItems();
      } else {
        trade.clearAccepterItems();
      }

      // Validate and add offered items to the trade
      for (const offeredItem of message.offeredItems) {
        const itemDef = await this.itemManager.getItemDefinition(offeredItem.itemId);
        if (!itemDef) {
          client.send('trade_error', { message: `Item ${offeredItem.itemId} not found.` });
          return;
        }

        const playerInventoryItem = player.inventory.find(
          item => item.itemId === offeredItem.itemId
        );
        if (!playerInventoryItem || playerInventoryItem.quantity < offeredItem.quantity) {
          client.send('trade_error', { message: `Not enough ${itemDef.name} in inventory.` });
          return;
        }

        // Add item to trade object using safe methods
        const tradeItem = new InventoryItem(itemDef, offeredItem.quantity);
        if (isProposer) {
          trade.addProposerItem(tradeItem);
        } else {
          trade.addAccepterItem(tradeItem);
        }

        // Remove items from player's inventory (in-game state)
        playerInventoryItem.quantity -= offeredItem.quantity;
        if (playerInventoryItem.quantity === 0) {
          player.inventory.splice(player.inventory.indexOf(playerInventoryItem), 1);
        }

        // ECONOMY API SYNC: Remove items from player's economy inventory
        try {
          const economyProfile = await economyIntegration.getOrCreatePlayerProfile(player.username);
          const itemDef = await this.itemManager.getItemDefinition(offeredItem.itemId);
          if (economyProfile && economyProfile.id && itemDef && itemDef.id) {
            await economyIntegration.removeItemFromInventory(
              economyProfile.id,
              parseInt(itemDef.id, 10) || 0,
              offeredItem.quantity
            );
            console.log(
              `Synced removal of ${offeredItem.quantity}x ${offeredItem.itemId} from Economy API for player ${economyProfile.id}`
            );
          } else {
            console.warn(
              `Missing economy profile or item definition for item ${offeredItem.itemId}`
            );
          }
        } catch (error) {
          console.error(
            `Failed to sync item removal for ${offeredItem.itemId} from Economy API for player ${player.id}:`,
            error
          );
          // Potentially revert in-game inventory changes if API sync fails
        }
      }

      trade.status = 'offered';
      // Notify both players about the updated offer
      const targetPlayer = this.state.players.get(isProposer ? trade.accepterId : trade.proposerId);
      if (targetPlayer) {
        client.send('trade_offer_updated', {
          tradeId: trade.tradeId,
          offeredItems: message.offeredItems,
          isProposer: isProposer,
        });
        this.clients
          .find(c => c.sessionId === targetPlayer.id)
          ?.send('trade_offer_updated', {
            tradeId: trade.tradeId,
            offeredItems: message.offeredItems,
            isProposer: !isProposer,
          });
      }
      console.log(`Trade offer updated for trade ID ${trade.tradeId} by ${player.username}.`);

      // Validate state after trade offer update
      this.validateStateIntegrity();
    });

    // Trade accept handler
    this.onMessage('trade_accept', async (client, message: TradeAcceptMessage) => {
      const player = this.state.players.get(client.sessionId);
      const trade = this.state.trades.get(message.tradeId);

      if (!player || !trade) {
        client.send('trade_error', { message: 'Player not found or trade not found.' });
        return;
      }

      if (trade.status !== 'offered') {
        client.send('trade_error', { message: 'Trade is not in an offered state.' });
        return;
      }

      // Check if the player accepting is the intended accepter
      if (player.id !== trade.accepterId) {
        client.send('trade_error', {
          message: 'You are not the intended recipient of this trade offer.',
        });
        return;
      }

      const proposer = this.state.players.get(trade.proposerId);
      const accepter = this.state.players.get(trade.accepterId);

      if (!proposer || !accepter) {
        client.send('trade_error', {
          message: 'One or both players not found for trade completion.',
        });
        return;
      }

      // Validate inventory space for both players
      const MAX_INVENTORY_SIZE = 28; // OSRS standard inventory size

      // Check if proposer has space for accepter's items
      const proposerFinalInventorySize =
        proposer.inventory.length - trade.proposerItems.length + trade.accepterItems.length;
      if (proposerFinalInventorySize > MAX_INVENTORY_SIZE) {
        client.send('trade_error', { message: 'Proposer does not have enough inventory space.' });
        this.clients
          .find(c => c.sessionId === trade.proposerId)
          ?.send('trade_error', {
            message: 'You do not have enough inventory space for this trade.',
          });
        return;
      }

      // Check if accepter has space for proposer's items
      const accepterFinalInventorySize =
        accepter.inventory.length - trade.accepterItems.length + trade.proposerItems.length;
      if (accepterFinalInventorySize > MAX_INVENTORY_SIZE) {
        client.send('trade_error', {
          message: 'You do not have enough inventory space for this trade.',
        });
        this.clients
          .find(c => c.sessionId === trade.proposerId)
          ?.send('trade_error', { message: 'Accepter does not have enough inventory space.' });
        return;
      }

      // Double-check that all offered items still exist in inventories
      // This prevents item duplication exploits
      for (const item of trade.proposerItems) {
        const invItem = proposer.inventory.find(
          i => i.itemId === item.itemId && i.quantity >= item.quantity
        );
        if (!invItem) {
          client.send('trade_error', {
            message: 'Trade failed: Proposer no longer has all offered items.',
          });
          this.clients
            .find(c => c.sessionId === trade.proposerId)
            ?.send('trade_error', {
              message: 'Trade failed: You no longer have all offered items.',
            });
          // Cancel the trade and return items
          this.cancelTradeAndReturnItems(trade);
          return;
        }
      }

      for (const item of trade.accepterItems) {
        const invItem = accepter.inventory.find(
          i => i.itemId === item.itemId && i.quantity >= item.quantity
        );
        if (!invItem) {
          client.send('trade_error', {
            message: 'Trade failed: You no longer have all offered items.',
          });
          this.clients
            .find(c => c.sessionId === trade.proposerId)
            ?.send('trade_error', {
              message: 'Trade failed: Accepter no longer has all offered items.',
            });
          // Cancel the trade and return items
          this.cancelTradeAndReturnItems(trade);
          return;
        }
      }

      // Mark trade as processing to prevent double-accepts
      trade.status = 'processing';

      // Transfer items (in-game state)
      // Proposer gives items to accepter
      for (const item of trade.proposerItems) {
        accepter.inventory.push(item);
        // ECONOMY API SYNC: Add items to accepter's economy inventory
        try {
          const economyProfile = await economyIntegration.getOrCreatePlayerProfile(
            accepter.username
          );
          const itemDef = await this.itemManager.getItemDefinition(item.itemId);
          if (economyProfile && economyProfile.id && itemDef && itemDef.id) {
            await economyIntegration.addItemToInventory(
              economyProfile.id,
              itemDef.id,
              item.quantity
            );
            console.log(
              `Synced addition of ${item.quantity}x ${item.itemId} to Economy API for player ${economyProfile.id}`
            );
          } else {
            console.warn(`Missing economy profile or item definition for item ${item.itemId}`);
          }
        } catch (error) {
          console.error(
            `Failed to sync item addition for ${item.itemId} to Economy API for player ${accepter.id}:`,
            error
          );
        }
      }

      // Accepter gives items to proposer
      for (const item of trade.accepterItems) {
        proposer.inventory.push(item);
        // ECONOMY API SYNC: Add items to proposer's economy inventory
        try {
          const economyProfile = await economyIntegration.getOrCreatePlayerProfile(
            proposer.username
          );
          const itemDef = await this.itemManager.getItemDefinition(item.itemId);
          if (economyProfile && economyProfile.id && itemDef && itemDef.id) {
            await economyIntegration.addItemToInventory(
              economyProfile.id,
              itemDef.id,
              item.quantity
            );
            console.log(
              `Synced addition of ${item.quantity}x ${item.itemId} to Economy API for player ${economyProfile.id}`
            );
          } else {
            console.warn(`Missing economy profile or item definition for item ${item.itemId}`);
          }
        } catch (error) {
          console.error(
            `Failed to sync item addition for ${item.itemId} to Economy API for player ${proposer.id}:`,
            error
          );
        }
      }

      trade.status = 'completed';
      this.state.trades.delete(trade.tradeId);

      // Notify both players
      client.send('trade_completed', {
        tradeId: trade.tradeId,
        message: 'Trade completed successfully!',
      });
      this.clients
        .find(c => c.sessionId === trade.proposerId)
        ?.send('trade_completed', {
          tradeId: trade.tradeId,
          message: 'Trade completed successfully!',
        });

      console.log(
        `Trade ${trade.tradeId} completed between ${proposer.username} and ${accepter.username}.`
      );

      // Send Discord notification for trade completion
      const proposerItemsStr =
        trade.proposerItems.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Nothing';
      const accepterItemsStr =
        trade.accepterItems.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Nothing';

      sendGameEventNotification('trade_completed', {
        player1: proposer.username,
        player2: accepter.username,
        player1Items: proposerItemsStr,
        player2Items: accepterItemsStr,
      });

      // Validate state after trade completion
      this.validateStateIntegrity();
    });

    // Trade cancel handler
    this.onMessage('trade_cancel', async (client, message: TradeCancelMessage) => {
      const player = this.state.players.get(client.sessionId);
      const trade = this.state.trades.get(message.tradeId);

      if (!player || !trade) {
        client.send('trade_error', { message: 'Player not found or trade not found.' });
        return;
      }

      // Only the proposer or accepter can cancel the trade
      if (player.id !== trade.proposerId && player.id !== trade.accepterId) {
        client.send('trade_error', { message: 'You are not part of this trade.' });
        return;
      }

      // Return proposer's items
      const proposer = this.state.players.get(trade.proposerId);
      if (proposer) {
        for (const item of trade.proposerItems) {
          proposer.inventory.push(item);
          // ECONOMY API SYNC: Add items back to proposer's economy inventory
          try {
            const economyProfile = await economyIntegration.getOrCreatePlayerProfile(
              proposer.username
            );
            const itemDef = await this.itemManager.getItemDefinition(item.itemId);
            if (economyProfile && economyProfile.id && itemDef && itemDef.id) {
              await economyIntegration.addItemToInventory(
                economyProfile.id,
                itemDef.id,
                item.quantity
              );
              console.log(
                `Synced return of ${item.quantity}x ${item.itemId} to Economy API for player ${economyProfile.id}`
              );
            } else {
              console.warn(`Missing economy profile or item definition for item ${item.itemId}`);
            }
          } catch (error) {
            console.error(
              `Failed to sync item return for ${item.itemId} to Economy API for player ${proposer.id}:`,
              error
            );
          }
        }
      }

      // Return accepter's items
      const accepter = this.state.players.get(trade.accepterId);
      if (accepter) {
        for (const item of trade.accepterItems) {
          accepter.inventory.push(item);
          // TODO: Add economy integration for returning items
        }
      }

      // Remove trade from active trades
      this.state.trades.delete(message.tradeId);

      // Notify both players that trade was cancelled
      const proposerClient = this.clients.find(c => c.sessionId === trade.proposerId);
      const accepterClient = this.clients.find(c => c.sessionId === trade.accepterId);
      if (proposerClient) {
        proposerClient.send('trade_cancelled', { tradeId: message.tradeId });
      }
      if (accepterClient) {
        accepterClient.send('trade_cancelled', { tradeId: message.tradeId });
      }
    });
  } /**
   * Enhanced onJoin handler with immediate multiplayer synchronization
   */
  async onJoin(client: Client, options?: any): Promise<void> {
    console.log(`🎮 Player ${client.sessionId} joining game room`);

    try {
      // Create new player with enhanced multiplayer-ready state
      const newPlayer = new Player();
      newPlayer.id = client.sessionId;
      newPlayer.username = options?.username || `Player${Math.floor(Math.random() * 1000)}`;

      // Set spawn position (add some randomization to avoid overlap)
      const spawnRadius = 3;
      const spawnX = 50 + Math.floor(Math.random() * spawnRadius * 2) - spawnRadius;
      const spawnY = 50 + Math.floor(Math.random() * spawnRadius * 2) - spawnRadius;

      newPlayer.x = spawnX;
      newPlayer.y = spawnY;
      newPlayer.health = 100;
      newPlayer.combatLevel = 3;
      newPlayer.isRunning = false;
      newPlayer.lastMovementTime = Date.now();

      // Add player to game state
      this.state.players.set(client.sessionId, newPlayer);

      // Sync player to ECS for immediate combat and movement capability
      try {
        const entityId = this.ecsAutomationManager.getECSIntegration().syncPlayerToECS(newPlayer);
        console.log(`✅ Player ${client.sessionId} synced to ECS with entity ID: ${entityId}`);
      } catch (ecsError) {
        console.error('Failed to sync new player to ECS:', ecsError);
      }

      // Send immediate welcome message with current room state
      client.send('welcome', {
        playerId: client.sessionId,
        playerState: newPlayer,
        roomState: {
          playerCount: this.state.players.size,
          currentMap: this.state.currentMapId,
          gameStarted: this.state.gameStarted,
        },
        timestamp: Date.now(),
      });

      // Broadcast player join event to all existing players
      this.broadcast(
        'player_joined',
        {
          playerId: client.sessionId,
          playerState: {
            id: newPlayer.id,
            username: newPlayer.username,
            x: newPlayer.x,
            y: newPlayer.y,
            health: newPlayer.health,
            combatLevel: newPlayer.combatLevel,
          },
          playerCount: this.state.players.size,
          timestamp: Date.now(),
        },
        { except: client }
      );

      // Send existing players data to the new player
      const existingPlayers: any[] = [];
      this.state.players.forEach((player, playerId) => {
        if (playerId !== client.sessionId) {
          existingPlayers.push({
            id: player.id,
            username: player.username,
            x: player.x,
            y: player.y,
            health: player.health,
            combatLevel: player.combatLevel,
            isRunning: player.isRunning,
          });
        }
      });

      if (existingPlayers.length > 0) {
        client.send('existing_players', {
          players: existingPlayers,
          timestamp: Date.now(),
        });
      }

      console.log(
        `✅ Player ${client.sessionId} (${newPlayer.username}) joined successfully. Room now has ${this.state.players.size} players.`
      );
    } catch (error) {
      console.error(`❌ Failed to add player ${client.sessionId}:`, error);
      client.send('join_error', {
        message: 'Failed to join game. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  /**
   * Called when a player leaves the room
   */ /**
   * Enhanced onLeave handler with multiplayer cleanup
   */
  async onLeave(client: Client, consented: boolean): Promise<void> {
    const playerId = client.sessionId;
    console.log(`🚪 Player ${playerId} leaving room (consented: ${consented})`);

    try {
      // Get player before removal for broadcasting
      const leavingPlayer = this.state.players.get(playerId);

      if (leavingPlayer) {
        // Remove from ECS systems
        try {
          const ecsWorld = this.ecsAutomationManager.getECSIntegration().getWorld();
          // The ECS system should handle cleanup automatically when player entity is removed
        } catch (ecsError) {
          console.error('Error during ECS cleanup for leaving player:', ecsError);
        }

        // Clean up movement tracking
        this.playerMovementLog.delete(playerId);

        // Remove player from game state
        this.state.players.delete(playerId);

        // Broadcast player leave event to remaining players
        this.broadcast('player_left', {
          playerId: playerId,
          username: leavingPlayer.username,
          playerCount: this.state.players.size,
          timestamp: Date.now(),
        });

        console.log(
          `✅ Player ${playerId} (${leavingPlayer.username}) removed successfully. Room now has ${this.state.players.size} players.`
        );
      } else {
        console.warn(`⚠️ Player ${playerId} was not found in game state during leave`);
      }

      // If no players remain, consider pausing the game loop or cleanup
      if (this.state.players.size === 0) {
        console.log('🏠 Room is now empty - all players have left');
        // The room will be automatically disposed by Colyseus
      }
    } catch (error) {
      console.error(`❌ Error handling player leave for ${playerId}:`, error);
    }
  }

  /**
   * Add starter items to a new player's inventory
   */
  private async addStarterItems(player: Player): Promise<void> {
    try {
      // Get starter items from ItemManager (handle async properly)
      const starterSword = await this.itemManager.getItemDefinition('starter_sword');
      const starterShield = await this.itemManager.getItemDefinition('starter_shield');

      if (starterSword) {
        const swordItem = new InventoryItem(starterSword, 1);
        player.inventory.push(swordItem);
      }

      if (starterShield) {
        const shieldItem = new InventoryItem(starterShield, 1);
        player.inventory.push(shieldItem);
      }

      console.log(`Added ${player.inventory.length} starter items to ${player.username}`);
    } catch (error) {
      console.error('Error adding starter items:', error);
      // Continue without starter items if there's an error
    }
  }

  /**
   * Update NPCs in the game world
   */
  private updateNPCs(): void {
    // Update NPC state (health, positions, etc.)
    for (const npc of this.state.npcs.values()) {
      // Update NPC busy status
      if (npc.isBusy && npc.busyUntil <= Date.now()) {
        npc.isBusy = false;
      }

      // Add any NPC-specific update logic here
      // For now, this is a placeholder
    }
  }

  /**
   * Update NPC AI behavior
   */
  private updateNPCBehavior(): void {
    // Update NPC AI and behavior patterns
    for (const npc of this.state.npcs.values()) {
      // Simple AI placeholder - NPCs could move, attack, or interact
      // For now, this is a placeholder for future AI implementation

      // Example: Reset combat target if player is too far away
      if (npc.currentTargetId) {
        const target = this.state.players.get(npc.currentTargetId);
        if (!target) {
          npc.currentTargetId = '';
          npc.inCombat = false;
        }
      }
    }
  }

  /**
   * Validates the integrity of the game state
   */
  private validateStateIntegrity(): void {
    // Placeholder for state integrity validation
    // TODO: Implement comprehensive state validation
  }

  /**
   * Sync ECS positions back to Colyseus schemas for smooth multiplayer updates
   */
  private syncECSToColyseus(): void {
    try {
      const ecsIntegration = this.ecsAutomationManager.getECSIntegration();

      // Sync all connected players from ECS back to Colyseus
      for (const [sessionId, player] of this.state.players.entries()) {
        const entityId = ecsIntegration.getEntityId(sessionId);
        if (entityId !== undefined) {
          ecsIntegration.syncECSToPlayer(entityId, player);
        }
      }
    } catch (error) {
      console.warn('Error syncing ECS to Colyseus:', error);
    }
  }

  /**
   * Called when the room is being disposed
   */
  async onDispose(): Promise<void> {
    console.log('GameRoom disposing...');

    try {
      // Stop the ECS automation manager
      await this.ecsAutomationManager.stop();
      console.log('ECS automation manager stopped successfully');
    } catch (error) {
      console.error('Error stopping ECS automation manager:', error);
    }

    console.log('GameRoom disposed');
  }

  /**
   * Start trade timeout for automatic cancellation
   */
  private startTradeTimeout(tradeId: string): void {
    setTimeout(() => {
      const trade = this.state.activeTrades.get(tradeId);
      if (trade && trade.status === 'pending') {
        this.cancelTradeAndReturnItems(trade);

        // Notify players that trade timed out
        const player1 = this.state.players.get(trade.proposerId);
        const player2 = this.state.players.get(trade.accepterId);

        if (player1) {
          this.sendToPlayer(trade.proposerId, 'trade_timeout', { tradeId });
        }
        if (player2) {
          this.sendToPlayer(trade.accepterId, 'trade_timeout', { tradeId });
        }
      }
    }, 60000); // 60 second timeout
  }

  /**
   * Cancel trade and return items to players
   */
  private cancelTradeAndReturnItems(trade: any): void {
    try {
      // Return items to player 1
      if (trade.player1Offer && trade.player1Offer.length > 0) {
        const player1 = this.state.players.get(trade.player1Id);
        if (player1) {
          for (const item of trade.player1Offer) {
            this.addItemToPlayerInventory(player1, item);
          }
        }
      }

      // Return items to player 2
      if (trade.player2Offer && trade.player2Offer.length > 0) {
        const player2 = this.state.players.get(trade.player2Id);
        if (player2) {
          for (const item of trade.player2Offer) {
            this.addItemToPlayerInventory(player2, item);
          }
        }
      }

      // Remove trade from active trades
      this.state.activeTrades.delete(trade.id);

      console.log(`Trade ${trade.id} cancelled and items returned`);
    } catch (error) {
      console.error('Error cancelling trade and returning items:', error);
    }
  }

  /**
   * Helper method to add item to player inventory
   */
  private addItemToPlayerInventory(player: Player, item: any): void {
    try {
      // Find existing stack or empty slot
      let added = false;

      for (const [slotIndex, inventoryItem] of player.inventory.entries()) {
        if (!inventoryItem) {
          // Empty slot found
          player.inventory[slotIndex] = item;
          added = true;
          break;
        } else if (inventoryItem.itemId === item.itemId && inventoryItem.stackable) {
          // Stackable item found
          inventoryItem.quantity += item.quantity;
          added = true;
          break;
        }
      }

      if (!added) {
        console.warn(
          `Could not add item ${item.itemId} to player ${player.id} inventory - no space`
        );
      }
    } catch (error) {
      console.error('Error adding item to player inventory:', error);
    }
  }

  /**
   * Send a message to a specific player by session ID
   */
  private sendToPlayer(
    sessionId: string,
    messageType: string,
    data: Record<string, unknown>
  ): void {
    try {
      const client = this.clients.find(client => client.sessionId === sessionId);
      if (client) {
        client.send(messageType, data);
      } else {
        console.warn(`Could not find client for session ID: ${sessionId}`);
      }
    } catch (error) {
      console.error(`Error sending message to player ${sessionId}:`, error);
    }
  }
}
