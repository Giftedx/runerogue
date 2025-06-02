import 'reflect-metadata';
import { Schema, MapSchema, type } from '@colyseus/schema';
import { Room, Client } from '@colyseus/core';

// Define ArraySchema since it's not exported from @colyseus/schema
class ArraySchema<T> extends Array<T> {
  onAdd?: (item: T, key: number) => void;
  onChange?: (item: T, key: number) => void;
  onRemove?: (item: T, key: number) => void;
}

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
export class Skill extends Schema {
  @type('number')
  public level: number;

  @type('number')
  public xp: number;

  constructor(level: number = 1, xp: number = 0) {
    super();
    this.level = level;
    this.xp = xp;
  }
}

/**
 * Skills collection class
 */
export class Skills extends Schema {
  @type(Skill)
  public attack: Skill;

  @type(Skill)
  public strength: Skill;

  @type(Skill)
  public defence: Skill;

  @type(Skill)
  public mining: Skill;

  @type(Skill)
  public woodcutting: Skill;

  @type(Skill)
  public fishing: Skill;

  constructor() {
    super();
    this.attack = new Skill();
    this.strength = new Skill();
    this.defence = new Skill();
    this.mining = new Skill();
    this.woodcutting = new Skill();
    this.fishing = new Skill();
  }
}

/**
 * Game state class for the room
 */
// Forward declarations for schema types - these are just placeholders
// Removed to avoid duplicate class declarations
// (Duplicate Player and LootDrop classes removed above)

// --- Schema Classes: InventoryItem and Equipment must be defined before LootDrop and Player ---

export class InventoryItem extends Schema {
  @type('string')
  public type: string;

  @type('number')
  public quantity: number;

  constructor(type: string = '', quantity: number = 1) {
    super();
    this.type = type;
    this.quantity = quantity;
  }
}

export class Equipment extends Schema {
  @type('string')
  public weapon: string | null;

  @type('string')
  public armor: string | null;

  @type('string')
  public shield: string | null;

  constructor() {
    super();
    this.weapon = null;
    this.armor = null;
    this.shield = null;
  }
}

export class LootDrop extends Schema {
  @type('string')
  public id: string = '';

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('number')
  public timestamp: number = 0;

  @type([InventoryItem])
  public items = new ArraySchema<InventoryItem>();

  constructor() {
    super();
    this.timestamp = Date.now();
  }
}

export class Player extends Schema {
  @type('string')
  public id: string = '';
  @type('string')
  public username: string = '';
  @type('number')
  public x: number = 0;
  @type('number')
  public y: number = 0;
  @type('string')
  public animation: string = 'idle';
  @type('string')
  public direction: string = 'down';
  @type('number')
  public health: number = 100;
  @type('number')
  public maxHealth: number = 100;
  @type('number')
  public lastActivity: number = 0;
  @type('boolean')
  public isBusy: boolean = false;
  @type('number')
  public busyUntil: number = 0;
  @type([InventoryItem])
  public inventory = new ArraySchema<InventoryItem>();
  @type('number')
  public inventorySize: number = 28;
  @type(Equipment)
  public equipment: Equipment = new Equipment();
  @type(Skills)
  public skills: Skills = new Skills();
  private actionCooldowns: Map<string, number> = new Map();
  constructor() {
    super();
    this.lastActivity = Date.now();
    for (let i = 0; i < this.inventorySize; i++) {
      this.inventory.push(new InventoryItem());
    }
  }
  public isOnCooldown(actionType: string): boolean {
    return this.getCooldownRemaining(actionType) > 0;
  }
  public setCooldown(actionType: string, durationMs: number): void {
    this.actionCooldowns.set(actionType, Date.now() + durationMs);
  }
  public getCooldownRemaining(actionType: string): number {
    const cooldownUntil = this.actionCooldowns.get(actionType) || 0;
    const now = Date.now();
    return Math.max(0, cooldownUntil - now);
  }
  public getCombatStats(): { attack: number; defense: number; strength: number } {
    return {
      attack: this.skills.attack.level,
      defense: this.skills.defence.level,
      strength: this.skills.strength.level
    };
  }
  public setBusy(durationMs: number): void {
    this.busyUntil = Date.now() + durationMs;
  }
  public updateBusyStatus(): void {
    if (this.busyUntil > 0 && Date.now() >= this.busyUntil) {
      this.busyUntil = 0;
    }
  }
}

