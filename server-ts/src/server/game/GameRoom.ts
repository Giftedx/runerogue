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
  private ecsIntegration!: ECSIntegration;
  private waveManager!: WaveManager;
  private lootPickupRadius = 50; // Distance in pixels for loot pickup validation
  private lastUpdateTime: number = 0;

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

    // Initialize ECS integration
    this.ecsIntegration = new ECSIntegration();

    // Initialize systems
    this.itemManager = ItemManager.getInstance();
    this.gatheringSystem = GatheringSystem.getInstance();
    this.combatSystem = new CombatSystem(
      this.state as any,
      this.itemManager,
      new (require('./PrayerSystem').PrayerSystem)()
    );

    // Initialize wave manager for survivor mechanics
    this.waveManager = new WaveManager(this.state as any, this.itemManager);

    // Spawn resources after map initialization
    const currentMap = this.state.maps.get(this.state.currentMapId);
    if (currentMap) {
      this.gatheringSystem.spawnResources(this.state, currentMap.width, currentMap.height);
    }

    // Main game loop: ECS systems + Colyseus sync (60 FPS)
    this.setSimulationInterval(() => {
      const currentTime = Date.now();
      const deltaTime = currentTime - this.lastUpdateTime || 16; // Default to 16ms (60 FPS)

      // Sync Colyseus state to ECS
      this.ecsIntegration.syncWorldToECS(this.state); // TEMPORARILY DISABLED: ECS systems causing excessive errors
      // TODO: Re-enable once ECS component registration is fixed
      // this.ecsIntegration.update(deltaTime);
      // Update wave manager (survivor mechanics)
      this.waveManager.update();

      // Sync ECS state back to Colyseus
      this.ecsIntegration.syncWorldFromECS(this.state);

      // Update legacy systems that haven't been converted to ECS yet
      this.updateNPCs();
      this.updateNPCBehavior();
      this.gatheringSystem.updateResources(this.state);

      this.lastUpdateTime = currentTime;
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
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = message.x;
        player.y = message.y;
        console.log(`Player ${client.sessionId} moved to (${player.x}, ${player.y})`);
        this.broadcast('updatePlayerState', { playerId: client.sessionId, playerState: player });
      }
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
              itemDef.id,
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
  }
  /**
   * Called when a player joins the room
   */
  async onJoin(client: Client, options: any): Promise<void> {
    console.log(`Player ${client.sessionId} joining...`);

    try {
      // Create new player instance
      const player = new Player();
      player.id = client.sessionId;
      player.username =
        options.username || options.name || `Player_${client.sessionId.substring(0, 6)}`;

      // Set starting position (spawn point)
      player.x = 50;
      player.y = 50;

      // Initialize starting stats
      player.health = 100;
      player.maxHealth = 100;
      player.lastActivity = Date.now();

      // Add starter items to inventory
      await this.addStarterItems(player);

      // Add player to room state
      this.state.players.set(client.sessionId, player);

      // Log successful join
      console.log(`✅ Player ${player.username} (${client.sessionId}) joined successfully`);
      console.log(`Room now has ${this.state.players.size} players`);
      // Send welcome message to player (matching test expectations)
      client.send('welcome', {
        message: 'Welcome to RuneScape Discord Game!',
        playerId: client.sessionId,
      });
    } catch (error) {
      console.error(`❌ Error adding player ${client.sessionId}:`, error);
      throw error; // Let Colyseus handle the error
    }
  }
  /**
   * Called when a player leaves the room
   */
  async onLeave(client: Client, consented: boolean): Promise<void> {
    console.log(`Player ${client.sessionId} leaving (consented: ${consented})...`);

    try {
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        console.warn(`Player ${client.sessionId} not found in state during leave`);
        return;
      }

      // Handle inventory drop as loot (simplified)
      if (player.inventory.length > 0) {
        console.log(`💰 Player ${player.username} left with ${player.inventory.length} items`);
        // TODO: Implement loot dropping when LootManager is properly implemented
      }

      // Remove player from room state
      this.state.players.delete(client.sessionId);

      console.log(`✅ Player ${player.username} (${client.sessionId}) left successfully`);
      console.log(`Room now has ${this.state.players.size} players`);
    } catch (error) {
      console.error(`❌ Error removing player ${client.sessionId}:`, error);
      // Don't throw - player should still be removed even if cleanup fails
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
}
