import { CONFIG } from '../config';

// Define interfaces for game entities
interface PlayerState {
  id: string;
  username: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  animation: string;
  direction: string;
  inventory: InventoryItem[];
  skills: Record<string, { level: number, xp: number }>;
  equipment: Equipment;
  inCombat: boolean;
  isBusy: boolean;
  specialEnergy: number;
  activePrayers: string[];
}

interface NPCState {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  animation: string;
  direction: string;
}

interface InventoryItem {
  itemId: string;
  name: string;
  quantity: number;
  description: string;
  attack?: number;
  defense?: number;
  isStackable: boolean;
}

interface Equipment {
  weapon: string | null;
  armor: string | null;
  shield: string | null;
}

interface LootDrop {
  id: string;
  x: number;
  y: number;
  items: InventoryItem[];
}

interface Resource {
  id: string;
  type: string;
  x: number;
  y: number;
  depleted: boolean;
}

export class GameState {
  // Local player reference (the current user's player)
  public player: PlayerState | null = null;
  
  // Collections of game entities
  public players: Map<string, PlayerState> = new Map();
  public npcs: Map<string, NPCState> = new Map();
  public lootDrops: Map<string, LootDrop> = new Map();
  public resources: Map<string, Resource> = new Map();
  
  // Room data
  public roomWidth: number = 20;
  public roomHeight: number = 20;
  public tileMap: number[][] = [];
  public collisionMap: boolean[][] = [];
  
  // Camera position
  public cameraX: number = 0;
  public cameraY: number = 0;
  
  // Animation timers
  private animationTimers: Map<string, number> = new Map();
  
  constructor() {
    // Initialize empty room
    this.initializeEmptyRoom();
  }
  
  private initializeEmptyRoom(): void {
    // Create empty tile map
    this.tileMap = Array(this.roomHeight).fill(0).map(() => Array(this.roomWidth).fill(0));
    
    // Create empty collision map
    this.collisionMap = Array(this.roomHeight).fill(false).map(() => Array(this.roomWidth).fill(false));
    
    // Add walls around the edges
    for (let x = 0; x < this.roomWidth; x++) {
      for (let y = 0; y < this.roomHeight; y++) {
        if (x === 0 || y === 0 || x === this.roomWidth - 1 || y === this.roomHeight - 1) {
          this.tileMap[y][x] = 1; // Wall tile
          this.collisionMap[y][x] = true; // Collision
        }
      }
    }
  }
  
  // Update game state with server data
  public updateFromServer(serverState: any): void {
    // Update players
    if (serverState.players) {
      serverState.players.forEach((player: any, id: string) => {
        if (this.players.has(id)) {
          // Update existing player
          const existingPlayer = this.players.get(id)!;
          Object.assign(existingPlayer, player);
        } else {
          // Add new player
          this.addPlayer(id, player);
        }
      });
    }
    
    // Update NPCs
    if (serverState.npcs) {
      serverState.npcs.forEach((npc: any, id: string) => {
        if (this.npcs.has(id)) {
          // Update existing NPC
          const existingNPC = this.npcs.get(id)!;
          Object.assign(existingNPC, npc);
        } else {
          // Add new NPC
          this.addNPC(id, npc);
        }
      });
    }
    
    // Update loot drops
    if (serverState.lootDrops) {
      serverState.lootDrops.forEach((loot: any, id: string) => {
        if (!this.lootDrops.has(id)) {
          this.addLootDrop(id, loot);
        }
      });
    }
    
    // Update room data if available
    if (serverState.currentMapId && serverState.maps && serverState.maps[serverState.currentMapId]) {
      const map = serverState.maps[serverState.currentMapId];
      this.roomWidth = map.width;
      this.roomHeight = map.height;
      
      // Update collision map if available
      if (map.collisionMap) {
        this.collisionMap = map.collisionMap;
      }
    }
    
    // Update camera position to follow local player
    this.updateCamera();
  }
  
  // Update method called every frame
  public update(deltaTime: number): void {
    // Update animation timers
    this.updateAnimations(deltaTime);
    
    // Update camera position
    this.updateCamera();
  }
  
  // Add a player to the game state
  public addPlayer(id: string, playerData: any): void {
    const player: PlayerState = {
      id: id,
      username: playerData.username || `Player ${id.substring(0, 4)}`,
      x: playerData.x || 0,
      y: playerData.y || 0,
      health: playerData.health || 100,
      maxHealth: playerData.maxHealth || 100,
      animation: playerData.animation || 'idle',
      direction: playerData.direction || 'down',
      inventory: playerData.inventory || [],
      skills: playerData.skills || {
        attack: { level: 1, xp: 0 },
        strength: { level: 1, xp: 0 },
        defence: { level: 1, xp: 0 },
        mining: { level: 1, xp: 0 },
        woodcutting: { level: 1, xp: 0 },
        fishing: { level: 1, xp: 0 }
      },
      equipment: playerData.equipment || { weapon: null, armor: null, shield: null },
      inCombat: playerData.inCombat || false,
      isBusy: playerData.isBusy || false,
      specialEnergy: playerData.specialEnergy || 100,
      activePrayers: playerData.activePrayers || []
    };
    
    this.players.set(id, player);
    
    // If this is the local player (matches our session ID)
    if (id === (window as any).colyseusClient?.room?.sessionId) {
      this.player = player;
      this.updateCamera();
    }
  }
  
