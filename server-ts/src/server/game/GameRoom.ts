// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for current project goals and persistent AI context.
import { Client, Room } from '@colyseus/core';
import { ZodError } from 'zod';
import { sendDiscordNotification, sendGameEventNotification } from '../discord-bot';
import economyIntegration from '../economy-integration';
import { CombatSystem } from './CombatSystem';
import {
  AreaMap,
  ArraySchema,
  CollectLootMessage,
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
import { ItemManager } from './ItemManager';
import { LootManager } from './LootManager';
import { MapBlueprintSchema, type MapBlueprint } from './MapBlueprintSchema';
import { broadcastPlayerState } from './multiplayerSync';

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

    // Example of an invalid blueprint for testing
    const invalidBlueprintData = {
      id: 'invalid_map_002',
      name: 'Broken Lands',
      width: -10, // Invalid width
      height: 10,
      // collisionMap missing - will fail schema validation
    };
    console.log('Attempting to load an invalid map blueprint (expect errors):');
    this.loadAndValidateMapBlueprint(invalidBlueprintData, false);
  }

  maxClients = 4;
  private combatSystem!: CombatSystem;
  private itemManager!: ItemManager;

  onCreate(options: any): void {
    this.setState(new WorldState());
    this.initializeDefaultMap(); // Initialize with a default or sample map
    this.combatSystem = new CombatSystem(this.state);
    this.itemManager = ItemManager.getInstance();

    // Start simulation loop: move NPCs and process combat every second
    this.setSimulationInterval(() => {
      // Update NPC positions randomly
      this.updateNPCs();
      // Determine NPC behaviors and attacks
      this.updateNPCBehavior();
      // Process any queued combat actions
      this.combatSystem.process(Date.now());
    }, 1000);

    // Add some initial NPCs with structured loot tables
    const goblin1 = new NPC('goblin_1', 'Goblin', 5, 5, 'goblin', [
      { itemId: 'bronze_sword', probability: 0.5, quantity: 1 },
      { itemId: 'bronze_plate', probability: 0.25, quantity: 1 },
    ]);
    const orc1 = new NPC('orc_1', 'Orc', 15, 15, 'orc', [
      { itemId: 'iron_sword', probability: 0.7, quantity: 1 },
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
          broadcastPlayerState(this, targetId, targetEntity);
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
                  if (itemDef && (
                    itemDef.baseValue > 10000 || 
                    itemDef.name.toLowerCase().includes('dragon') ||
                    itemDef.name.toLowerCase().includes('rune') ||
                    itemDef.name.toLowerCase().includes('unique')
                  )) {
                    sendGameEventNotification('rare_drop', {
                      playerName: this.state.players.get(client.sessionId)?.username || 'Unknown',
                      itemName: itemDef.name,
                      source: npc.name,
                      dropRate: 100 // Mock drop rate for now
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
                  combatLevel: deadPlayer.combatLevel || 1
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
        }
        // Broadcast updated health or other state to both
        const attackerState = this.state.players.get(client.sessionId);
        if (attackerState) broadcastPlayerState(this, client.sessionId, attackerState);
        const defenderState = this.state.players.get(targetId);
        if (defenderState) broadcastPlayerState(this, targetId, defenderState);
      }
    });

    this.onMessage('player_movement', (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = message.x;
        player.y = message.y;
        console.log(`Player ${client.sessionId} moved to (${player.x}, ${player.y})`);
        broadcastPlayerState(this, client.sessionId, player);
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
      broadcastPlayerState(this, client.sessionId, player);
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
        broadcastPlayerState(this, client.sessionId, player);
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
      const playerItems = isProposer ? trade.proposerItems : trade.accepterItems;

      // Clear previous offer if any
      playerItems.length = 0;

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

        // Add item to trade object
        playerItems.push(new InventoryItem(itemDef, offeredItem.quantity));

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
      const proposerFinalInventorySize = proposer.inventory.length - trade.proposerItems.length + trade.accepterItems.length;
      if (proposerFinalInventorySize > MAX_INVENTORY_SIZE) {
        client.send('trade_error', { message: 'Proposer does not have enough inventory space.' });
        this.clients
          .find(c => c.sessionId === trade.proposerId)
          ?.send('trade_error', { message: 'You do not have enough inventory space for this trade.' });
        return;
      }

      // Check if accepter has space for proposer's items
      const accepterFinalInventorySize = accepter.inventory.length - trade.accepterItems.length + trade.proposerItems.length;
      if (accepterFinalInventorySize > MAX_INVENTORY_SIZE) {
        client.send('trade_error', { message: 'You do not have enough inventory space for this trade.' });
        this.clients
          .find(c => c.sessionId === trade.proposerId)
          ?.send('trade_error', { message: 'Accepter does not have enough inventory space.' });
        return;
      }

      // Double-check that all offered items still exist in inventories
      // This prevents item duplication exploits
      for (const item of trade.proposerItems) {
        const invItem = proposer.inventory.find(i => i.itemId === item.itemId && i.quantity >= item.quantity);
        if (!invItem) {
          client.send('trade_error', { message: 'Trade failed: Proposer no longer has all offered items.' });
          this.clients
            .find(c => c.sessionId === trade.proposerId)
            ?.send('trade_error', { message: 'Trade failed: You no longer have all offered items.' });
          // Cancel the trade and return items
          this.cancelTradeAndReturnItems(trade);
          return;
        }
      }

      for (const item of trade.accepterItems) {
        const invItem = accepter.inventory.find(i => i.itemId === item.itemId && i.quantity >= item.quantity);
        if (!invItem) {
          client.send('trade_error', { message: 'Trade failed: You no longer have all offered items.' });
          this.clients
            .find(c => c.sessionId === trade.proposerId)
            ?.send('trade_error', { message: 'Trade failed: Accepter no longer has all offered items.' });
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
      const proposerItemsStr = trade.proposerItems.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Nothing';
      const accepterItemsStr = trade.accepterItems.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Nothing';
      
      sendGameEventNotification('trade_completed', {
        player1: proposer.username,
        player2: accepter.username,
        player1Items: proposerItemsStr,
        player2Items: accepterItemsStr
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
          // ECONOMY API SYNC: Add items back to accepter's economy inventory
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
                `Synced return of ${item.quantity}x ${item.itemId} to Economy API for player ${economyProfile.id}`
              );
            } else {
              console.warn(`Missing economy profile or item definition for item ${item.itemId}`);
            }
          } catch (error) {
            console.error(
              `Failed to sync item return for ${item.itemId} to Economy API for player ${accepter.id}:`,
              error
            );
          }
        }
      }

      trade.status = 'cancelled';
      this.state.trades.delete(trade.tradeId);

      // Notify both players
      client.send('trade_cancelled', { tradeId: trade.tradeId, message: 'Trade cancelled.' });
      if (player.id === trade.proposerId) {
        this.clients
          .find(c => c.sessionId === trade.accepterId)
          ?.send('trade_cancelled', {
            tradeId: trade.tradeId,
            message: 'Trade cancelled by proposer.',
          });
      } else {
        this.clients
          .find(c => c.sessionId === trade.proposerId)
          ?.send('trade_cancelled', {
            tradeId: trade.tradeId,
            message: 'Trade cancelled by accepter.',
          });
      }

      console.log(`Trade ${trade.tradeId} cancelled by ${player.username}.`);

      // Validate state after trade cancellation
      this.validateStateIntegrity();
    });

    // Collect loot handler
    this.onMessage('collect_loot', (client, message: CollectLootMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        client.send('collect_loot_error', { message: 'Player not found.' });
        return;
      }
      const success = LootManager.collectLoot(this.state, player, message.lootId);
      if (success) {
        client.send('collect_loot_result', { lootId: message.lootId, inventory: player.inventory });
        broadcastPlayerState(this, client.sessionId, player);
        sendDiscordNotification(`Player ${player.username} collected loot ${message.lootId}`);
      } else {
        client.send('collect_loot_error', { message: 'Loot not found or already collected.' });
      }
    });

    // Loot collection handler
    this.onMessage('collect_loot', (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        console.warn(`Player ${client.sessionId} not found for loot collection.`);
        return;
      }
      const lootId = message.lootId;
      const lootDrop = this.state.lootDrops.get(lootId);
      if (!lootDrop) {
        console.warn(`Loot drop ${lootId} not found.`);
        return;
      }
      // Optional: Validate player is near the loot drop
      const dx = Math.abs(player.x - lootDrop.x);
      const dy = Math.abs(player.y - lootDrop.y);
      if (dx > 2 || dy > 2) {
        console.warn(`Player ${player.id} is too far from loot drop ${lootId}.`);
        return;
      }
      const result = LootManager.collectLoot(this.state, player, lootId);
      if (result) {
        console.log(`Player ${player.id} collected loot ${lootId}.`);
        // ECONOMY API SYNC: Add collected items to player's economy inventory
        // Assume lootDrop still contains the items (if not, store items before collection)
        if (lootDrop && lootDrop.items && lootDrop.items.length > 0) {
          economyIntegration
            .getOrCreatePlayerProfile(player.username)
            .then(profile => {
              const economyId = profile.id;
              lootDrop.items.forEach(async item => {
                const itemDef = await this.itemManager.getItemDefinition(item.itemId);
                if (itemDef && itemDef.id) {
                  economyIntegration
                    .addItemToInventory(economyId, itemDef.id, item.quantity)
                    .catch(err => {
                      console.error(
                        `Failed to sync item ${item.itemId} for player ${economyId}:`,
                        err
                      );
                    });
                } else {
                  console.warn(`Missing item definition for loot item ${item.itemId}`);
                }
              });
              // Discord notification
              sendDiscordNotification &&
                sendDiscordNotification(
                  `:tada: ${player.username} collected loot: ${lootDrop.items.map(i => i.name).join(', ')}`
                );
            })
            .catch(err => {
              console.error(
                `Failed to resolve economy profile for player ${player.username}:`,
                err
              );
            });
        }
        broadcastPlayerState(this, client.sessionId, player);

        // Validate state after loot collection
        this.validateStateIntegrity();
      } else {
        console.warn(`Player ${player.id} failed to collect loot ${lootId}.`);
      }
    });

    // Handler for using an item
    this.onMessage('use_item', async (client, message: { itemId: string; quantity?: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        console.warn(`Player ${client.sessionId} not found for item usage.`);
        return;
      }

      const { itemId, quantity = 1 } = message;
      let removedQuantity = 0;
      let itemIndex = -1;

      // Find and remove item from player's inventory
      for (let i = 0; i < player.inventory.length; i++) {
        if (player.inventory[i].itemId === itemId) {
          itemIndex = i;
          if (player.inventory[i].quantity > quantity) {
            player.inventory[i].quantity -= quantity;
            removedQuantity = quantity;
          } else {
            removedQuantity = player.inventory[i].quantity;
            player.inventory.splice(i, 1);
          }
          break;
        }
      }

      if (removedQuantity > 0) {
        console.log(`Player ${player.id} used ${removedQuantity}x ${itemId}.`);
        // Sync with Economy API
        try {
          const economyProfile = await economyIntegration.getOrCreatePlayerProfile(player.name);
          if (economyProfile && economyProfile.id) {
            await economyIntegration.removeItemFromInventory(
              economyProfile.id,
              itemId,
              removedQuantity
            );
            console.log(
              `Synced removal of ${removedQuantity}x ${itemId} from Economy API for player ${economyProfile.id}`
            );
          }
        } catch (error) {
          console.error(`Failed to sync item usage for ${itemId} for player ${player.id}:`, error);
        }
        broadcastPlayerState(this, client.sessionId, player);
      } else {
        console.warn(
          `Player ${player.id} attempted to use ${itemId} but does not have it or enough quantity.`
        );
      }
    });

    // Handler for dropping an item
    this.onMessage('drop_item', async (client, message: { itemId: string; quantity?: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        console.warn(`Player ${client.sessionId} not found for item drop.`);
        return;
      }

      const { itemId, quantity = 1 } = message;

      // Drop item using LootManager
      const droppedLoot = await LootManager.dropSpecificItem(this.state, player, itemId, quantity);

      if (droppedLoot) {
        // Sync with Economy API
        try {
          const economyProfile = await economyIntegration.getOrCreatePlayerProfile(player.name);
          if (economyProfile && economyProfile.id) {
            await economyIntegration.removeItemFromInventory(economyProfile.id, itemId, quantity);
            console.log(
              `Synced drop of ${quantity}x ${itemId} from Economy API for player ${economyProfile.id}`
            );
          }
        } catch (error) {
          console.error(`Failed to sync item drop for ${itemId} for player ${player.id}:`, error);
        }
        broadcastPlayerState(this, client.sessionId, player);
      } else {
        console.warn(`Player ${player.id} failed to drop ${quantity}x ${itemId}.`);
      }
    });

    // Schedule NPC movement update loop
    // setInterval(() => {
    //   this.updateNPCs();
    //   this.updateNPCBehavior();
    // }, 1000);
  }

  async onJoin(client: Client, options: any): Promise<void> {
    console.log(client.sessionId, 'joined the room!', options);

    const player = new Player();
    player.id = client.sessionId;
    // Use options.name if provided, else fallback to default
    player.username =
      typeof options?.name === 'string' && options.name.trim().length > 0
        ? options.name.trim()
        : `Player ${client.sessionId.substring(0, 4)}`;
    player.x = Math.floor(Math.random() * 10);
    player.y = Math.floor(Math.random() * 10);

    this.state.players.set(client.sessionId, player);

    // Validate state after player joins
    this.validateStateIntegrity();

    // Load player inventory from Economy API
    try {
      const economyProfile = await economyIntegration.getOrCreatePlayerProfile(player.username);
      if (economyProfile && economyProfile.id) {
        const economyInventory = await economyIntegration.getPlayerInventory(economyProfile.id);
        if (economyInventory && economyInventory.length > 0) {
          for (const ecoItem of economyInventory) {
            const itemDef = await this.itemManager.getItemDefinition(ecoItem.itemId);
            if (itemDef) {
              const inventoryItem = new InventoryItem(itemDef, ecoItem.quantity);
              player.inventory.push(inventoryItem);
            } else {
              console.warn(`Item definition not found for economy item ID: ${ecoItem.itemId}`);
            }
          }
          console.log(
            `Player ${player.username} (${player.id}) loaded ${player.inventory.length} items from economy inventory.`
          );
        } else {
          console.log(
            `Player ${player.username} (${player.id}) has no existing economy inventory. Adding starter items.`
          );

          // ========== DEBUG LOGGING: STARTER ITEMS ==========
          console.log(`🔍 DEBUG: Player inventory before adding starter items:`, {
            inventoryLength: player.inventory.length,
            inventoryConstructor: player.inventory.constructor.name,
            inventoryType: typeof player.inventory,
            inventoryMetadata: player.inventory['Symbol(Symbol.metadata)'] !== undefined,
          });

          // Add starter items if no economy inventory exists
          const starterSwordDef = await this.itemManager.getItemDefinition('starter_sword');
          console.log(`🔍 DEBUG: starterSwordDef:`, {
            def: starterSwordDef,
            defType: typeof starterSwordDef,
            defConstructor: starterSwordDef?.constructor?.name,
          });

          if (starterSwordDef) {
            const starterSword = new InventoryItem(starterSwordDef, 1);
            console.log(`🔍 DEBUG: Created starterSword:`, {
              starterSword,
              constructor: starterSword.constructor.name,
              metadata: starterSword['Symbol(Symbol.metadata)'] !== undefined,
              itemId: starterSword.itemId,
              quantity: starterSword.quantity,
            });

            console.log(`🔍 DEBUG: About to push starterSword to inventory...`);
            player.inventory.push(starterSword);
            console.log(
              `🔍 DEBUG: Pushed starterSword, inventory length now: ${player.inventory.length}`
            );

            if (economyIntegration) {
              await economyIntegration.addItemToInventory(
                economyProfile.id,
                starterSword.itemId,
                starterSword.quantity
              );
            }
          }

          const starterShieldDef = await this.itemManager.getItemDefinition('starter_shield');
          console.log(`🔍 DEBUG: starterShieldDef:`, {
            def: starterShieldDef,
            defType: typeof starterShieldDef,
            defConstructor: starterShieldDef?.constructor?.name,
          });

          if (starterShieldDef) {
            const starterShield = new InventoryItem(starterShieldDef, 1);
            console.log(`🔍 DEBUG: Created starterShield:`, {
              starterShield,
              constructor: starterShield.constructor.name,
              metadata: starterShield['Symbol(Symbol.metadata)'] !== undefined,
              itemId: starterShield.itemId,
              quantity: starterShield.quantity,
            });

            console.log(`🔍 DEBUG: About to push starterShield to inventory...`);
            player.inventory.push(starterShield);
            console.log(
              `🔍 DEBUG: Pushed starterShield, inventory length now: ${player.inventory.length}`
            );
            console.log(`🔍 DEBUG: Final inventory state:`, {
              inventoryLength: player.inventory.length,
              inventoryItems: player.inventory.map((item, i) => ({
                index: i,
                constructor: item?.constructor?.name,
                metadata: item?.['Symbol(Symbol.metadata)'] !== undefined,
                itemId: item?.itemId,
              })),
            });
            // ========== DEBUG LOGGING: STARTER ITEMS END ==========

            if (economyIntegration) {
              await economyIntegration.addItemToInventory(
                economyProfile.id,
                starterShield.itemId,
                starterShield.quantity
              );
            }
          }
        }
      } else {
        console.error(`Failed to get or create economy profile for player ${player.username}.`);
      }
    } catch (error) {
      console.error(`Error loading player inventory from economy for ${player.username}:`, error);
      // Fallback: Add starter items if economy integration fails
      console.log(
        `Adding starter items due to economy integration failure for ${player.username}.`
      );
      const starterSwordDef = await this.itemManager.getItemDefinition('sword_of_heroes');
      if (starterSwordDef) {
        const starterSword = new InventoryItem(starterSwordDef, 1);
        player.inventory.push(starterSword);
      }

      const starterPotionDef = await this.itemManager.getItemDefinition('health_potion');
      if (starterPotionDef) {
        const starterPotion = new InventoryItem(starterPotionDef, 3);
        player.inventory.push(starterPotion);
      }
    }

    // Validate state after player inventory setup
    this.validateStateIntegrity();

    broadcastPlayerState(this, client.sessionId, player);

    // Send welcome message to the client
    client.send('welcome', {
      message: 'Welcome to RuneScape Discord Game!',
      playerId: client.sessionId,
    });

    // Send existing loot drops to new client
    const existingLoot = Array.from(this.state.lootDrops.values());
    client.send('initial_loot', existingLoot);
  }

  async onLeave(client: Client, consented: boolean): Promise<void> {
    // First, check and remove the player from state to avoid serialization issues
    if (this.state.players.has(client.sessionId)) {
      try {
        // Cache player reference and information before removing from state
        const player = this.state.players.get(client.sessionId);
        const playerName = player ? player.username : 'unknown';

        // Check if player has items
        const hasItems = player && player.inventory && player.inventory.length > 0;

        // First, remove the player from state to avoid serialization issues in broadcasts
        this.state.players.delete(client.sessionId);

        // Broadcast the player left event with minimal data
        this.broadcast('player_left', { playerId: client.sessionId });

        // After player is removed, handle loot drop if not reconnecting
        if (!consented && hasItems && player) {
          try {
            // Create a loot drop for the player's inventory
            const lootDrop = await LootManager.dropLootFromPlayer(this.state, player);

            // Sync with economy API if integration is available
            if (lootDrop && lootDrop.items && lootDrop.items.length > 0 && economyIntegration) {
              try {
                const profile = await economyIntegration.getOrCreatePlayerProfile(playerName);
                if (profile && profile.id) {
                  const economyId = profile.id;

                  // Process items one by one with await to ensure proper completion
                  for (const item of lootDrop.items) {
                    try {
                      if (typeof economyIntegration.removeItemFromInventory === 'function') {
                        await economyIntegration.removeItemFromInventory(
                          economyId,
                          item.itemId,
                          item.quantity
                        );
                      }
                    } catch (error) {
                      // Silently log errors but continue processing
                      console.error(`Economy sync error: ${(error as Error).message}`);
                    }
                  }
                }
              } catch (error) {
                // Silently log errors but continue processing
                console.error(`Player profile error: ${(error as Error).message}`);
              }
            }
          } catch (error) {
            // Log loot drop errors but continue
            console.error(`Loot drop error: ${(error as Error).message}`);
          }
        }

        // Handle reconnection
        if (consented) {
          try {
            console.log('waiting for reconnection for', client.sessionId);
            const newClient = await this.allowReconnection(client, 10);
            console.log('reconnected!', newClient.sessionId);

            // Store player in a temporary variable for reconnection
            if (!this.state.players.has(newClient.sessionId) && player) {
              player.id = newClient.sessionId;
              this.state.players.set(newClient.sessionId, player);

              // Use imported broadcast function instead of broadcastPlayerState
              this.broadcast('player_rejoined', {
                playerId: newClient.sessionId,
                x: player.x,
                y: player.y,
              });
            }
          } catch (error) {
            // Player couldn't reconnect, handle as a normal leave
            console.error(`Reconnection failed: ${(error as Error).message}`);
          }
        }
      } catch (error) {
        // Ensure player is removed even if an error occurs
        console.error(`Error in onLeave: ${(error as Error).message}`);
        this.state.players.delete(client.sessionId);
      }
    }
  }

  onDispose(): void {
    console.log('GameRoom disposed.');
  }

  private updateNPCs(): void {
    // Iterate over each NPC and update its position randomly
    this.state.npcs.forEach(npc => {
      const deltaX = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const deltaY = Math.floor(Math.random() * 3) - 1;
      // Update NPC position, ensuring they don't go negative (could add upper bounds as needed)
      npc.x = Math.max(0, npc.x + deltaX);
      npc.y = Math.max(0, npc.y + deltaY);
    });
    console.log(
      'Updated NPC positions:',
      Array.from(this.state.npcs.values()).map(npc => ({ id: npc.id, x: npc.x, y: npc.y }))
    );
  }

  private updateNPCBehavior(): void {
    // Iterate over each NPC
    this.state.npcs.forEach(npc => {
      // For each player, check if they are within attack range (using Manhattan distance)
      this.state.players.forEach(player => {
        const distance = Math.abs(npc.x - player.x) + Math.abs(npc.y - player.y);
        if (distance <= 2) {
          this.npcAttack(npc, player);
          this.broadcast('player_state', {
            playerId: player.id,
            health: player.health,
            x: player.x,
            y: player.y,
          });
        }
      });
    });
    console.log('Updated NPC behavior - checked for nearby players to attack.');
  }

  private npcAttack(npc: NPC, player: Player): void {
    // NPC deals random damage between 8 and 12
    const damage = 8 + Math.floor(Math.random() * 5);
    player.health = Math.max(0, player.health - damage);
    console.log(
      `NPC ${npc.name} attacked Player ${player.id} for ${damage} damage. Player health is now ${player.health}.`
    );
  }

  /**
   * Validates the integrity of the game state by checking for undefined values in schema objects
   */
  private validateStateIntegrity(): void {
    // eslint-disable-next-line no-console
    console.log('🔍 Validating state integrity...');

    // Check players
    this.state.players.forEach((player, sessionId) => {
      if (!player) {
        // eslint-disable-next-line no-console
        console.error(`❌ Player ${sessionId} is undefined!`);
        return;
      }

      // Check player inventory
      if (!player.inventory) {
        // eslint-disable-next-line no-console
        console.error(`❌ Player ${sessionId} has undefined inventory!`);
      } else {
        player.inventory.forEach((item, index) => {
          if (!item) {
            // eslint-disable-next-line no-console
            console.error(`❌ Player ${sessionId} has undefined item at index ${index}!`);
          } else if (typeof item !== 'object' || item.constructor.name !== 'InventoryItem') {
            // eslint-disable-next-line no-console
            console.error(
              `❌ Player ${sessionId} has non-InventoryItem object at index ${index}:`,
              {
                type: typeof item,
                constructor: item.constructor?.name,
                item: item,
              }
            );
          }
        });
      }
    });

    // Check trades
    this.state.trades.forEach((trade, tradeId) => {
      if (!trade) {
        // eslint-disable-next-line no-console
        console.error(`❌ Trade ${tradeId} is undefined!`);
        return;
      }

      if (!trade.proposerItems) {
        // eslint-disable-next-line no-console
        console.error(`❌ Trade ${tradeId} has undefined proposerItems!`);
      } else {
        trade.proposerItems.forEach((item, index) => {
          if (!item) {
            // eslint-disable-next-line no-console
            console.error(`❌ Trade ${tradeId} has undefined proposer item at index ${index}!`);
          }
        });
      }

      if (!trade.accepterItems) {
        // eslint-disable-next-line no-console
        console.error(`❌ Trade ${tradeId} has undefined accepterItems!`);
      } else {
        trade.accepterItems.forEach((item, index) => {
          if (!item) {
            // eslint-disable-next-line no-console
            console.error(`❌ Trade ${tradeId} has undefined accepter item at index ${index}!`);
          }
        });
      }
    });

    // Check loot drops
    this.state.lootDrops.forEach((lootDrop, lootId) => {
      if (!lootDrop) {
        // eslint-disable-next-line no-console
        console.error(`❌ LootDrop ${lootId} is undefined!`);
        return;
      }

      if (!lootDrop.items) {
        // eslint-disable-next-line no-console
        console.error(`❌ LootDrop ${lootId} has undefined items!`);
      } else {
        lootDrop.items.forEach((item, index) => {
          if (!item) {
            // eslint-disable-next-line no-console
            console.error(`❌ LootDrop ${lootId} has undefined item at index ${index}!`);
          }
        });
      }
    });

    // eslint-disable-next-line no-console
    console.log('✅ State integrity validation complete');
  }

  /**
   * Helper method to cancel a trade and return all items to their owners
   */
  private async cancelTradeAndReturnItems(trade: Trade): Promise<void> {
    // Return proposer's items
    const proposer = this.state.players.get(trade.proposerId);
    if (proposer) {
      for (const item of trade.proposerItems) {
        // Find existing stack or add new item
        const existingItem = proposer.inventory.find(i => i.itemId === item.itemId && i.isStackable);
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          proposer.inventory.push(new InventoryItem(item, item.quantity));
        }
      }
    }

    // Return accepter's items
    const accepter = this.state.players.get(trade.accepterId);
    if (accepter) {
      for (const item of trade.accepterItems) {
        // Find existing stack or add new item
        const existingItem = accepter.inventory.find(i => i.itemId === item.itemId && i.isStackable);
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          accepter.inventory.push(new InventoryItem(item, item.quantity));
        }
      }
    }

    // Remove the trade
    this.state.trades.delete(trade.tradeId);
  }

  /**
   * Start a timeout for a trade - trades expire after 2 minutes of inactivity
   */
  private startTradeTimeout(tradeId: string): void {
    const TRADE_TIMEOUT = 120000; // 2 minutes
    
    setTimeout(() => {
      const trade = this.state.trades.get(tradeId);
      if (trade && trade.status !== 'completed') {
        // Notify both players
        const proposerClient = this.clients.find(c => c.sessionId === trade.proposerId);
        const accepterClient = this.clients.find(c => c.sessionId === trade.accepterId);
        
        proposerClient?.send('trade_timeout', { 
          tradeId, 
          message: 'Trade timed out due to inactivity.' 
        });
        accepterClient?.send('trade_timeout', { 
          tradeId, 
          message: 'Trade timed out due to inactivity.' 
        });
        
        // Cancel and return items
        this.cancelTradeAndReturnItems(trade);
        
        console.log(`Trade ${tradeId} timed out and was cancelled.`);
      }
    }, TRADE_TIMEOUT);
  }
}
