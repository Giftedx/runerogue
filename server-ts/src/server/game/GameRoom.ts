// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for current project goals and persistent AI context.
import { Room, Client } from '@colyseus/core';
import { WorldState, Player, InventoryItem, LootDrop, NPC, Trade, TradeRequestMessage, TradeOfferMessage, TradeAcceptMessage, TradeCancelMessage, CollectLootMessage, EquipItemMessage, DropItemMessage, AreaMap } from './EntitySchemas';
import { MapBlueprintSchema, type MapBlueprint } from './MapBlueprintSchema';
import { ZodError } from 'zod';
import { CombatSystem } from './CombatSystem';
import { ItemManager } from './ItemManager';
import { LootManager } from './LootManager';
import economyIntegration from '../economy-integration';
import { sendDiscordNotification } from '../discord-bot';
import { broadcastPlayerState } from './multiplayerSync';

export class GameRoom extends Room<WorldState> {

  // Method to load, validate, and add a map blueprint
  public loadAndValidateMapBlueprint(blueprintData: unknown, makeCurrent: boolean = true): AreaMap | null {
    try {
      const validatedBlueprint = MapBlueprintSchema.parse(blueprintData) as MapBlueprint;

      // Create AreaMap instance from validated data
      // Note: The AreaMap constructor in EntitySchemas.ts currently auto-generates an ID.
      // If blueprintData.id is preferred, the AreaMap constructor or this logic might need adjustment.
      const newMap = new AreaMap(validatedBlueprint.name, validatedBlueprint.width, validatedBlueprint.height);
      newMap.id = validatedBlueprint.id; // Override auto-generated ID if schema provides one
      newMap.biome = validatedBlueprint.biome || 'plains'; // Set biome, defaulting if necessary
      newMap.collisionMap = validatedBlueprint.collisionMap;

      this.state.maps.set(newMap.id, newMap);
      console.log(`Map blueprint '${newMap.name}' (ID: ${newMap.id}) loaded and validated successfully.`);

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
      collisionMap: Array(15).fill(null).map(() => Array(20).fill(false)), // Example: 15x20 all walkable
      // Example of adding a collision point:
      // collisionMap[5][10] = true;
    };

    // Modify a point for testing collisionMap validation if dimensions mismatch in schema
    // defaultMapBlueprintData.collisionMap[0] = Array(19).fill(false); // This would fail width validation
    // defaultMapBlueprintData.height = 14; // This would fail height validation

    const map = this.loadAndValidateMapBlueprint(defaultMapBlueprintData, true);
    if (map) {
        // Example: Add a collision point to the loaded map
        map.addCollision(5,5); 
        console.log(`Collision added at 5,5 on map ${map.id}`);
        // NPCs could be loaded here based on map data if blueprints included NPC spawns
    } else {
        console.error("Failed to initialize default map. GameRoom may not function correctly without a map.");
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
    console.log("Attempting to load an invalid map blueprint (expect errors):");
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
      { itemId: 'bronze_plate', probability: 0.25, quantity: 1 }
    ]);
    const orc1 = new NPC('orc_1', 'Orc', 15, 15, 'orc', [
      { itemId: 'iron_sword', probability: 0.7, quantity: 1 }
    ]);
    this.state.npcs.set(goblin1.id, goblin1);
    this.state.npcs.set(orc1.id, orc1);

    console.log('Initial NPCs added:', Array.from(this.state.npcs.values()).map(npc => npc.name));

    console.log('GameRoom created:', options);

