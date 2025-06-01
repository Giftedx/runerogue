import 'reflect-metadata';
import { Schema, MapSchema, type } from '@colyseus/schema';
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
type SchemaFieldType = 'string' | 'number' | 'boolean' | 'map';

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

  constructor(id: string = '', username: string = '') {
    super();
    this.id = id;
    this.username = username;
    this.x = 0;
    this.y = 0;
    this.animation = 'idle';
    this.direction = 'down';
  }
}

/**
 * Game state containing all players
 */
export class GameState extends Schema {
  @type({ map: Player })
  public players = new MapSchema<Player>();

  constructor() {
    super();
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

    // Set up room events
    this.onMessage('chat', (client: Client, message: unknown) => {
      if (typeof message === 'string') {
        this.broadcast('chat', {
          id: client.sessionId,
          message,
        });
      }
    });
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
  }
}
