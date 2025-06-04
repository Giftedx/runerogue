import { Client, Room } from 'colyseus.js';
import { GameTypes } from '../types/game';

/**
 * Game service for handling multiplayer connections
 */
export class GameService {
  private client: Client;
  private room: Room | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private gameState: GameTypes.GameState | null = null;
  private isConnected = false;

  constructor(serverUrl: string = 'ws://localhost:3001') {
    this.client = new Client(serverUrl);
  }

  /**
   * Connect to the game server
   */
  public async connect(username: string): Promise<boolean> {
    try {
      this.room = await this.client.joinOrCreate('game', { name: username });
      this.isConnected = true;

      // Set up event listeners
      this.setupRoomListeners();

      return true;
    } catch (error) {
      console.error('Failed to connect to game server:', error);
      return false;
    }
  }

  /**
   * Disconnect from the game server
   */
  public disconnect(): void {
    if (this.room) {
      this.room.leave();
      this.room = null;
      this.isConnected = false;
      this.gameState = null;
    }
  }

  /**
   * Check if connected to the game server
   */
  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  /**
   * Get the current game state
   */
  public getGameState(): GameTypes.GameState | null {
    return this.gameState;
  }

  /**
   * Send player movement to the server
   */
  public sendPlayerMove(
    x: number,
    y: number,
    animation: string = 'walk',
    direction: string = 'down'
  ): void {
    if (!this.room) return;

    this.room.send('move', { x, y, animation, direction });
  }

  /**
   * Send player action to the server
   */
  public sendPlayerAction(
    type: 'attack' | 'gather' | 'pickup',
    targetId?: string,
    position?: { x: number; y: number }
  ): void {
    if (!this.room) return;

    this.room.send('action', { type, targetId, position });
  }

  /**
   * Equip an item from inventory
   */
  public equipItem(slotIndex: number): void {
    if (!this.room) return;

    this.room.send('equip-item', { slotIndex });
  }

  /**
   * Drop an item from inventory
   */
  public dropItem(slotIndex: number, quantity: number = 1): void {
    if (!this.room) return;

    this.room.send('drop-item', { slotIndex, quantity });
  }

  /**
   * Collect a loot drop
   */
  public collectLoot(lootId: string): void {
    if (!this.room) return;

    this.room.send('collect-loot', { lootId });
  }

  /**
   * Send chat message
   */
  public sendChatMessage(message: string): void {
    if (!this.room) return;

    this.room.send('chat', message);
  }