    this.onMessage('player_action', (client, message) => {
      console.log(`Player action from ${client.sessionId}:`, message);
      const actionResult = this.combatSystem.handlePlayerAction(client.sessionId, message);
      if (actionResult) {
        const { result, targetId } = actionResult;
        // Apply damage to target
        let targetEntity = this.state.npcs.get(targetId) || this.state.players.get(targetId);
        if (targetEntity) {
          targetEntity.health = Math.max(0, targetEntity.health - result.damage);
          broadcastPlayerState(this, targetId, targetEntity);
          // Handle death
          if (targetEntity.health === 0) {
            if (this.state.npcs.has(targetId)) {
              const npc = this.state.npcs.get(targetId)!;
              LootManager.dropLootFromNPC(this.state, npc, npc.lootTable);
              const lootArray = Array.from(this.state.lootDrops.values());
              const newLoot = lootArray[lootArray.length - 1];
              this.broadcast('loot_spawn', newLoot);
              this.broadcast('npc_dead', { npcId: targetId });
              this.state.npcs.delete(targetId);
            } else {
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
    this.onMessage('drop_item', (client, message: DropItemMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return client.send('drop_error', { message: 'Player not found.' });
      const invItem = player.inventory[message.itemIndex];
      if (!invItem) return client.send('drop_error', { message: 'Inventory slot empty.' });
      const quantity = message.quantity || invItem.quantity;
      const lootDrop = LootManager.dropSpecificItem(this.state, player, invItem.itemId, quantity);
      if (lootDrop) {
        this.broadcast('loot_spawn', lootDrop);
        broadcastPlayerState(this, client.sessionId, player);
      }
    });

    // Trade request handler
    this.onMessage('trade_request', (client, message: TradeRequestMessage) => {
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
        trade => (trade.proposerId === player.id || trade.accepterId === player.id) ||
                 (trade.proposerId === targetPlayer.id || trade.accepterId === targetPlayer.id)
      );

      if (existingTrade) {
        client.send('trade_error', { message: 'One of the players is already in a trade.' });
        return;
      }

      const tradeId = `trade_${Date.now()}_${player.id}_${targetPlayer.id}`;
      const newTrade = new Trade(tradeId, player.id, targetPlayer.id);
      this.state.trades.set(tradeId, newTrade);

      // Notify both players
      client.send('trade_request_sent', { tradeId, targetPlayerName: targetPlayer.name });
      this.clients.find(c => c.sessionId === targetPlayer.id)?.send('trade_request_received', {
        tradeId,
        proposerPlayerId: player.id,
        proposerPlayerName: player.name,
      });

      console.log(`Trade request sent from ${player.name} to ${targetPlayer.name} (ID: ${tradeId})`);
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
      playerItems.clear();

      // Validate and add offered items to the trade
      for (const offeredItem of message.offeredItems) {
        const itemDef = await this.itemManager.getItemDefinition(offeredItem.itemId);
        if (!itemDef) {
          client.send('trade_error', { message: `Item ${offeredItem.itemId} not found.` });
          return;
        }

        const playerInventoryItem = player.inventory.find(item => item.itemId === offeredItem.itemId);
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
          const economyProfile = await economyIntegration.getOrCreatePlayerProfile(player.name);
          if (economyProfile && economyProfile.id) {
            await economyIntegration.removeItemFromInventory(economyProfile.id, offeredItem.itemId, offeredItem.quantity);
            console.log(`Synced removal of ${offeredItem.quantity}x ${offeredItem.itemId} from Economy API for player ${economyProfile.id}`);
          }
        } catch (error) {
          console.error(`Failed to sync item removal for ${offeredItem.itemId} from Economy API for player ${player.id}:`, error);
          // Potentially revert in-game inventory changes if API sync fails
        }
      }

      trade.status = 'offered';
      // Notify both players about the updated offer
      const targetPlayer = this.state.players.get(isProposer ? trade.accepterId : trade.proposerId);
      if (targetPlayer) {
        client.send('trade_offer_updated', { tradeId: trade.tradeId, offeredItems: message.offeredItems, isProposer: isProposer });
        this.clients.find(c => c.sessionId === targetPlayer.id)?.send('trade_offer_updated', {
          tradeId: trade.tradeId,
          offeredItems: message.offeredItems,
          isProposer: !isProposer,
        });
      }
      console.log(`Trade offer updated for trade ID ${trade.tradeId} by ${player.name}.`);
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
        client.send('trade_error', { message: 'You are not the intended recipient of this trade offer.' });
        return;
      }

      const proposer = this.state.players.get(trade.proposerId);
      const accepter = this.state.players.get(trade.accepterId);

      if (!proposer || !accepter) {
        client.send('trade_error', { message: 'One or both players not found for trade completion.' });
        return;
      }

      // Transfer items (in-game state)
      // Proposer gives items to accepter
      for (const item of trade.proposerItems) {
        accepter.inventory.push(item);
        // ECONOMY API SYNC: Add items to accepter's economy inventory
        try {
          const economyProfile = await economyIntegration.getOrCreatePlayerProfile(accepter.name);
          if (economyProfile && economyProfile.id) {
            await economyIntegration.addItemToInventory(economyProfile.id, item.itemId, item.quantity);
            console.log(`Synced addition of ${item.quantity}x ${item.itemId} to Economy API for player ${economyProfile.id}`);
          }
        } catch (error) {
          console.error(`Failed to sync item addition for ${item.itemId} to Economy API for player ${accepter.id}:`, error);
        }
      }

      // Accepter gives items to proposer
      for (const item of trade.accepterItems) {
        proposer.inventory.push(item);
        // ECONOMY API SYNC: Add items to proposer's economy inventory
        try {
          const economyProfile = await economyIntegration.getOrCreatePlayerProfile(proposer.name);
          if (economyProfile && economyProfile.id) {
            await economyIntegration.addItemToInventory(economyProfile.id, item.itemId, item.quantity);
            console.log(`Synced addition of ${item.quantity}x ${item.itemId} to Economy API for player ${economyProfile.id}`);
          }
        } catch (error) {
          console.error(`Failed to sync item addition for ${item.itemId} to Economy API for player ${proposer.id}:`, error);
        }
      }

      trade.status = 'completed';
      this.state.trades.delete(trade.tradeId);

      // Notify both players
      client.send('trade_completed', { tradeId: trade.tradeId, message: 'Trade completed successfully!' });
      this.clients.find(c => c.sessionId === trade.proposerId)?.send('trade_completed', {
        tradeId: trade.tradeId,
        message: 'Trade completed successfully!',
      });

      console.log(`Trade ${trade.tradeId} completed between ${proposer.name} and ${accepter.name}.`);
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
            const economyProfile = await economyIntegration.getOrCreatePlayerProfile(proposer.name);
            if (economyProfile && economyProfile.id) {
              await economyIntegration.addItemToInventory(economyProfile.id, item.itemId, item.quantity);
              console.log(`Synced return of ${item.quantity}x ${item.itemId} to Economy API for player ${economyProfile.id}`);
            }
          } catch (error) {
            console.error(`Failed to sync item return for ${item.itemId} to Economy API for player ${proposer.id}:`, error);
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
            const economyProfile = await economyIntegration.getOrCreatePlayerProfile(accepter.name);
            if (economyProfile && economyProfile.id) {
              await economyIntegration.addItemToInventory(economyProfile.id, item.itemId, item.quantity);
              console.log(`Synced return of ${item.quantity}x ${item.itemId} to Economy API for player ${economyProfile.id}`);
            }
          } catch (error) {
            console.error(`Failed to sync item return for ${item.itemId} to Economy API for player ${accepter.id}:`, error);
          }
        }
      }

      trade.status = 'cancelled';
      this.state.trades.delete(trade.tradeId);

      // Notify both players
      client.send('trade_cancelled', { tradeId: trade.tradeId, message: 'Trade cancelled.' });
      if (player.id === trade.proposerId) {
        this.clients.find(c => c.sessionId === trade.accepterId)?.send('trade_cancelled', {
          tradeId: trade.tradeId,
          message: 'Trade cancelled by proposer.',
        });
      } else {
        this.clients.find(c => c.sessionId === trade.proposerId)?.send('trade_cancelled', {
          tradeId: trade.tradeId,
          message: 'Trade cancelled by accepter.',
        });
      }

      console.log(`Trade ${trade.tradeId} cancelled by ${player.name}.`);
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
          economyIntegration.getOrCreatePlayerProfile(player.name)
            .then((profile) => {
              const economyId = profile.id;
              lootDrop.items.forEach((item) => {
                economyIntegration.addItemToInventory(economyId, item.itemId, item.quantity)
                  .catch(err => {
                    console.error(`Failed to sync item ${item.itemId} for player ${economyId}:`, err);
                  });
              });
              // Discord notification
              sendDiscordNotification && sendDiscordNotification(`:tada: ${player.name} collected loot: ${lootDrop.items.map(i => i.name).join(', ')}`);
            })
            .catch(err => {
              console.error(`Failed to resolve economy profile for player ${player.name}:`, err);
            });
        }
        broadcastPlayerState(this, client.sessionId, player);
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
            await economyIntegration.removeItemFromInventory(economyProfile.id, itemId, removedQuantity);
            console.log(`Synced removal of ${removedQuantity}x ${itemId} from Economy API for player ${economyProfile.id}`);
          }
        } catch (error) {
          console.error(`Failed to sync item usage for ${itemId} for player ${player.id}:`, error);
        }
        broadcastPlayerState(this, client.sessionId, player);
      } else {
        console.warn(`Player ${player.id} attempted to use ${itemId} but does not have it or enough quantity.`);
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
      const droppedLoot = LootManager.dropSpecificItem(this.state, player, itemId, quantity);

      if (droppedLoot) {
        // Sync with Economy API
        try {
          const economyProfile = await economyIntegration.getOrCreatePlayerProfile(player.name);
          if (economyProfile && economyProfile.id) {
            await economyIntegration.removeItemFromInventory(economyProfile.id, itemId, quantity);
            console.log(`Synced drop of ${quantity}x ${itemId} from Economy API for player ${economyProfile.id}`);
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
    player.name = `Player ${client.sessionId.substring(0, 4)}`;
    player.x = Math.floor(Math.random() * 10);
    player.y = Math.floor(Math.random() * 10);

    this.state.players.set(client.sessionId, player);

    // Load player inventory from Economy API
    try {
      const economyProfile = await economyIntegration.getOrCreatePlayerProfile(player.name);
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
          console.log(`Player ${player.id} loaded ${player.inventory.length} items from economy inventory.`);
        } else {
          console.log(`Player ${player.id} has no existing economy inventory. Adding starter items.`);
          // Add starter items if no economy inventory exists
          const starterSwordDef = await this.itemManager.getItemDefinition('sword_of_heroes');
          if (starterSwordDef) {
            const starterSword = new InventoryItem(starterSwordDef, 1);
            player.inventory.push(starterSword);
            await economyIntegration.addItemToInventory(economyProfile.id, starterSword.itemId, starterSword.quantity);
          }

          const starterPotionDef = await this.itemManager.getItemDefinition('health_potion');
          if (starterPotionDef) {
            const starterPotion = new InventoryItem(starterPotionDef, 3);
            player.inventory.push(starterPotion);
            await economyIntegration.addItemToInventory(economyProfile.id, starterPotion.itemId, starterPotion.quantity);
          }
        }
      } else {
        console.error(`Failed to get or create economy profile for player ${player.name}.`);
      }
    } catch (error) {
      console.error(`Error loading player inventory from economy for ${player.name}:`, error);
      // Fallback: Add starter items if economy integration fails
      console.log(`Adding starter items due to economy integration failure.`);
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

    broadcastPlayerState(this, client.sessionId, player);

    // Send existing loot drops to new client
    const existingLoot = Array.from(this.state.lootDrops.values());
    client.send('initial_loot', existingLoot);
  }

  async onLeave(client: Client, consented: boolean): Promise<void> {
    if (this.state.players.has(client.sessionId)) {
      console.log(client.sessionId, 'left the room.');
      const player = this.state.players.get(client.sessionId);

      // If player has inventory, create a loot drop using LootManager
      if (player && player.inventory.length > 0) {
        const lootDrop = LootManager.dropLootFromPlayer(this.state, player);
        // ECONOMY API SYNC: Remove dropped items from player's economy inventory
        if (lootDrop && lootDrop.items && lootDrop.items.length > 0) {
          economyIntegration.getOrCreatePlayerProfile(player.name)
            .then(profile => {
              const economyId = profile.id;
              lootDrop.items.forEach((item: InventoryItem) => {
                economyIntegration.removeItemFromInventory(economyId, item.itemId, item.quantity)
                  .then(() => {
                    console.log(`Synced removal of item ${item.itemId} x${item.quantity} from Economy API for player ${economyId}`);
                  })
                  .catch(err => {
                    console.error(`Failed to sync removal of item ${item.itemId} for player ${economyId}:`, err);
                  });
              });
            })
            .catch(err => {
              console.error(`Failed to resolve economy profile for player ${player.name}:`, err);
            });
        }
      }

      this.state.players.delete(client.sessionId);
    }

    try {
      if (consented) {
        throw new Error('player consented to leave');
      }

      console.log('waiting for reconnection for', client.sessionId);
      const newClient = await this.allowReconnection(client, 10);
      console.log('reconnected!', newClient.sessionId);

      // Update client sessionId for the reconnected player
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.id = newClient.sessionId;
        this.state.players.delete(client.sessionId);
        this.state.players.set(newClient.sessionId, player);
        broadcastPlayerState(this, newClient.sessionId, player);
      }

    } catch (e) {
      console.log(client.sessionId, 'could not reconnect.', e.message);
      this.state.players.delete(client.sessionId);
    }
  }

  onDispose(): void {
    console.log('GameRoom disposed.');
  }

  private updateNPCs(): void {
    // Iterate over each NPC and update its position randomly
    this.state.npcs.forEach((npc) => {
      const deltaX = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const deltaY = Math.floor(Math.random() * 3) - 1;
      // Update NPC position, ensuring they don't go negative (could add upper bounds as needed)
      npc.x = Math.max(0, npc.x + deltaX);
      npc.y = Math.max(0, npc.y + deltaY);
    });
    console.log('Updated NPC positions:', Array.from(this.state.npcs.values()).map(npc => ({ id: npc.id, x: npc.x, y: npc.y })));
  }

  private updateNPCBehavior(): void {
    // Iterate over each NPC
    this.state.npcs.forEach((npc) => {
      // For each player, check if they are within attack range (using Manhattan distance)
      this.state.players.forEach((player) => {
        const distance = Math.abs(npc.x - player.x) + Math.abs(npc.y - player.y);
        if (distance <= 2) {
          this.npcAttack(npc, player);
          broadcastPlayerState(this, player.id, player);
        }
      });
    });
    console.log('Updated NPC behavior - checked for nearby players to attack.');
  }

  private npcAttack(npc: NPC, player: Player): void {
    // NPC deals random damage between 8 and 12
    const damage = 8 + Math.floor(Math.random() * 5);
    player.health = Math.max(0, player.health - damage);
    console.log(`NPC ${npc.name} attacked Player ${player.id} for ${damage} damage. Player health is now ${player.health}.`);
  }
}
