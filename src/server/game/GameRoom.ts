import 'reflect-metadata';
import { type } from '@colyseus/schema';
import {
  PlayerActionMessage,
  EquipItemMessage,
  DropItemMessage,
  CollectLootMessage,
} from './EntitySchemas';
import { Room, Client } from '@colyseus/core';

/**
 * Interface for player join options
 */
interface JoinOptions {
  name?: string;
}

import { InventoryItem, LootDrop, Player, GameState, LootDropMessage } from './EntitySchemas';
import { CombatSystem } from './CombatSystem';

// Re-export the type decorator
export { type };

// ==========================================
// Interface Declarations
// ==========================================

/**
 * Interface for player movement messages
 */

/**
 * Interface for player action messages
 */

/**
 * Interface for loot drop messages
 */

/**
 * Interface for inventory item
 */

/**
 * Interface for player skills
 */

/**
 * Interface for player join options
 */

/**
 * Interface for room metadata
 */

// Define type mappings for schema serialization

// ==========================================
// Schema Classes
// ==========================================

/**
 * Skill class for player skills
 */


/**
 * Skills collection class
 */


/**
 * Game state class for the room
 */
// Forward declarations for schema types - these are just placeholders
// Removed to avoid duplicate class declarations
// (Duplicate Player and LootDrop classes removed above)

// --- Schema Classes: InventoryItem and Equipment must be defined before LootDrop and Player ---
/**
 * Inventory item class
 */
// --- Moved InventoryItem above LootDrop for correct usage order ---

  

/**
 * Equipment class
 */

  

/**
 * Loot drop class
 */

  

/**
 * GameRoom class that extends Colyseus Room
 */
export class GameRoom extends Room<GameState> {
  /**
   * Add starter items to a player (stub)
   */
  protected addStarterItems(_player: Player): void {
    // TODO: Implement starter item assignment
  }  /**
   * Drop all items in a player's inventory as loot (stub)
   */
  protected dropPlayerInventory(_player: Player): void {
    // TODO: Implement inventory drop logic
  }

  /**
   * Create a loot drop at a location (stub)
   */
  protected createLootDrop(_items: InventoryItem[], _x: number, _y: number): LootDrop {
    // TODO: Implement loot drop creation logic
    return new LootDrop();
  }

  private intervals: NodeJS.Timeout[] = [];
  private lootExpiration = 300000; // 5 minutes in ms
  private idleTimeout = 600000; // 10 minutes in ms
  private autoLootPickup = true;
  private lootPickupRadius = 50; // pixels


    onCreate(_options: any): void {
    this.setGameState(new GameState());


    // Register message handlers
    this.onMessage('action', this.handleAction.bind(this));
    this.onMessage('equipItem', this.handleEquipItem.bind(this));
    this.onMessage('dropItem', this.handleDropItem.bind(this));
    this.onMessage('collectLoot', this.handleCollectLoot.bind(this));

    // Set up game loops
    this.intervals.push(
      setInterval(() => this.processCombat(), 100),
      setInterval(() => this.updatePlayerStates(), 50),
      setInterval(() => this.checkIdlePlayers(), 60000)
    );

    // Set up loot cleanup
    this.intervals.push(
      setInterval(() => this.cleanupLoot(), 60000)
    );

    // TODO: Replace with proper logging framework in production
// console.log('Game room created!');
  }
  
  // Helper method to set game state (workaround for TypeScript error)
  private setGameState(state: GameState): void {
    (this as any).setState(state);
  }

  /**
   * When client joins the room
   */
  onJoin(client: Client, options: JoinOptions) {
    // TODO: Replace with proper logging framework in production
// console.log(`Client ${client.sessionId} joined!`);

    // Create a new player instance
    const player = new Player();
    player.id = client.sessionId;
    player.username = options.name || `Player ${client.sessionId.substr(0, 4)}`;
    player.x = Math.floor(Math.random() * 400) + 100;
    player.y = Math.floor(Math.random() * 400) + 100;
    player.lastActivity = Date.now();

    // Add player to the room state
    this.state.players.set(client.sessionId, player);

    // Add starter items to the player
    this.addStarterItems(player);

    // TODO: Replace with proper logging framework in production
// console.log(`Player ${player.username} joined with id ${player.id}`);
  }