  // Remove a player from the game state
  public removePlayer(id: string): void {
    this.players.delete(id);
    
    // If this was the local player, set player to null
    if (this.player?.id === id) {
      this.player = null;
    }
  }
  
  // Add an NPC to the game state
  public addNPC(id: string, npcData: any): void {
    const npc: NPCState = {
      id: id,
      name: npcData.name || 'Unknown',
      type: npcData.type || 'goblin',
      x: npcData.x || 0,
      y: npcData.y || 0,
      health: npcData.health || 100,
      maxHealth: npcData.maxHealth || 100,
      animation: npcData.animation || 'idle',
      direction: npcData.direction || 'down'
    };
    
    this.npcs.set(id, npc);
  }
  
  // Remove an NPC from the game state
  public removeNPC(id: string): void {
    this.npcs.delete(id);
  }
  
  // Add a loot drop to the game state
  public addLootDrop(id: string, lootData: any): void {
    const loot: LootDrop = {
      id: id,
      x: lootData.x || 0,
      y: lootData.y || 0,
      items: lootData.items || []
    };
    
    this.lootDrops.set(id, loot);
  }
  
  // Remove a loot drop from the game state
  public removeLootDrop(id: string): void {
    this.lootDrops.delete(id);
  }
  
  // Add a resource to the game state
  public addResource(id: string, resourceData: any): void {
    const resource: Resource = {
      id: id,
      type: resourceData.type || 'tree',
      x: resourceData.x || 0,
      y: resourceData.y || 0,
      depleted: resourceData.depleted || false
    };
    
    this.resources.set(id, resource);
  }
  
  // Remove a resource from the game state
  public removeResource(id: string): void {
    this.resources.delete(id);
  }
  
  // Move the local player (for client-side prediction)
  public moveLocalPlayer(x: number, y: number): void {
    if (!this.player) return;
    
    // Update player position
    this.player.x = x;
    this.player.y = y;
    
    // Update player direction based on movement
    const dx = x - this.player.x;
    const dy = y - this.player.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      this.player.direction = dx > 0 ? 'right' : 'left';
    } else {
      this.player.direction = dy > 0 ? 'down' : 'up';
    }
    
    // Set walking animation
    this.setPlayerAnimation('walk');
    
    // Update camera to follow player
    this.updateCamera();
  }
  
  // Set player animation with automatic reset to idle
  public setPlayerAnimation(animation: string, duration: number = 500): void {
    if (!this.player) return;
    
    this.player.animation = animation;
    
    // Clear existing animation timer for this player
    if (this.animationTimers.has(this.player.id)) {
      window.clearTimeout(this.animationTimers.get(this.player.id));
    }
    
    // Set timer to reset animation to idle
    const timerId = window.setTimeout(() => {
      if (this.player) {
        this.player.animation = 'idle';
      }
      this.animationTimers.delete(this.player.id);
    }, duration);
    
    this.animationTimers.set(this.player.id, timerId);
  }
  
  // Update all animation timers
  private updateAnimations(deltaTime: number): void {
    // Animation logic can be expanded here
  }
  
  // Update camera position to follow player
  private updateCamera(): void {
    if (!this.player) return;
    
    const canvasWidth = CONFIG.CANVAS_WIDTH;
    const canvasHeight = CONFIG.CANVAS_HEIGHT;
    const tileSize = CONFIG.TILE_SIZE;
    
    // Center camera on player
    this.cameraX = this.player.x * tileSize - canvasWidth / 2;
    this.cameraY = this.player.y * tileSize - canvasHeight / 2;
    
    // Clamp camera to room bounds
    this.cameraX = Math.max(0, Math.min(this.cameraX, this.roomWidth * tileSize - canvasWidth));
    this.cameraY = Math.max(0, Math.min(this.cameraY, this.roomHeight * tileSize - canvasHeight));
  }
  
  // Check if a position is walkable
  public isWalkable(x: number, y: number): boolean {
    // Check bounds
    if (x < 0 || x >= this.roomWidth || y < 0 || y >= this.roomHeight) {
      return false;
    }
    
    // Check collision map
    return !this.collisionMap[Math.floor(y)][Math.floor(x)];
  }
  
  // Find the nearest NPC to a position
  public findNearestNPC(x: number, y: number, maxDistance: number = 5): NPCState | null {
    let nearest: NPCState | null = null;
    let minDistance = maxDistance;
    
    this.npcs.forEach(npc => {
      const distance = Math.sqrt(Math.pow(npc.x - x, 2) + Math.pow(npc.y - y, 2));
      if (distance < minDistance) {
        minDistance = distance;
        nearest = npc;
      }
    });
    
    return nearest;
  }
  
  // Find the nearest loot drop to a position
  public findNearestLootDrop(x: number, y: number, maxDistance: number = 3): LootDrop | null {
    let nearest: LootDrop | null = null;
    let minDistance = maxDistance;
    
    this.lootDrops.forEach(loot => {
      const distance = Math.sqrt(Math.pow(loot.x - x, 2) + Math.pow(loot.y - y, 2));
      if (distance < minDistance) {
        minDistance = distance;
        nearest = loot;
      }
    });
    
    return nearest;
  }
}