  /**
   * Add event listener
   */
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)?.add(callback);
  }

  /**
   * Remove event listener
   */
  public off(event: string, callback: Function): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, ...args: any[]): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.forEach(callback => {
        callback(...args);
      });
    }
  }

  /**
   * Set up room event listeners
   */
  private setupRoomListeners(): void {
    if (!this.room) return;

    // State change
    this.room.onStateChange((state: any) => {
      // Convert Colyseus state to our GameState format
      this.gameState = this.convertColyseusState(state);
      this.emit('state-change', this.gameState);
    });

    // Player joined
    this.room.onMessage('player-joined', (message: { id: string; username: string }) => {
      this.emit('player-joined', message);
    });

    // Player left
    this.room.onMessage('player-left', (message: { id: string }) => {
      this.emit('player-left', message);
    });

    // Player attack
    this.room.onMessage(
      'player-attack',
      (message: { attackerId: string; targetId: string; damage: number }) => {
        this.emit('player-attack', message);
      }
    );

    // Loot dropped
    this.room.onMessage(
      'loot-dropped',
      (message: { id: string; itemType: string; quantity: number; x: number; y: number }) => {
        this.emit('loot-dropped', message);
      }
    );

    // Loot collected
    this.room.onMessage(
      'loot-collected',
      (message: { playerId: string; lootId: string; itemType: string; quantity: number }) => {
        this.emit('loot-collected', message);
      }
    );

    // Loot expired
    this.room.onMessage('loot-expired', (message: { ids: string[] }) => {
      this.emit('loot-expired', message);
    });

    // Equipment changed
    this.room.onMessage(
      'equipment-changed',
      (message: { playerId: string; slot: string; itemType: string | null }) => {
        this.emit('equipment-changed', message);
      }
    );

    // Chat message
    this.room.onMessage('chat', (message: { id: string; message: string }) => {
      this.emit('chat', message);
    });

    // Room error
    this.room.onError((code: number, message: string) => {
      console.error(`Room error: ${code} - ${message}`);
      this.emit('error', { code, message });
    });

    // Room leave
    this.room.onLeave((code: number) => {
      this.isConnected = false;
      this.room = null;
      this.emit('disconnected', code);
    });
  }

  /**
   * Convert Colyseus state to our GameState format
   */
  private convertColyseusState(state: any): GameTypes.GameState {
    // This is a simplified conversion - in a real implementation,
    // you would map all properties from the Colyseus schema to your GameState type

    // Create player states
    const players: Record<string, GameTypes.PlayerState> = {};

    state.players.forEach((player: any, id: string) => {
      // Convert skills
      const skills: GameTypes.Skills = {
        attack: { level: player.skills.attack.level, xp: player.skills.attack.xp },
        strength: { level: player.skills.strength.level, xp: player.skills.strength.xp },
        defence: { level: player.skills.defence.level, xp: player.skills.defence.xp },
        mining: { level: player.skills.mining.level, xp: player.skills.mining.xp },
        woodcutting: { level: player.skills.woodcutting.level, xp: player.skills.woodcutting.xp },
        fishing: { level: player.skills.fishing.level, xp: player.skills.fishing.xp },
      };

      // Convert inventory
      const inventory: (GameTypes.InventoryItem | null)[] = Array(28).fill(null);

      player.inventory.forEach((item: any, index: number) => {
        if (item) {
          inventory[index] = {
            type: item.type as GameTypes.ItemType,
            quantity: item.quantity,
          };
        }
      });

      // Convert equipment
      const equipped: GameTypes.Equipment = {
        weapon: player.equipped.weapon as GameTypes.ItemType | null,
        armor: player.equipped.armor as GameTypes.ItemType | null,
        shield: player.equipped.shield as GameTypes.ItemType | null,
      };

      // Create player state
      players[id] = {
        id,
        position: { x: player.x, y: player.y },
        hp: player.hp,
        maxHp: player.maxHp,
        prayer: 60, // Default values for now
        maxPrayer: 60,
        energy: 100,
        maxEnergy: 100,
        skills,
        inventory,
        equipped,
        combatStyle: player.combatStyle as GameTypes.CombatStyle,
        isMoving: player.animation === 'walk',
        targetPosition: null, // We don't have this in the server state yet
        inCombat: player.inCombat,
        currentTargetId: player.currentTargetId,
      };
    });

    // Create loot drops
    const lootDrops: Record<
      string,
      { id: string; type: GameTypes.ItemType; quantity: number; position: GameTypes.Position }
    > = {};

    state.lootDrops.forEach((loot: any, id: string) => {
      lootDrops[id] = {
        id,
        type: loot.itemType as GameTypes.ItemType,
        quantity: loot.quantity,
        position: { x: loot.x, y: loot.y },
      };
    });

    // Create world state
    const world: GameTypes.WorldState = {
      currentBiome: state.currentBiome as GameTypes.BiomeType,
      seed: state.seed,
      rooms: [], // We don't have rooms in the server state yet
      currentRoomId: null,
    };

    // Create UI state (client-side only)
    const ui: GameTypes.UIState = {
      selectedInventorySlot: null,
      damageNumbers: [],
      skillPopups: [],
    };

    // Get the current player (first player for now)
    const playerIds = Object.keys(players);
    const currentPlayerId = playerIds.length > 0 ? playerIds[0] : '';
    const player = players[currentPlayerId] || {
      id: '',
      position: { x: 0, y: 0 },
      hp: 99,
      maxHp: 99,
      prayer: 60,
      maxPrayer: 60,
      energy: 100,
      maxEnergy: 100,
      skills: {
        attack: { level: 1, xp: 0 },
        strength: { level: 1, xp: 0 },
        defence: { level: 1, xp: 0 },
        mining: { level: 1, xp: 0 },
        woodcutting: { level: 1, xp: 0 },
        fishing: { level: 1, xp: 0 },
      },
      inventory: Array(28).fill(null),
      equipped: {
        weapon: null,
        armor: null,
        shield: null,
      },
      combatStyle: 'accurate' as GameTypes.CombatStyle,
      isMoving: false,
      targetPosition: null,
      inCombat: false,
      currentTargetId: null,
    };

    // Create game state
    return {
      player,
      world,
      ui,
    };
  }
}

// Export singleton instance
export const gameService = new GameService();
