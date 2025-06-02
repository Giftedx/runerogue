import 'reflect-metadata';
import { Schema, MapSchema, type } from '@colyseus/schema';
import { Room, Client } from '@colyseus/core';
import { nanoid } from 'nanoid';

// Re-export the type decorator
export { type };

// ==========================================
// Interface Declarations
// ==========================================

/**
 * Interface for player movement messages
 */
interface PlayerMoveMessage {
  x?: number;
  y?: number;
  animation?: string;
  direction?: string;
}

/**
 * Interface for player action messages
 */
interface PlayerActionMessage {
  type: 'attack' | 'gather' | 'pickup';
  targetId?: string;
  position?: { x: number, y: number };
  x?: number;
  y?: number;
}

/**
 * Interface for loot drop messages
 */
interface LootDropMessage {
  itemType: string;
  quantity: number;
  position: { x: number, y: number };
  x?: number;
  y?: number;
}

/**
 * Interface for inventory item
 */
export interface InventoryItem {
  type: string;
  quantity: number;
}

/**
 * Interface for player skills
 */
interface PlayerSkills {
  attack: { level: number, xp: number };
  strength: { level: number, xp: number };
  defence: { level: number, xp: number };
  mining: { level: number, xp: number };
  woodcutting: { level: number, xp: number };
  fishing: { level: number, xp: number };
}

/**
 * Interface for player join options
 */
interface PlayerJoinOptions {
  name?: string;
  token?: string;
  [key: string]: unknown;
}

/**
 * Interface for room metadata
 */
interface GameRoomMetadata {
  name: string;
  description: string;
  passwordProtected: boolean;
}

// Define type mappings for schema serialization
type SchemaFieldType = 'string' | 'number' | 'boolean' | 'map' | 'array';

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
export class GameState extends Schema {
  @type({ map: Player })
  public players = new MapSchema<Player>();

  @type({ map: LootDrop })
  public lootDrops = new MapSchema<LootDrop>();
}

/**
 * Inventory item class
 */
export class InventoryItemSchema extends Schema {
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
  public id: string;

  @type('string')
  public itemType: string;

  @type('number')
  public quantity: number;

  @type('number')
  public x: number;

  @type('number')
  public y: number;

  @type('number')
  public timestamp: number;

  constructor(id: string, itemType: string, quantity: number, x: number, y: number) {
    super();
    this.id = id;
    this.itemType = itemType;
    this.quantity = quantity;
    this.x = x;
    this.y = y;
    this.timestamp = Date.now();
  }
}
  
/**
 * Player class representing a game player
 */
export class Player extends Schema {
  @type('string')
  public id: string;
  
  @type('string')
  public username: string;
  
  @type('number')
  public x: number;
  
  @type('number')
  public y: number;
  
  @type('string')
  public animation: string;
  
  @type('string')
  public direction: string;
  
  @type('number')
  public health: number;
  
  @type('number')
  public maxHealth: number;
  
  @type('boolean')
  public inCombat: boolean;
  
  @type('string')
  public currentTargetId: string;
  
  // Not synced properties
  public lastActivity: number;
  public busyUntil: number;
  public actionCooldowns: Map<string, number>;
  public skills: PlayerSkills;
  public inventory: (InventoryItem | null)[];
  public equipped: { weapon: string | null, armor: string | null, shield: string | null };
  
  constructor(id: string = '', username: string = '') {
    super();
    this.id = id;
    this.username = username;
    this.x = 0;
    this.y = 0;
    this.animation = 'idle';
    this.direction = 'down';
    this.health = 100;
    this.maxHealth = 100;
    this.inCombat = false;
    this.currentTargetId = '';
    
    // Initialize non-synced properties
    this.lastActivity = Date.now();
    this.busyUntil = 0;
    this.actionCooldowns = new Map();
    this.skills = {
      attack: { level: 1, xp: 0 },
      strength: { level: 1, xp: 0 },
      defence: { level: 1, xp: 0 },
      mining: { level: 1, xp: 0 },
      woodcutting: { level: 1, xp: 0 },
      fishing: { level: 1, xp: 0 }
    };
    this.inventory = new Array(28).fill(null);
    this.equipped = { weapon: null, armor: null, shield: null };
  }
  
  /**
   * Check if an action is on cooldown
   */
  public isOnCooldown(actionType: string): boolean {
    const cooldownUntil = this.actionCooldowns.get(actionType);
    return cooldownUntil !== undefined && Date.now() < cooldownUntil;
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
    const cooldownUntil = this.actionCooldowns.get(actionType);
    if (cooldownUntil === undefined) return 0;
    
    const remaining = cooldownUntil - Date.now();
    return remaining > 0 ? remaining : 0;
  }
  
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
  // Configuration
  private lootExpiration = 60000; // 60 seconds
  private idleTimeout = 300000; // 5 minutes
  private autoLootPickup = true;
  private lootPickupRadius = 50;
  private combatConfig = {
    attackCooldown: 2000, // 2 seconds
    gatherCooldown: 3000  // 3 seconds
  };
  
