import { Client, Room } from "colyseus.js";
import { GameRoomState, PlayerSchema, EnemySchema } from "@runerogue/shared";
import type { ServerMessage } from "@runerogue/shared";
import { EventEmitter } from "events";
import type { PhaserGame } from "./PhaserGame";

/**
 * Main game client that connects to Colyseus server and manages game state.
 * Implements client-side prediction and server reconciliation.
 */
export class GameClient {
  private room: Room<GameRoomState> | null = null;
  private gameEngine: PhaserGame;
  private lastServerState: GameRoomState | null = null;
  private localPlayerId: string | null = null;
  /**
   * Event emitter for server events (damage, xpGain, etc.)
   */
  public events: EventEmitter = new EventEmitter();

  /**
   * Send a movement command to the server
   * @param target - Target position (Vector2)
   */
  sendMoveCommand(target: { x: number; y: number }): void {
    if (this.room) {
      this.room.send({ type: "move", target });
    }
  }

  /**
   * Initialize connection to game server
   * @param gameEngine - Reference to the Phaser game engine
   * @param roomId - Optional room ID to join specific room
   * @throws Error if connection fails
   */
  async connect(gameEngine: PhaserGame, roomId?: string): Promise<void> {
    this.gameEngine = gameEngine;
    try {
      const client = new Client("ws://localhost:2567");
      this.room = await client.joinOrCreate<GameRoomState>("game_room", {
        roomId,
      });
      // Colyseus assigns sessionId as the player's unique ID
      this.localPlayerId = this.room.sessionId;
      this.setupEventHandlers();
      this.setupMessageHandlers();
      this.startClientPrediction();
    } catch (error) {
      console.error("Failed to connect to game server:", error);
      throw new Error("Connection failed");
    }
  }
  /**
   * Get the local player's ID (Colyseus sessionId)
   */
  getLocalPlayerId(): string | null {
    return this.localPlayerId;
  }

  /**
   * Handle server state updates with client-side prediction
   */
  private setupEventHandlers(): void {
    if (!this.room) return;
    // Handle state updates
    this.room.onStateChange((state) => {
      this.reconcileServerState(state);
      this.gameEngine.updateFromServerState(state);
    });
    // Handle player join/leave
    this.room.state.players.onAdd = (player, key) => {
      this.gameEngine.createPlayerEntity(player, key);
    };
    this.room.state.players.onRemove = (player, key) => {
      this.gameEngine.removePlayerEntity(key);
    };
    // Handle enemy join/leave
    if (this.room.state.enemies) {
      this.room.state.enemies.onAdd = (enemy, key) => {
        this.gameEngine.createEnemyEntity(enemy, key);
      };
      this.room.state.enemies.onRemove = (enemy, key) => {
        this.gameEngine.removeEnemyEntity(key);
      };
    }
  }

  /**
   * Listen for Colyseus server messages and emit events for combat, XP, etc.
   */
  private setupMessageHandlers(): void {
    if (!this.room) return;
    this.room.onMessage((message: ServerMessage) => {
      // Emit events for combat, XP, level up, etc.
      switch (message.type) {
        case "damage":
        case "xpGain":
        case "levelUp":
        case "waveComplete":
        case "waveStart":
        case "playerDeath":
        case "gameOver":
        case "chatMessage":
          this.events.emit(message.type, message);
          break;
        default:
          // Unknown or unhandled message type
          break;
      }
    });
  }

  /**
   * Reconcile local state with server state for prediction correction
   * @param state - Latest server state
   */
  private reconcileServerState(state: GameRoomState): void {
    this.lastServerState = state;
    // TODO: Implement prediction reconciliation logic
  }

  /**
   * Start client-side prediction loop
   */
  private startClientPrediction(): void {
    // TODO: Implement client-side prediction logic
    // This can be expanded to track local input and predicted state
  }
}
