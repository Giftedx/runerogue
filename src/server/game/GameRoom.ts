import 'reflect-metadata';
import { Schema, MapSchema, ArraySchema, type } from '@colyseus/schema';
import { Room, Client } from '@colyseus/core';

// Re-export the type decorator
export { type };

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

  @type('string')
  public currentTargetId: string | null;

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
    this.skills = new Skills();
    this.inventory = new ArraySchema<InventoryItem>();
    this.equipped = new Equipment();
    this.combatStyle = 'accurate';
    this.inCombat = false;
    this.currentTargetId = null;
  }
}

/**
 * Game state containing all players and world objects
 */
export class GameState extends Schema {
  @type({ map: Player })
  public players = new MapSchema<Player>();

  @type({ map: LootDrop })
  public lootDrops = new MapSchema<LootDrop>();

  @type('string')
  public currentBiome: string;

  @type('number')
  public seed: number;

  constructor() {
    super();
    this.currentBiome = 'lumbridge';
    this.seed = Math.floor(Math.random() * 1000000);
  }
}

/**
 * Main game room class
 */
export class GameRoom extends Room<GameState> {
  public maxClients = 10;
  public state = new GameState();

  private roomMetadata: GameRoomMetadata = {
    name: 'Game Room',
    description: 'A RuneScape inspired game room',
    passwordProtected: false,
  };

  // Loot drop expiration time in milliseconds (5 minutes)
  private lootExpiration = 5 * 60 * 1000;

  /**
   * Called when the room is created
   */
  public onCreate(_options: Record<string, unknown>): void {
    // Set up room metadata
    this.setMetadata(this.roomMetadata);

    // Register message handlers
    this.onMessage('move', (client: Client, message: unknown) => {
      this.handlePlayerMove(client, message as PlayerMoveMessage);
    });

    // Player action handlers
    this.onMessage('action', (client: Client, message: unknown) => {
      this.handlePlayerAction(client, message as PlayerActionMessage);
    });

    // Inventory management
    this.onMessage('equip-item', (client: Client, message: unknown) => {
      this.handleEquipItem(client, message as { slotIndex: number });
    });

    this.onMessage('drop-item', (client: Client, message: unknown) => {
      this.handleDropItem(client, message as { slotIndex: number, quantity: number });
    });

    // Loot collection
    this.onMessage('collect-loot', (client: Client, message: unknown) => {
      this.handleCollectLoot(client, message as { lootId: string });
    });

    // Set up room events
    this.onMessage('chat', (client: Client, message: unknown) => {
      if (typeof message === 'string') {
        this.broadcast('chat', {
          id: client.sessionId,
          message,
        });
      }
    });

    // Set up loot cleanup interval (remove old loot after 5 minutes)
    this.setSimulationInterval(() => this.cleanupLoot(), 60000);
  }

  /**
   * Handle player movement
   */
  private handlePlayerMove(client: Client, message: PlayerMoveMessage): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) {
      return;
    }

    // Update player position and state
    if (typeof message.x === 'number') player.x = message.x;
    if (typeof message.y === 'number') player.y = message.y;
    if (message.animation) player.animation = message.animation;
    if (message.direction) player.direction = message.direction;
  }

  /**
   * Called when a client joins the room
   */
  public onJoin(client: Client, options: PlayerJoinOptions = {}): void {
    try {
      const username = this.validateUsername(options);
      const player = new Player(client.sessionId, username);

      // Set initial position (random position within bounds)
      player.x = Math.floor(Math.random() * 800);
      player.y = Math.floor(Math.random() * 600);

      // Initialize inventory with starter items
      this.addStarterItems(player);

      this.state.players.set(client.sessionId, player);

      // Notify other players
      this.broadcast(
        'player-joined',
        {
          id: client.sessionId,
          username,
        },
        { except: client }
      );
    } catch (error) {
      // Log the error but don't expose internal details to the client
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error in onJoin for client ${client.sessionId}:`, errorMessage);
      throw new Error('Failed to join game room');
    }
  }

  /**
   * Validate and sanitize username
   */
  private validateUsername(options: PlayerJoinOptions): string {
    const defaultName = `Player_${Math.random().toString(36).substring(2, 6)}`;
    const name = (options?.name as string)?.trim() || defaultName;

    // Basic validation and sanitization
    return name.substring(0, 20).replace(/[^\w\s-]/g, '') || defaultName;
  }

  /**
   * Called when a client leaves the room
   */
  public onLeave(client: Client, _consented: boolean): void {
    if (this.state.players.has(client.sessionId)) {
      this.broadcast('player-left', { id: client.sessionId });
      this.state.players.delete(client.sessionId);
    }
  }

  /**
   * Called when the room is disposed
   */
  public onDispose(): void {
    // Use a logger in production instead of console.log
    // eslint-disable-next-line no-console
    console.log(`Room disposed: ${this.roomId}`);
    this.state.players.clear();
    this.state.lootDrops.clear();
  }

  /**
   * Handle player action (attack, gather, pickup)
   */
  private handlePlayerAction(client: Client, message: PlayerActionMessage): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    switch (message.type) {
      case 'attack':
        if (message.targetId) {
          player.inCombat = true;
          player.currentTargetId = message.targetId;
          player.animation = 'attack';
          
          // In a real implementation, we would handle combat calculations here
          // For now, just broadcast the attack action
          this.broadcast('player-attack', {
            attackerId: client.sessionId,
            targetId: message.targetId
          });
        }
        break;

      case 'gather':
        if (message.targetId) {
          player.animation = 'gather';
          
          // Simulate resource gathering and create loot
          setTimeout(() => {
            this.createLootDrop(
              this.generateResourceLoot(message.targetId),
              message.position?.x || player.x,
              message.position?.y || player.y
            );
          }, 2000);
        }
        break;

      case 'pickup':
        if (message.targetId) {
          this.handleCollectLoot(client, { lootId: message.targetId });
        }
        break;
    }
  }

  /**
   * Handle equipping an item from inventory
   */
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
   * Create a new loot drop in the world
   */
  private createLootDrop(loot: LootDropMessage): void {
    const lootId = `loot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const lootDrop = new LootDrop(
      lootId,
      loot.itemType,
      loot.quantity,
      loot.position.x,
      loot.position.y
    );

    this.state.lootDrops.set(lootId, lootDrop);

    // Broadcast loot drop to all clients
    this.broadcast('loot-dropped', {
      id: lootId,
      itemType: loot.itemType,
      quantity: loot.quantity,
      x: loot.position.x,
      y: loot.position.y,
      sourceId: loot.sourceId
    });
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