  /**
   * When client leaves the room
   */
  onLeave(_client: Client, _consented: boolean) {
    // Clear all intervals to prevent memory leaks
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  // Player action handler
  private handleAction(client: Client, message: PlayerActionMessage) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // TODO: Implement action handling (e.g., combat, interaction, etc.)
    // For now, just log the action
    console.log(`Player ${client.sessionId} performed action: ${message.type}`);

    // Check for nearby loot (non-combat logic remains here)
    this.checkForNearbyLoot(player, client);
  }

    private handleEquipItem(client: Client, message: EquipItemMessage) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    
    const { itemIndex, slot } = message;
    if (itemIndex === undefined || itemIndex < 0 || itemIndex >= player.inventory.length) {
      return;
    }
    
    const item = player.inventory[itemIndex];
    if (!item || !item.type) return; // Empty slot or invalid item
    
    // Equip the item based on slot
    if (slot === 'weapon') {
      player.equipment.weapon = item.type;
    } else if (slot === 'armor') {
      player.equipment.armor = item.type;
    } else if (slot === 'shield') {
      player.equipment.shield = item.type;
    }
    
    // Remove from inventory
    player.inventory[itemIndex] = new InventoryItem();
    
    // TODO: Replace with proper logging framework in production
// console.log(`Player ${player.username} equipped ${item.type} in ${slot} slot`);
  }
  
    private handleDropItem(client: Client, message: DropItemMessage) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    
    const { itemIndex, quantity = 1 } = message;
    if (itemIndex === undefined || itemIndex < 0 || itemIndex >= player.inventory.length) {
      return;
    }
    
    const item = player.inventory[itemIndex];
    if (!item || !item.type) return; // Empty slot or invalid item
    
    // Create a copy of the item to drop
    const droppedItem = new InventoryItem(item.type, Math.min(quantity, item.quantity));
    
    // Update or remove from inventory
    if (quantity >= item.quantity) {
      player.inventory[itemIndex] = new InventoryItem();
    } else {
      item.quantity -= quantity;
    }
    
    // Create loot drop
    this.createLootDrop([droppedItem], player.x, player.y);
    
    // TODO: Replace with proper logging framework in production
