// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for current project goals and persistent AI context.
import { Room, Client } from '@colyseus/core';
import { GameState, Player, InventoryItem, LootDrop, NPC } from './EntitySchemas';
import { CombatSystem } from './CombatSystem';
import { ItemManager } from './ItemManager';
import { LootManager } from './LootManager';
import economyIntegration from '../economy-integration';
import { sendDiscordNotification } from '../discord-bot';
import { broadcastPlayerState } from './multiplayerSync';

export class GameRoom extends Room<GameState> {
  maxClients = 4;
  private combatSystem!: CombatSystem;
  private itemManager!: ItemManager;

  onCreate(options: any): void {
    this.setState(new GameState());
    this.combatSystem = new CombatSystem(this.state);
    this.itemManager = ItemManager.getInstance();

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
      this.combatSystem.handlePlayerAction(client.sessionId, message);
      broadcastPlayerState(this, client.sessionId, this.state.players.get(client.sessionId));
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
    // Other message handlers can be added here

    // Schedule NPC movement update loop
    setInterval(() => {
      this.updateNPCs();
      this.updateNPCBehavior();
    }, 1000);
  }

  onJoin(client: Client, options: any): void {
    console.log(client.sessionId, 'joined the room!', options);

    const player = new Player();
    player.id = client.sessionId;
    player.name = `Player ${client.sessionId.substring(0, 4)}`;
    player.x = Math.floor(Math.random() * 10);
    player.y = Math.floor(Math.random() * 10);

    // Add starter items
    const starterSwordDef = this.itemManager.getItemDefinition('sword_of_heroes');
    if (starterSwordDef) {
      const starterSword = new InventoryItem(starterSwordDef, 1);
      player.inventory.push(starterSword);
    }

    const starterPotionDef = this.itemManager.getItemDefinition('health_potion');
    if (starterPotionDef) {
      const starterPotion = new InventoryItem(starterPotionDef, 3);
      player.inventory.push(starterPotion);
    }

    this.state.players.set(client.sessionId, player);
    broadcastPlayerState(this, client.sessionId, player);
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