  // Game loop intervals
  private gameLoopInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  /**
   * When room is initialized
   */
  onCreate(options: any) {
    this.setState(new GameState());
    
    // Set up message handlers
    this.onMessage('move', this.handleMove.bind(this));
    this.onMessage('action', this.handleAction.bind(this));
    this.onMessage('equip-item', this.handleEquipItem.bind(this));
    this.onMessage('drop-item', this.handleDropItem.bind(this));
    this.onMessage('collect-loot', this.handleCollectLoot.bind(this));
    
    // Set up game loop intervals
    this.gameLoopInterval = setInterval(() => {
      this.processCombat();
      this.updatePlayerStates();
      this.checkIdlePlayers();
    }, 1000);
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupLoot();
    }, 10000);
    
    console.log('GameRoom created!');
  }
  
  /**
   * When client connects
   */
  onJoin(client: Client, options: any) {
    console.log(`${client.sessionId} joined!`);
    
    // Create a new player
    const player = new Player(client.sessionId, options.name || 'Player');
    
    // Set initial position
    player.x = Math.floor(Math.random() * 800) + 100;
    player.y = Math.floor(Math.random() * 600) + 100;
    
    // Add to game state
    this.state.players.set(client.sessionId, player);
    
    // Add starter items
    this.addStarterItems(player);
    
    // Initialize inventory with empty slots
    for (let i = 0; i < 28; i++) {
      player.inventory[i] = null;
    }
  }
  
  /**
   * When client disconnects
   */
  onLeave(client: Client, consented: boolean) {
    console.log(`${client.sessionId} left!`);
    
    const player = this.state.players.get(client.sessionId);
    if (player) {
      // Drop some items on disconnect
      this.dropPlayerInventory(player, false);
      
      // Remove player from game state
      this.state.players.delete(client.sessionId);
    }
  }
  
  /**
   * When room is disposed
   */
  onDispose() {
    console.log('GameRoom disposed!');
    
    // Clear intervals
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
  
  /**
   * Handle player movement
   */
  private handleMove(client: Client, message: PlayerMoveMessage) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    
    // Update player position and animation
    if (message.x !== undefined) player.x = message.x;
    if (message.y !== undefined) player.y = message.y;
    if (message.animation) player.animation = message.animation;
    if (message.direction) player.direction = message.direction;
    
    // Update last activity timestamp
    player.lastActivity = Date.now();
    
    // Check for nearby loot
    this.checkForNearbyLoot(player, client);
  }
  
  /**
   * Handle player action
   */
  private handleAction(client: Client, message: PlayerActionMessage) {
    try {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      
      // Update last activity timestamp
      player.lastActivity = Date.now();
      
      // Handle different action types
      switch (message.type) {
        case 'attack':
          this.handleAttackAction(client, player, message);
          break;
          
        case 'gather':
          this.handleGatherAction(client, player, message);
          break;
          
        case 'pickup':
          if (message.targetId) {
            this.handleCollectLoot(client, { lootId: message.targetId });
          }
          break;
          
        default:
          console.warn(`Unknown action type received from ${client.sessionId}: ${message.type}`);
          client.send('action-rejected', { 
            reason: 'unknown-action', 
            message: 'Unknown action type.' 
          });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error handling player action for ${client.sessionId}:`, errorMessage, error);
    }
  }
  
  /**
   * Handle gather action from a player
   */
  private handleGatherAction(client: Client, player: Player, message: PlayerActionMessage): void {
    try {
      // Check if player is on cooldown
      if (player.isOnCooldown('gather')) {
        const remainingMs = player.getCooldownRemaining('gather');
        client.send('action-rejected', { 
          reason: 'cooldown', 
          message: `You can gather again in ${Math.ceil(remainingMs / 1000)} seconds.`,
          cooldownMs: remainingMs
        });
        return;
      }
      
      // Check if player is busy
      if (player.busyUntil > Date.now()) {
        client.send('action-rejected', { 
          reason: 'busy', 
          message: 'You are busy doing something else.'
        });
        return;
      }
      
      // Check if there's a valid resource target
      if (!message.targetId) {
        client.send('action-rejected', { 
          reason: 'no-target', 
          message: 'No resource specified.'
        });
        return;
      }
      
      // Get resource type from targetId
      // In a real game, you'd have a database of resources with positions
      // For this example, we'll assume the targetId contains the resource type
      const resourceType = message.targetId.split('-')[0]; // e.g., "tree-123" -> "tree"
      
      // Check distance to resource
      // In a real game, you'd have resource positions stored
      // For this example, we'll use the target position from the message
      if (!message.targetX || !message.targetY) {
        client.send('action-rejected', { 
          reason: 'invalid-target', 
          message: 'Invalid resource position.'
        });
        return;
      }
      
      const distance = Math.sqrt(
        Math.pow(message.targetX - player.x, 2) + 
        Math.pow(message.targetY - player.y, 2)
      );
      
      if (distance > 100) { // Arbitrary gather range
        client.send('action-rejected', { 
          reason: 'out-of-range', 
          message: 'Resource is out of range.'
        });
        return;
      }
      
      // Set cooldown for gather action
      player.setCooldown('gather', 3000); // 3 second cooldown
      
      // Set player as busy during gather animation
      player.setBusy(2000); // 2 second gather animation
      
      // Set player animation
      player.animation = 'gather';
      
      // Broadcast gather start event
      this.broadcast('player-gather-start', {
        playerId: player.id,
        resourceId: message.targetId,
        resourceType: resourceType,
        x: message.targetX,
        y: message.targetY
      });
      
      // After gather animation completes, give rewards
      setTimeout(() => {
        // Reset animation
        if (player.animation === 'gather') {
          player.animation = 'idle';
        }
        
        // Generate loot based on resource type
        const loot = this.generateResourceLoot(resourceType);
        
        // Create loot drops
        if (loot.length > 0) {
          loot.forEach(item => {
            this.createLootDrop({
              x: message.targetX,
              y: message.targetY,
              item: item.id,
              quantity: item.quantity
            });
          });
          
          // Broadcast gather complete event
          this.broadcast('player-gather-complete', {
            playerId: player.id,
            resourceId: message.targetId,
            resourceType: resourceType,
            loot: loot
          });
          
          // Add experience to relevant skill
          this.addGatheringExperience(player, resourceType, loot);
        }
      }, 2000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error handling gather action for ${player.id}:`, errorMessage, error);
      client.send('action-rejected', { 
        reason: 'error', 
        message: 'An error occurred while processing your gather action.'
      });
    }
  }
  
  /**
   * Generate loot items based on resource type
   */
  private generateResourceLoot(resourceType: string): { id: string, quantity: number }[] {
    const loot: { id: string, quantity: number }[] = [];
    
    switch (resourceType) {
      case 'tree':
        loot.push({ id: 'logs', quantity: Math.floor(Math.random() * 3) + 1 });
        // Small chance for rare drop
        if (Math.random() < 0.05) {
          loot.push({ id: 'bird_nest', quantity: 1 });
        }
        break;
        
      case 'rock':
        if (Math.random() < 0.7) {
          loot.push({ id: 'copper_ore', quantity: Math.floor(Math.random() * 2) + 1 });
        }
        if (Math.random() < 0.3) {
          loot.push({ id: 'tin_ore', quantity: Math.floor(Math.random() * 2) + 1 });
        }
        break;
        
      case 'bush':
        loot.push({ id: 'berries', quantity: Math.floor(Math.random() * 5) + 1 });
        break;
        
      default:
        loot.push({ id: 'unknown_resource', quantity: 1 });
    }
    
    return loot;
  }
  
  /**
   * Add experience to relevant gathering skill
   */
  private addGatheringExperience(player: Player, resourceType: string, loot: { id: string, quantity: number }[]): void {
    let skillName = '';
    let expAmount = 0;
    
    // Determine which skill to give experience to
    switch (resourceType) {
      case 'tree':
        skillName = 'woodcutting';
        expAmount = loot.reduce((total, item) => total + (item.id === 'logs' ? 10 * item.quantity : 0), 0);
        break;
        
      case 'rock':
        skillName = 'mining';
        expAmount = loot.reduce((total, item) => {
          if (item.id === 'copper_ore') return total + (15 * item.quantity);
          if (item.id === 'tin_ore') return total + (17 * item.quantity);
          return total;
        }, 0);
        break;
        
      case 'bush':
        skillName = 'foraging';
        expAmount = loot.reduce((total, item) => total + (5 * item.quantity), 0);
        break;
        
      default:
        return; // No skill experience for unknown resource types
    }
    
    // Add experience to the skill
    if (skillName && expAmount > 0 && player.skills[skillName]) {
      const oldLevel = player.skills[skillName].level;
      
      // Add experience
      player.skills[skillName].experience += expAmount;
      
      // Calculate new level based on experience
      // This is a simplified level calculation
      const newLevel = Math.floor(Math.sqrt(player.skills[skillName].experience / 100)) + 1;
      player.skills[skillName].level = Math.min(newLevel, 99); // Cap at level 99
      
      // If level increased, notify player
      if (newLevel > oldLevel) {
        // Get client for this player
        const playerClient = this.clients.find(c => c.sessionId === player.id);
        if (playerClient) {
          playerClient.send('skill-levelup', {
            skill: skillName,
            level: newLevel,
            experience: player.skills[skillName].experience
          });
        }
      }
    }
  }
  
  /**
   * Create a loot drop in the game world
   */
  private createLootDrop(options: { x: number, y: number, itemType: string, quantity: number, expiresIn?: number }): LootDrop {
    try {
      // Generate a unique ID for the loot drop
      const lootId = nanoid(10);
      
      // Add some randomness to position to avoid stacking
      const randomOffset = 20; // pixels
      const x = options.x + (Math.random() * randomOffset * 2 - randomOffset);
      const y = options.y + (Math.random() * randomOffset * 2 - randomOffset);
      
      // Create the loot drop
      const lootDrop = new LootDrop(lootId, options.itemType, options.quantity, x, y);
      
      // Add to game state
      this.state.lootDrops.set(lootId, lootDrop);
      
      // Broadcast loot creation
      this.broadcast('loot-created', {
        id: lootId,
        itemType: options.itemType,
        quantity: options.quantity,
        x,
        y
      });
      
      // Set up loot expiration
      const expirationTime = options.expiresIn || this.lootExpiration;
      setTimeout(() => {
        // Check if loot still exists (hasn't been picked up)
        if (this.state.lootDrops.has(lootId)) {
          // Remove from game state
          this.state.lootDrops.delete(lootId);
          
          // Broadcast loot expiration
          this.broadcast('loot-expired', { ids: [lootId] });
        }
      }, expirationTime);
      
      return lootDrop;
    } catch (error) {
      console.error('Error creating loot drop:', error);
      throw error;
    }
  }
  
  /**
   * Handle collecting loot by a player
   */
  private handleCollectLoot(client: Client, message: { lootId: string }): void {
    try {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      
      // Update last activity timestamp
      player.lastActivity = Date.now();
      
      // Check if loot exists
      const lootDrop = this.state.lootDrops.get(message.lootId);
      if (!lootDrop) {
        client.send('loot-collect-failed', {
          reason: 'not-found',
          message: 'Loot not found.'
        });
        return;
      }
      
      // Check distance to loot
      const distance = Math.sqrt(
        Math.pow(lootDrop.x - player.x, 2) + 
        Math.pow(lootDrop.y - player.y, 2)
      );
      
      if (distance > 100) { // Arbitrary pickup range
        client.send('loot-collect-failed', {
          reason: 'out-of-range',
          message: 'Loot is out of range.'
        });
        return;
      }
      
      // Add item to player inventory
      const addResult = this.addItemToInventory(player, lootDrop.itemType, lootDrop.quantity);
      
      if (!addResult.success) {
        client.send('loot-collect-failed', {
          reason: 'inventory-full',
          message: 'Your inventory is full.'
        });
        return;
      }
      
      // Remove loot from game state
      this.state.lootDrops.delete(lootDrop.id);
      
      // Broadcast loot collection
      this.broadcast('loot-collected', {
        id: lootDrop.id,
        playerId: player.id
      });
      
      // Notify player of item added to inventory
      client.send('inventory-updated', {
        added: {
          slot: addResult.slot,
          type: lootDrop.itemType,
          quantity: addResult.quantity
        },
        inventory: player.inventory
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error handling loot collection for ${client.sessionId}:`, errorMessage, error);
      client.send('loot-collect-failed', {
        reason: 'error',
        message: 'An error occurred while collecting loot.'
      });
    }
  }

  /**
   * Handle equipping an item from inventory
   */
  private handleEquipItem(client: Client, message: { inventorySlot: number }): void {
    try {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      
      // Update last activity timestamp
      player.lastActivity = Date.now();
      
      // Check if inventory slot is valid
      if (message.inventorySlot < 0 || message.inventorySlot >= player.inventory.length) {
        client.send('equip-failed', {
          reason: 'invalid-slot',
          message: 'Invalid inventory slot.'
        });
        return;
      }
      
      const itemToEquip = player.inventory[message.inventorySlot];
      if (!itemToEquip) {
        client.send('equip-failed', {
          reason: 'empty-slot',
          message: 'No item in this slot.'
        });
        return;
      }
      
      // Check if item is equippable
      // This would need to be expanded based on your item system
      const equippableTypes = ['weapon', 'armor', 'helmet', 'shield', 'boots', 'gloves'];
      if (!equippableTypes.includes(itemToEquip.type)) {
        client.send('equip-failed', {
          reason: 'not-equippable',
          message: 'This item cannot be equipped.'
        });
        return;
      }
      
      // Determine equipment slot based on item type
      let equipSlot = itemToEquip.type;
      
      // Check if there's already an item in that slot
      const currentEquipped = player.equipped[equipSlot];
      
      // If there's an item already equipped, move it to inventory first
      if (currentEquipped) {
        // Add the currently equipped item back to inventory
        const addedToInventory = this.addItemToInventory(player, currentEquipped.type, currentEquipped.quantity);
        
        if (!addedToInventory) {
          client.send('equip-failed', {
            reason: 'inventory-full',
            message: 'Cannot unequip current item because inventory is full.'
          });
          return;
        }
        
        // Remove the current equipped item
        delete player.equipped[equipSlot];
      }
      
      // Equip the new item
      player.equipped[equipSlot] = {
        type: itemToEquip.type,
        quantity: 1 // Equipped items are typically quantity 1
      };
      
      // Remove the equipped item from inventory
      if (itemToEquip.quantity > 1) {
        // If stacked, reduce quantity by 1
        itemToEquip.quantity -= 1;
      } else {
        // If single item, remove from inventory
        player.inventory.splice(message.inventorySlot, 1);
      }
      
      // Notify player of equipment change
      client.send('equipment-updated', {
        equipped: player.equipped,
        inventory: player.inventory
      });
      
      // Broadcast equipment change to other players
      this.broadcast('player-equipment-changed', {
        playerId: player.id,
        equipped: player.equipped
      }, { except: client });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error handling equip item for ${client.sessionId}:`, errorMessage, error);
      client.send('equip-failed', {
        reason: 'error',
        message: 'An error occurred while equipping item.'
      });
    }
  }

  /**
   * Handle dropping an item from inventory
   */
  private handleDropItem(client: Client, message: { inventorySlot: number, quantity?: number }): void {
    try {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      
      // Update last activity timestamp
      player.lastActivity = Date.now();
      
      // Check if inventory slot is valid
      if (message.inventorySlot < 0 || message.inventorySlot >= player.inventory.length) {
        client.send('drop-failed', {
          reason: 'invalid-slot',
          message: 'Invalid inventory slot.'
        });
        return;
      }
      
      const itemToDrop = player.inventory[message.inventorySlot];
      if (!itemToDrop) {
        client.send('drop-failed', {
          reason: 'empty-slot',
          message: 'No item in this slot.'
        });
        return;
      }
      
      // Determine quantity to drop
      const quantityToDrop = message.quantity && message.quantity > 0 ? 
        Math.min(message.quantity, itemToDrop.quantity) : itemToDrop.quantity;
      
      // Create loot drop at player's position
      this.createLootDrop({
        itemType: itemToDrop.type,
        quantity: quantityToDrop,
        x: player.x,
        y: player.y,
        expiresIn: 300000 // 5 minutes in milliseconds
      });
      
      // Update inventory
      if (quantityToDrop >= itemToDrop.quantity) {
        // Remove entire stack
        player.inventory.splice(message.inventorySlot, 1);
      } else {
        // Reduce stack
        itemToDrop.quantity -= quantityToDrop;
      }
      
      // Notify player of inventory update
      client.send('inventory-updated', {
        removed: {
          slot: message.inventorySlot,
          quantity: quantityToDrop
        },
        inventory: player.inventory
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error handling drop item for ${client.sessionId}:`, errorMessage, error);
      client.send('drop-failed', {
        reason: 'error',
        message: 'An error occurred while dropping item.'
      });
    }
  }
  
  /**
   * Add an item to a player's inventory
   * @returns Object with success flag, slot index, and quantity added
   */
  private addItemToInventory(player: Player, itemId: string, quantity: number): { success: boolean; slot: number; quantity: number } {
    try {
      // Find first empty slot
      const emptySlotIndex = player.inventory.findIndex(item => item === null);
      
      // Check if item already exists in inventory (for stackable items)
      const existingItemIndex = player.inventory.findIndex(item => item !== null && item.type === itemId);
      
      if (existingItemIndex !== -1) {
        // Update existing stack
        const existingItem = player.inventory[existingItemIndex] as InventoryItem;
        existingItem.quantity += quantity;
        return {
          success: true,
          slot: existingItemIndex,
          quantity: quantity
        };
      } else if (emptySlotIndex !== -1) {
        // Add new item to empty slot
        player.inventory[emptySlotIndex] = {
          type: itemId,
          quantity: quantity
        };
        return {
          success: true,
          slot: emptySlotIndex,
          quantity: quantity
        };
      } else {
        // No space in inventory
        return {
          success: false,
          slot: -1,
          quantity: 0
        };
      }
    } catch (error) {
      console.error(`Error adding item to inventory: ${error}`);
      return {
        success: false,
        slot: -1,
        quantity: 0
      };
    }
  }
  
  /**
   * Handle attack action from a player
   */
  private handleAttackAction(client: Client, player: Player, message: PlayerActionMessage): void {
    try {
      // Check if player is on cooldown
      if (player.isOnCooldown('attack')) {
        const remainingMs = player.getCooldownRemaining('attack');
        client.send('action-rejected', { 
          reason: 'cooldown', 
          message: `You can attack again in ${Math.ceil(remainingMs / 1000)} seconds.`,
          cooldownMs: remainingMs
        });
        return;
      }
      
      // Check if player is busy
      if (player.busyUntil > Date.now()) {
        client.send('action-rejected', { 
          reason: 'busy', 
          message: 'You are busy doing something else.'
        });
        return;
      }
      
      // Check if there's a valid target
      if (!message.targetId) {
        client.send('action-rejected', { 
          reason: 'no-target', 
          message: 'No target specified.'
        });
        return;
      }
      
      // Find target (could be NPC or player)
      const target = this.state.players.get(message.targetId);
      if (!target) {
        client.send('action-rejected', { 
          reason: 'invalid-target', 
          message: 'Invalid target.'
        });
        return;
      }
      
      // Check distance to target
      const distance = Math.sqrt(
        Math.pow(target.x - player.x, 2) + 
        Math.pow(target.y - player.y, 2)
      );
      
      if (distance > 100) { // Arbitrary attack range
        client.send('action-rejected', { 
          reason: 'out-of-range', 
          message: 'Target is out of range.'
        });
        return;
      }
      
      // Set cooldown
      const attackCooldown = this.combatConfig?.attackCooldown || 2000; // Default 2 seconds if not configured
      player.setCooldown('attack', attackCooldown);
      
      // Set player as busy during attack animation
      player.setBusy(1000); // 1 second attack animation
      
      // Set combat state
      player.inCombat = true;
      player.currentTargetId = message.targetId;
      target.inCombat = true;
      target.currentTargetId = player.id;
      
      // Calculate damage
      const damage = this.calculateDamage(player);
      
      // Apply damage to target
      target.health -= damage;
      if (target.health < 0) target.health = 0;
      
      // Broadcast attack event
      this.broadcast('player-attack', {
        attackerId: player.id,
        targetId: target.id,
        damage: damage,
        targetHealth: target.health,
        targetMaxHealth: target.maxHealth
      });
      
      // Set player animation
      player.animation = 'attack';
      
      // Check if target died
      if (target.health <= 0) {
        this.handlePlayerDeath(target);
      }
      
      // Reset animation after attack
      setTimeout(() => {
        if (player.animation === 'attack') {
          player.animation = 'idle';
        }
      }, 1000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error handling attack action for ${player.id}:`, errorMessage, error);
      client.send('action-rejected', { 
        reason: 'error', 
        message: 'An error occurred while processing your attack.'
      });
    }
  }
  
  /**
   * Calculate damage for an attack based on player stats
   */
  private calculateDamage(player: Player): number {
    try {
      // Base damage
      let damage = 1;
      
      // Add damage based on attack level
      if (player.skills && player.skills.attack && typeof player.skills.attack.level === 'number') {
        damage += Math.floor(player.skills.attack.level / 2);
      }
      
      // Add damage based on strength level
      if (player.skills && player.skills.strength && typeof player.skills.strength.level === 'number') {
        damage += Math.floor(player.skills.strength.level / 3);
      }
      
      // Add weapon damage (if equipped)
      if (player.equipped && player.equipped.weapon) {
        // This would be more complex in a real game
        // with different weapon types and stats
        const weaponType = player.equipped.weapon;
        
        if (typeof weaponType === 'string') {
          if (weaponType.includes('bronze')) damage += 2;
          if (weaponType.includes('iron')) damage += 3;
          if (weaponType.includes('steel')) damage += 4;
          if (weaponType.includes('mithril')) damage += 5;
          if (weaponType.includes('adamant')) damage += 6;
          if (weaponType.includes('rune')) damage += 7;
        }
      }
      
      // Add some randomness
      damage += Math.floor(Math.random() * 3);
      
      return Math.max(1, damage); // Minimum 1 damage
    } catch (error) {
      console.error('Error calculating damage:', error);
      return 1; // Default to minimum damage on error
    }
  }
  
  /**
   * Handle player death
   */
  private handlePlayerDeath(player: Player): void {
    try {
      // Set player as dead
      player.health = 0;
      player.inCombat = false;
      player.currentTargetId = '';
      player.animation = 'death';
      
      // Broadcast death event
      this.broadcast('player-death', {
        playerId: player.id
      });
      
      // Drop items on death
      this.dropPlayerInventory(player, true);
      
      // Reset player state after death animation
      setTimeout(() => {
        // Respawn player at a random location
        player.x = Math.floor(Math.random() * 800) + 100;
        player.y = Math.floor(Math.random() * 600) + 100;
        
        // Reset health
        player.health = player.maxHealth;
        player.animation = 'idle';
        
        // Broadcast respawn event
        this.broadcast('player-respawn', {
          playerId: player.id,
          x: player.x,
          y: player.y
        });
      }, 3000); // 3 second death animation
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error handling player death for ${player.id}:`, errorMessage, error);
    }
  }
  
  /**
   * Drop items from player inventory (on death, disconnect, or logout)
   */
  private dropPlayerInventory(player: Player, isDeath: boolean = false): void {
    try {
      // Determine how many items to drop
      const itemsToDrop: { index: number; item: InventoryItem }[] = [];
      
      // On death, drop more items than on disconnect/logout
      const dropChance = isDeath ? 0.7 : 0.3;
      
      // Find items to drop
      for (let i = 0; i < player.inventory.length; i++) {
        const item = player.inventory[i];
        if (item && Math.random() < dropChance) {
          itemsToDrop.push({ index: i, item });
        }
      }
      
      // Drop items
      for (const { index, item } of itemsToDrop) {
        // Create loot drop at player position
        this.createLootDrop({
          x: player.x,
          y: player.y,
          itemType: item.type,
          quantity: item.quantity,
          expiresIn: 300000 // 5 minutes
        });
        
        // Remove item from inventory
        player.inventory[index] = null;
      }
      
      if (itemsToDrop.length > 0) {
        console.log(`Dropped ${itemsToDrop.length} items from player ${player.id}'s inventory`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error dropping player inventory for ${player.id}:`, errorMessage, error);
    }
  }

/**
 * Interface for player movement messages
 */
interface PlayerMoveMessage {
  x?: number;
  y?: number;
  animation?: string;
  direction?: string;
}

/**
 * Interface for player action messages
 */
interface PlayerActionMessage {
  type: 'attack' | 'gather' | 'pickup';
  targetId?: string;
  position?: { x: number, y: number };
}

/**
 * Interface for loot drop messages
 */
interface LootDropMessage {
  itemType: string;
  quantity: number;
  position: { x: number, y: number };
  sourceId?: string;
}

/**
 * Interface for player join options
 */
interface PlayerJoinOptions {
  name?: string;
  token?: string;
  [key: string]: unknown;
}

/**
 * Interface for room metadata
 */
interface GameRoomMetadata {
  name: string;
  description: string;
  passwordProtected: boolean;
}

// Define type mappings for schema serialization
type SchemaFieldType = 'string' | 'number' | 'boolean' | 'map' | 'array';

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
 * Inventory item class
 */
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
  public id: string;

  @type('string')
  public itemType: string;

  @type('number')
  public quantity: number;

  @type('number')
  public x: number;

  @type('number')
  public y: number;

  @type('number')
  public timestamp: number;

  constructor(id: string, itemType: string, quantity: number, x: number, y: number) {
    super();
    this.id = id;
    this.itemType = itemType;
    this.quantity = quantity;
    this.x = x;
    this.y = y;
    this.timestamp = Date.now();
  }
}

/**
 * Player class representing a game player
 */
export class Player extends Schema {
  @type('string')
  public id: string;

  @type('string')
  public username: string;

  @type('number')
  public x: number;

  @type('number')
  public y: number;

  @type('string')
  public animation: string;

  @type('string')
  public direction: string;

  @type('number')
  public hp: number;

  @type('number')
  public maxHp: number;
  
  @type('number')
  public speed: number;

  @type(Skills)
  public skills: Skills;

  @type([InventoryItem])
  public inventory: ArraySchema<InventoryItem>;

  @type(Equipment)
  public equipped: Equipment;

  @type('string')
  public combatStyle: string;

  @type('boolean')
  public inCombat: boolean;
  
  @type('boolean')
  public isBusy: boolean;
  
  @type('number')
  public busyUntil: number;

  @type('string')
  public currentTargetId: string | null;
  
  // Non-synchronized properties (server-side only)
  public lastActivity: number;
  public actionCooldowns: Map<string, number>;

  constructor(id: string = '', username: string = '') {
    super();
    this.id = id;
    this.username = username;
    this.x = 0;
    this.y = 0;
    this.animation = 'idle';
    this.direction = 'down';
    this.hp = 99;
    this.maxHp = 99;
    this.speed = 5; // Base movement speed
    this.skills = new Skills();
    this.inventory = new ArraySchema<InventoryItem>();
    this.equipped = new Equipment();
    this.combatStyle = 'accurate';
    this.inCombat = false;
    this.isBusy = false;
    this.busyUntil = 0;
    this.currentTargetId = null;
    this.lastActivity = Date.now();
    this.actionCooldowns = new Map();
  }
  
  /**
   * Check if an action is on cooldown
   */
  public isOnCooldown(actionType: string): boolean {
    const cooldownUntil = this.actionCooldowns.get(actionType);
    return cooldownUntil !== undefined && Date.now() < cooldownUntil;
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
    const cooldownUntil = this.actionCooldowns.get(actionType);
    if (cooldownUntil === undefined) return 0;
    
    const remaining = cooldownUntil - Date.now();
    return remaining > 0 ? remaining : 0;
  }
  
  /**
   * Set player as busy for a duration
   */
  public setBusy(durationMs: number): void {
    this.isBusy = true;
    this.busyUntil = Date.now() + durationMs;
  }
  
  /**
   * Check and update busy status
   */
  public updateBusyStatus(): void {
    if (this.isBusy && Date.now() >= this.busyUntil) {
      this.isBusy = false;
    }
  }
  
  /**
   * Calculate combat level based on skills
   */
  public getCombatLevel(): number {
    // Simple formula based on combat skills
    return Math.floor(
      (this.skills.attack.level + 
       this.skills.strength.level + 
       this.skills.defence.level) / 3
    );
  }

  /**
   * Handle attack action
   */
  private handleAttackAction(client: Client, player: Player, message: PlayerActionMessage): void {
  try {
    // Check if player is in combat
    if (!player.inCombat) {
      client.send('action-rejected', { 
        reason: 'not-in-combat', 
        message: 'You are not in combat.' 
      });
      return;
    }

    // Check if player has a target
    if (!player.currentTargetId) {
      client.send('action-rejected', { 
        reason: 'no-target', 
        message: 'You do not have a target.' 
        
      default:
        console.warn(`Unknown action type received from ${client.sessionId}: ${message.type}`);
        client.send('action-rejected', { 
          reason: 'unknown-action', 
          message: 'Unknown action type.' 
        });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error handling player action for ${client.sessionId}:`, errorMessage, error);
  private handleEquipItem(client: Client, message: { slotIndex: number }): void {
    const player = this.state.players.get(client.sessionId);
    if (!player || message.slotIndex < 0 || message.slotIndex >= player.inventory.length) return;

    const item = player.inventory[message.slotIndex];
    if (!item) return;

    // Determine equipment slot based on item type
    let slot: 'weapon' | 'armor' | 'shield' | null = null;
    
    if (item.type.includes('sword') || item.type.includes('axe')) {
      slot = 'weapon';
    } else if (item.type.includes('shield')) {
      slot = 'shield';
    } else if (item.type.includes('armor')) {
      slot = 'armor';
    }

    if (slot) {
      // If there's an item already equipped, swap it with inventory
      const equippedItem = player.equipped[slot];
      if (equippedItem) {
        // Add the currently equipped item back to inventory
        player.inventory[message.slotIndex] = new InventoryItem(equippedItem, 1);
      } else {
        // Remove from inventory slot
        player.inventory[message.slotIndex] = null;
      }

      // Equip the new item
      player.equipped[slot] = item.type;

      // Notify client
      this.broadcast('equipment-changed', {
        playerId: client.sessionId,
        equipped: player.equipped
      });
    }
  }

  /**
   * Handle dropping an item from inventory
   */
  private handleDropItem(client: Client, message: { slotIndex: number, quantity: number }): void {
    const player = this.state.players.get(client.sessionId);
    if (!player || message.slotIndex < 0 || message.slotIndex >= player.inventory.length) return;

    const item = player.inventory[message.slotIndex];
    if (!item) return;

    const dropQuantity = Math.min(message.quantity, item.quantity);
    
    // Create a loot drop at player's position
    this.createLootDrop({
      itemType: item.type,
      quantity: dropQuantity,
      position: { x: player.x, y: player.y },
      sourceId: client.sessionId
    });

    // Update inventory
    if (dropQuantity >= item.quantity) {
      // Remove item completely
      player.inventory[message.slotIndex] = null;
    } else {
      // Reduce quantity
      item.quantity -= dropQuantity;
    }
  }

  /**
   * Handle collecting a loot drop
   */
  private handleCollectLoot(client: Client, message: { lootId: string }): void {
    const player = this.state.players.get(client.sessionId);
    const loot = this.state.lootDrops.get(message.lootId);
    
    if (!player || !loot) return;

    // Check if player is close enough to the loot
    const distance = Math.sqrt(Math.pow(player.x - loot.x, 2) + Math.pow(player.y - loot.y, 2));
    if (distance > 100) return; // Too far away

    // Add to inventory
    this.addItemToInventory(player, loot.itemType, loot.quantity);

    // Remove the loot drop
    this.state.lootDrops.delete(message.lootId);

    // Notify all clients that the loot was collected
    this.broadcast('loot-collected', {
      lootId: message.lootId,
      playerId: client.sessionId
    });
  }

  /**
   * Add starter items to a new player
   */
  private addStarterItems(player: Player): void {
    // Add bronze sword to inventory
    this.addItemToInventory(player, 'bronze_sword', 1);
    
    // Add wooden shield to inventory
    this.addItemToInventory(player, 'wooden_shield', 1);
  }

  /**
   * Add an item to player's inventory
   */
  private addItemToInventory(player: Player, itemType: string, quantity: number): boolean {
    // First try to stack with existing items of the same type
    for (let i = 0; i < player.inventory.length; i++) {
      const item = player.inventory[i];
      if (item && item.type === itemType) {
        item.quantity += quantity;
        return true;
      }
    }

    // Find first empty slot
    for (let i = 0; i < player.inventory.length; i++) {
      if (!player.inventory[i]) {
        player.inventory[i] = new InventoryItem(itemType, quantity);
        return true;
      }
    }

    // Inventory is full
    return false;
  }

  /**
   * Create a new loot drop in the world with improved handling
   */
  private createLootDrop(loot: LootDropMessage): void {
    try {
      // Generate a unique ID for the loot drop
      const lootId = `loot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Validate position
      const position = {
        x: loot.position?.x || 0,
        y: loot.position?.y || 0
      };
      
      // Create the loot drop object
      const lootDrop = new LootDrop(
        lootId,
        loot.itemType,
        loot.quantity,
        position.x,
        position.y
      );

      // Add to game state
      this.state.lootDrops.set(lootId, lootDrop);

      // Broadcast loot drop to all clients
      this.broadcast('loot-dropped', {
        id: lootId,
        itemType: loot.itemType,
        quantity: loot.quantity,
        x: position.x,
        y: position.y,
        sourceId: loot.sourceId
      });
      
      console.log(`Created loot drop ${lootId}: ${loot.quantity}x ${loot.itemType} at (${position.x}, ${position.y})`);
      
      // Set expiration timer for this specific loot item
      setTimeout(() => {
        if (this.state.lootDrops.has(lootId)) {
          this.state.lootDrops.delete(lootId);
          this.broadcast('loot-expired', { ids: [lootId] });
        }
      }, this.lootExpiration);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating loot drop:', errorMessage, error);
    }
  }

  /**
   * Handle attack action from a player
   */
  private handleAttackAction(client: Client, player: Player, message: PlayerActionMessage): void {
    try {
      // Check if player is on cooldown
      const now = Date.now();
      const lastAttackTime = player.actionCooldowns?.get('attack') || 0;
      
      if (now < lastAttackTime) {
        client.send('action-rejected', { 
          reason: 'cooldown', 
          message: 'You must wait before attacking again.',
          remainingMs: lastAttackTime - now
        });
        return;
      }
      
      // Validate target
      if (!message.targetId) {
        client.send('action-rejected', { 
          reason: 'no-target', 
          message: 'No target specified for attack.' 
        });
        return;
      }
      
      // Check if target exists (could be a player or NPC)
      const targetPlayer = this.state.players.get(message.targetId);
      const targetNpc = this.state.npcs.get(message.targetId);
      
      if (!targetPlayer && !targetNpc) {
        client.send('action-rejected', { 
          reason: 'invalid-target', 
          message: 'Target no longer exists.' 
        });
        return;
      }
      
      // Set player as busy and in combat
      player.inCombat = true;
      player.isBusy = true;
      player.busyUntil = now + 1000; // Busy for 1 second during attack animation
      player.currentTargetId = message.targetId;
      player.animation = 'attack';
      
      // Set cooldown for next attack
      if (!player.actionCooldowns) {
        player.actionCooldowns = new Map<string, number>();
      }
      player.actionCooldowns.set('attack', now + this.combatConfig.attackCooldown);
      
      // Calculate damage based on player stats
      const damage = this.calculateDamage(player);
      
      // Apply damage to target
      if (targetPlayer) {
        // Player vs Player combat
        targetPlayer.hp = Math.max(0, targetPlayer.hp - damage);
        
        // Check if target died
        if (targetPlayer.hp <= 0) {
          this.handlePlayerDeath(targetPlayer);
        }
      } else if (targetNpc) {
        // Player vs NPC combat - would be implemented in a real game
        // For now, just broadcast the attack
      }
      
      // Broadcast the attack action to all clients
      this.broadcast('player-attack', {
        attackerId: client.sessionId,
        targetId: message.targetId,
        damage: damage,
        animation: player.animation
      });
      
      // Reset player state after attack animation
      setTimeout(() => {
        if (player.isBusy && player.busyUntil <= Date.now()) {
          player.isBusy = false;
          player.animation = 'idle';
        }
      }, 1000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error handling attack action for ${client.sessionId}:`, errorMessage, error);
      
      client.send('action-error', { 
        message: 'An error occurred during combat. Please try again.' 
      });
    }
  }
  
  /**
   * Calculate damage for an attack based on player stats
   */
  private calculateDamage(player: Player): number {
    // Base damage calculation using player stats
    const baseDamage = player.skills.strength.level / 10 + 1;
    
    // Add weapon bonus if equipped
    let weaponBonus = 0;
    if (player.equipped.weapon) {
      // In a real game, this would be based on weapon stats
      const weaponTiers: Record<string, number> = {
        'bronze_sword': 1,
        'iron_sword': 2,
        'steel_sword': 3,
        'mithril_sword': 4,
        'adamant_sword': 5,
        'rune_sword': 6
      };
      
      weaponBonus = weaponTiers[player.equipped.weapon] || 0;
    }
    
    // Add some randomness
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 multiplier
    
    // Calculate final damage
    const damage = Math.floor((baseDamage + weaponBonus) * randomFactor);
    
    return Math.max(1, damage); // Minimum damage of 1
  }
  
  /**
   * Handle player death
   */
  private handlePlayerDeath(player: Player): void {
    // Reset player state
    player.inCombat = false;
    player.isBusy = false;
    player.currentTargetId = null;
    player.animation = 'death';
    
    // Drop some items on death if configured
    this.dropPlayerInventory(player, true);
    
    // Respawn player after delay
    setTimeout(() => {
      // Restore health
      player.hp = player.maxHp;
      
      // Move to spawn point
      const spawnAreas = [
        { x: 100, y: 100, width: 200, height: 200 }, // Lumbridge area
        { x: 500, y: 300, width: 150, height: 150 }  // Varrock area
      ];
      
      const spawnArea = spawnAreas[Math.floor(Math.random() * spawnAreas.length)];
      player.x = spawnArea.x + Math.floor(Math.random() * spawnArea.width);
      player.y = spawnArea.y + Math.floor(Math.random() * spawnArea.height);
      
      // Reset animation
      player.animation = 'idle';
      
      // Broadcast respawn
      this.broadcast('player-respawn', {
        id: player.id,
        x: player.x,
        y: player.y,
        hp: player.hp
      });
      
    }, 5000); // 5 second respawn time
    
    // Broadcast death
    this.broadcast('player-death', {
      id: player.id
    });
  }
  
  /**
   * Handle gather action from a player
   */
  private handleGatherAction(client: Client, player: Player, message: PlayerActionMessage): void {
    try {
      // Check if player is on cooldown
      const now = Date.now();
      const lastGatherTime = player.actionCooldowns?.get('gather') || 0;
      
      if (now < lastGatherTime) {
        client.send('action-rejected', { 
          reason: 'cooldown', 
          message: 'You must wait before gathering again.',
          remainingMs: lastGatherTime - now
        });
        return;
      }
      
      // Validate target
      if (!message.targetId) {
        client.send('action-rejected', { 
          reason: 'no-target', 
          message: 'No resource specified for gathering.' 
        });
        return;
      }
      
      // Check if resource exists
      const resource = this.state.resources.get(message.targetId);
      if (!resource) {
        client.send('action-rejected', { 
          reason: 'invalid-target', 
          message: 'Resource no longer exists.' 
        });
        return;
      }
      
      // Set player as busy
      player.isBusy = true;
      player.busyUntil = now + this.combatConfig.gatherCooldown;
      player.animation = 'gather';
      
      // Set cooldown for next gather
      if (!player.actionCooldowns) {
        player.actionCooldowns = new Map<string, number>();
      }
      player.actionCooldowns.set('gather', now + this.combatConfig.gatherCooldown);
      
      // Broadcast the gather action
      this.broadcast('player-gather', {
        playerId: client.sessionId,
        resourceId: message.targetId,
        animation: player.animation
      });
      
      // Generate loot after gather animation completes
      setTimeout(() => {
        // Create loot drop
        this.createLootDrop(
          this.generateResourceLoot(message.targetId || ''),
          message.position?.x || player.x,
          message.position?.y || player.y
        );
        
        // Reset player state
        player.isBusy = false;
        player.animation = 'idle';
        
        // Notify client of successful gather
        client.send('gather-complete', {
          resourceId: message.targetId
        });
        
      }, this.combatConfig.gatherCooldown);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error handling gather action for ${client.sessionId}:`, errorMessage, error);
      
      client.send('action-error', { 
        message: 'An error occurred while gathering. Please try again.' 
      });
    }
  }
  
  /**
   * Drop items from player inventory (on death, disconnect, or logout)
   */
  private dropPlayerInventory(player: Player, isDeath: boolean = false): void {
    try {
      // Determine how many items to drop
      const itemsToDrop: { index: number; item: InventoryItem }[] = [];
      
      // On death, drop more items than on disconnect/logout
      const dropChance = isDeath ? 0.7 : 0.3;
      
      // Find items to drop
      for (let i = 0; i < player.inventory.length; i++) {
        const item = player.inventory[i];
        if (item && Math.random() < dropChance) {
          itemsToDrop.push({ index: i, item });
        }
      }
      
      // Drop the items
      for (const { index, item } of itemsToDrop) {
        // Create a loot drop for each item
        this.createLootDrop({
          itemType: item.type,
          quantity: item.quantity,
          position: { x: player.x, y: player.y },
          sourceId: player.id
        });
        
        // Remove item from inventory
        player.inventory[index] = null;
      }
      
      if (itemsToDrop.length > 0) {
        console.log(`Dropped ${itemsToDrop.length} items from player ${player.id}'s inventory`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error dropping player inventory for ${player.id}:`, errorMessage, error);
    }
  }
  
  /**
   * Process ongoing combat for all players
   */
  private processCombat(): void {
    try {
      this.state.players.forEach((player) => {
        // Skip players not in combat
        if (!player.inCombat || !player.currentTargetId) {
          return;
        }
        
        // Check if target still exists
        const targetPlayer = this.state.players.get(player.currentTargetId);
        const targetNpc = this.state.npcs.get(player.currentTargetId);
        
        if (!targetPlayer && !targetNpc) {
          // Target no longer exists, exit combat
          player.inCombat = false;
          player.currentTargetId = null;
          return;
        }
        
        // Auto-attack logic would go here for NPCs or automatic combat
        // This is called on an interval set in onCreate
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error processing combat:', errorMessage, error);
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
          console.log(`Disconnecting idle player: ${sessionId}`);
          client.send('idle-timeout', { message: 'You have been disconnected due to inactivity.' });
          client.leave(1000); // Graceful disconnect with 1 second delay
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error checking idle players:', errorMessage, error);
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
      console.error('Error updating player states:', errorMessage, error);
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
      console.error(`Error checking for nearby loot for player ${player.id}:`, errorMessage, error);
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
  }
}