// console.log(`Player ${player.username} dropped ${droppedItem.quantity}x ${droppedItem.type}`);
  }
  
    private handleCollectLoot(client: Client, message: CollectLootMessage) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    
    const lootId = message.lootId;
    if (!lootId) return;
    
    const lootDrop = this.state.lootDrops.get(lootId);
    if (!lootDrop) return;
    
    // Check if player is close enough to the loot
    const distance = Math.sqrt(
      Math.pow(player.x - lootDrop.x, 2) + 
      Math.pow(player.y - lootDrop.y, 2)
    );
    
    if (distance > this.lootPickupRadius) {
      // TODO: Replace with proper logging framework in production
// console.log(`Player ${player.username} is too far from loot ${lootId}`);
      return;
    }
    
    // Add items to player's inventory
    let allItemsCollected = true;
    
    for (const item of lootDrop.items) {
      // Find an empty slot or stack with existing item
      let added = false;
      
      // First try to stack with existing items
      for (let i = 0; i < player.inventory.length; i++) {
        const inventoryItem = player.inventory[i];
        if (inventoryItem.type === item.type) {
          inventoryItem.quantity += item.quantity;
          added = true;
          break;
        }
      }
      
      // If couldn't stack, find an empty slot
      if (!added) {
        for (let i = 0; i < player.inventory.length; i++) {
          const inventoryItem = player.inventory[i];
          if (!inventoryItem.type) {
            player.inventory[i] = new InventoryItem(item.type, item.quantity);
            added = true;
            break;
          }
        }
      }
      
      // If couldn't add the item, inventory is full
      if (!added) {
        allItemsCollected = false;
        // TODO: Replace with proper logging framework in production
// console.log(`Player ${player.username} inventory is full`);
        break;
      }
    }
    
    // Remove loot drop if all items were collected
    if (allItemsCollected) {
      this.state.lootDrops.delete(lootId);
      // TODO: Replace with proper logging framework in production
// console.log(`Player ${player.username} collected loot ${lootId}`);
    }
  }
  
  /**
   * Process combat ticks
   */
  private processCombat(): void {
    CombatSystem.processCombat(this.state);
  }
  
  /**
   * Check for idle players and potentially disconnect them
   */
  private checkIdlePlayers(): void {
    try {
      const now = Date.now();
      const idlePlayers: string[] = [];
      
      this.state.players.forEach((player, sessionId) => {
        if (now - player.lastActivity > this.idleTimeout) {
          idlePlayers.push(sessionId);
        }
      });
      
      // Disconnect idle players
      for (const sessionId of idlePlayers) {
        const client = this.clients.find(c => c.sessionId === sessionId);
        if (client) {
          // TODO: Replace with proper logging framework in production
// console.log(`Disconnecting idle player: ${sessionId}`);
          client.send('idle-timeout', { message: 'You have been disconnected due to inactivity.' });
          client.leave(1000); // Graceful disconnect with 1 second delay
        }
      }
    } catch (error) {
      // TODO: Replace with proper logging framework in production
// console.error('Error checking idle players:', error instanceof Error ? error.message : 'Unknown error', error);
    }
  }
  
  /**
   * Update player states (cooldowns, busy status, etc.)
   */
  private updatePlayerStates(): void {
    try {
      const now = Date.now();
      
      this.state.players.forEach((player) => {
        // Update busy status
        if (player.isBusy && player.busyUntil <= now) {
          player.isBusy = false;
        }
      });
    } catch (_error) {
      // TODO: Replace with proper logging framework in production
      // console.error('Error updating player states:', _error instanceof Error ? _error.message : 'Unknown error', _error);
    }
  }
  
  /**
   * Check for nearby loot and auto-pickup if enabled
   */
  private checkForNearbyLoot(player: Player, client: Client): void {
    try {
      // Skip if auto-pickup is disabled
      if (!this.autoLootPickup) {
        return;
      }
      
      const lootToPickup: string[] = [];
      
      this.state.lootDrops.forEach((loot, lootId) => {
        const distance = Math.sqrt(
          Math.pow(loot.x - player.x, 2) + 
          Math.pow(loot.y - player.y, 2)
        );
        
        if (distance <= this.lootPickupRadius) {
          lootToPickup.push(lootId);
        }
      });
      
      // Pickup nearby loot
      for (const lootId of lootToPickup) {
        this.handleCollectLoot(client, { lootId });
      }
    } catch (_error) {
      // TODO: Replace with proper logging framework in production
      // console.error(`Error checking for nearby loot for player ${player.id}:`, _error instanceof Error ? _error.message : 'Unknown error', _error);
    }
  }

  /**
   * Generate loot based on resource type
   */
  private _generateResourceLoot(_resourceId: string): LootDropMessage {
    // In a real implementation, this would use the resource type to determine loot
    // For now, just return a random item
    const lootTypes = [
      { type: 'logs', skill: 'woodcutting' },
      { type: 'oak_logs', skill: 'woodcutting' },
      { type: 'copper_ore', skill: 'mining' },
      { type: 'iron_ore', skill: 'mining' },
      { type: 'raw_shrimp', skill: 'fishing' }
    ];
    
    const randomLoot = lootTypes[Math.floor(Math.random() * lootTypes.length)];
    
    return {
      itemType: randomLoot.type,
      quantity: Math.floor(Math.random() * 3) + 1,
      position: { x: 0, y: 0 } // Will be set by the caller
    };
  }

  /**
   * Clean up old loot drops
   */
  private cleanupLoot(): void {
    try {
      const now = Date.now();
      const expiredLoot: string[] = [];

      this.state.lootDrops.forEach((loot, id) => {
        if (now - loot.timestamp > this.lootExpiration) {
          expiredLoot.push(id);
        }
      });

      // Remove expired loot
      expiredLoot.forEach(id => {
        this.state.lootDrops.delete(id);
      });

      // Notify clients if any loot was removed
      if (expiredLoot.length > 0) {
        this.broadcast('loot-expired', { ids: expiredLoot });
      }
    } catch (_error) {
      // TODO: Replace with proper logging framework in production
      // console.error('Error cleaning up loot:', _error instanceof Error ? _error.message : 'Unknown error', _error);
    }
  }
}