export class GameState extends Schema {
  @type({ map: Player })
  public players = new MapSchema<Player>();

  @type({ map: LootDrop })
  public lootDrops = new MapSchema<LootDrop>();
}

/**
 * Inventory item class
 */
// --- Moved InventoryItem above LootDrop for correct usage order ---
export class InventoryItem extends Schema {
  @type('string')
  public type: string;

  @type('number')
  public quantity: number;

  constructor(type: string = '', quantity: number = 1) {
    super();
    this.type = type;
    this.quantity = quantity;
  }
}

/**
 * Equipment class
 */
export class Equipment extends Schema {
  @type('string')
  public weapon: string | null;

  @type('string')
  public armor: string | null;

  @type('string')
  public shield: string | null;

  constructor() {
    super();
    this.weapon = null;
    this.armor = null;
    this.shield = null;
  }
}

/**
 * Loot drop class
 */
export class LootDrop extends Schema {
  @type('string')
  public id: string = '';

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('number')
  public timestamp: number = 0;

  @type([InventoryItem])
  public items = new ArraySchema<InventoryItem>();

  constructor() {
    super();
    this.timestamp = Date.now();
  }
}

/**
 * Player class
 */
export class Player extends Schema {
  @type('string')
  public id: string = '';

  @type('string')
  public username: string = '';

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('string')
  public animation: string = 'idle';

  @type('string')
  public direction: string = 'down';

  @type('number')
  public health: number = 100;

  @type('number')
  public maxHealth: number = 100;

  @type('number')
  public lastActivity: number = 0;

  @type('boolean')
  public isBusy: boolean = false;

  @type('number')
  public busyUntil: number = 0;

  @type([InventoryItem])
  public inventory = new ArraySchema<InventoryItem>();

  @type('number')
  public inventorySize: number = 28;

  @type(Equipment)
  public equipment: Equipment = new Equipment();

  @type(Skills)
  public skills: Skills = new Skills();

  // Non-synced properties
  private actionCooldowns: Map<string, number> = new Map();

  constructor() {
    super();
    this.lastActivity = Date.now();
    
    // Initialize inventory with empty slots
    for (let i = 0; i < this.inventorySize; i++) {
      this.inventory.push(new InventoryItem());
    }
  }

  /**
   * Check if an action is on cooldown
   */
  public isOnCooldown(actionType: string): boolean {
    return this.getCooldownRemaining(actionType) > 0;
  }

  /**
   * Set an action cooldown
   */
  public setCooldown(actionType: string, durationMs: number): void {
    this.actionCooldowns.set(actionType, Date.now() + durationMs);
  }

  /**
   * Get cooldown remaining in ms
   */
  public getCooldownRemaining(actionType: string): number {
    const cooldownUntil = this.actionCooldowns.get(actionType) || 0;
    const now = Date.now();
    return Math.max(0, cooldownUntil - now);
  }

  /**
   * Calculate combat stats based on skills and equipment
   */
  public getCombatStats(): { attack: number; defense: number; strength: number } {
    // Basic implementation - would be expanded with equipment bonuses
    return {
      attack: this.skills.attack.level,
      defense: this.skills.defence.level,
      strength: this.skills.strength.level
    };
  }

  /**
  /**
   * Set player as busy for a duration
   */
  public setBusy(durationMs: number): void {
    this.busyUntil = Date.now() + durationMs;
  }

  /**
   * Check and update busy status
   */
  public updateBusyStatus(): void {
    if (this.busyUntil > 0 && Date.now() >= this.busyUntil) {
      this.busyUntil = 0;
    }
  }

  /**
   * Calculate combat level based on skills
   */
  public getCombatLevel(): number {
    // Simple formula based on combat skills
    if (!this.skills) return 1;

    return Math.floor(
      (this.skills.attack.level +
        this.skills.strength.level +
        this.skills.defence.level) / 3
    );
  }
}

/**
 * GameRoom class that extends Colyseus Room
 */
export class GameRoom extends Room<GameState> {
  /**
   * Add starter items to a player (stub)
   */
  protected addStarterItems(player: Player): void {
    // TODO: Implement starter item assignment
  }

  /**
   * Drop all items in a player's inventory as loot (stub)
   */
  protected dropPlayerInventory(player: Player): void {
    // TODO: Implement inventory drop logic
  }

  /**
   * Create a loot drop at a location (stub)
   */
  protected createLootDrop(items: InventoryItem[], x: number, y: number): LootDrop {
    // TODO: Implement loot drop creation logic
    return new LootDrop();
  }

  private intervals: NodeJS.Timeout[] = [];
  private lootExpiration = 300000; // 5 minutes in ms
  private idleTimeout = 600000; // 10 minutes in ms
  private autoLootPickup = true;
  private lootPickupRadius = 50; // pixels
  private combatConfig = {
    attackCooldown: 1000, // ms
    damageRange: { min: 1, max: 5 },
    criticalChance: 0.1,
    criticalMultiplier: 2
  };

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
  onJoin(client: Client, options: object) {
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
  onLeave(client: Client, consented: boolean) {
    // Clear all intervals to prevent memory leaks
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  // Player action handler
  private handleAction(client: Client, message: object) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Update player state based on action
    if (message.x !== undefined) player.x = message.x;
    if (message.y !== undefined) player.y = message.y;
    if (message.animation) player.animation = message.animation;
    if (message.direction) player.direction = message.direction;

    // Update last activity timestamp
    player.lastActivity = Date.now();

    // Check for nearby loot
    this.checkForNearbyLoot(player, client);

    // Handle combat if the action is attack
    if (message.type === 'attack') {
      const isDead = player.health <= 0;
      if (isDead) {
        // Handle player death
        // TODO: Replace with proper logging framework in production
// console.log(`Player ${player.username} died`);
        
        // Drop inventory
        this.dropPlayerInventory(player);
      }
    }

    try {
      // Other action handling logic
      player.isBusy = message.type !== 'idle';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // TODO: Replace with proper logging framework in production
// console.error('Error handling player action:', errorMessage, error);
    }
  }

  private handleEquipItem(client: Client, message: object) {
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
  
  private handleDropItem(client: Client, message: object) {
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
    this.createLootDrop(player.x, player.y, [droppedItem]);
    
    // TODO: Replace with proper logging framework in production
// console.log(`Player ${player.username} dropped ${droppedItem.quantity}x ${droppedItem.type}`);
  }
  
  private handleCollectLoot(client: Client, message: object) {
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
  
  private processCombat() {
    try {
      // Simple combat processing
      this.state.players.forEach((player) => {
        // Process combat logic here
        // This would handle attacks, damage calculations, etc.
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // TODO: Replace with proper logging framework in production
// console.error('Error processing combat:', errorMessage, error);
    }
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // TODO: Replace with proper logging framework in production
// console.error('Error checking idle players:', errorMessage, error);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // TODO: Replace with proper logging framework in production
// console.error('Error updating player states:', errorMessage, error);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // TODO: Replace with proper logging framework in production
// console.error(`Error checking for nearby loot for player ${player.id}:`, errorMessage, error);
    }
  }

  /**
   * Generate loot based on resource type
   */
  private generateResourceLoot(resourceId: string): LootDropMessage {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // TODO: Replace with proper logging framework in production
// console.error('Error cleaning up loot:', errorMessage, error);
    }
  }
}
