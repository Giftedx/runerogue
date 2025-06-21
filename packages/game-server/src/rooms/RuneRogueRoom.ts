/**
 * @deprecated LEGACY ROOM - This is a simplified, non-ECS prototype implementation.
 * It is kept for reference but is not part of the main game server.
 * The canonical, active room is 'RuneRogueGameRoom' in the '@runerogue/server' package, which uses the ECS architecture.
 *
 * RuneRogue Game Room
 * Main Colyseus room for RuneRogue multiplayer sessions
 *
 * @author agent/backend-infra (The Architect)
 */

import { Room, type Client, type Delayed } from "colyseus";
import {
  GameRoomState,
  PlayerSchema,
  EnemySchema,
} from "../../../shared/src/schemas/GameRoomState";

/**
 * @interface JoinOptions
 * @description Options for a client joining a room.
 * @property {string} [playerName] - The player's desired display name.
 */
interface JoinOptions {
  playerName?: string;
}

/**
 * @type CreateOptions
 * @description Options for creating a new room. Currently empty.
 */
type CreateOptions = Record<string, never>;

export class RuneRogueRoom extends Room<GameRoomState, JoinOptions> {
  maxClients = 4;
  patchRate = 50; // in milliseconds, 20 times per second
  autoDispose = true;

  private gameLoop?: Delayed;

  /**
   * @method onCreate
   * @description Called when the room is created.
   * @param {CreateOptions} _options - The options passed from the client.
   */
  onCreate(_options: CreateOptions) {
    this.state = new GameRoomState();

    // Set up the game loop
    this.gameLoop = this.clock.setInterval(() => {
      this.update();
    }, 1000 / this.patchRate);

    this.onMessage(
      "move",
      (client: Client, message: { x: number; y: number }) => {
        const player = this.state.players.get(client.sessionId);
        if (player) {
          player.position.x += message.x;
          player.position.y += message.y;
        }
      }
    );

    this.onMessage("attack", (client: Client, message: { enemyId: string }) => {
      const player = this.state.players.get(client.sessionId);
      const target = this.state.enemies.get(message.enemyId);

      if (player && target) {
        // Simple damage calculation
        const damage = Math.floor(Math.random() * 10) + 1;
        target.health.current -= damage;

        this.broadcast("damageDealt", {
          playerId: client.sessionId,
          enemyId: message.enemyId,
          damage,
          targetHealth: target.health.current,
          targetMaxHealth: target.health.max,
          enemyType: target.type,
        });

        if (target.health.current <= 0) {
          this.state.enemies.delete(message.enemyId);
        }
      }
    });
  }

  /**
   * @method onJoin
   * @description Called when a client joins the room.
   * @param {Client} client - The client that joined.
   * @param {JoinOptions} options - The options passed from the client.
   */
  onJoin(client: Client, options: JoinOptions) {
    console.info(
      `${client.sessionId} joined! Name: ${options.playerName ?? "Guest"}`
    );

    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.name = options.playerName ?? "Player";
    player.position.x = Math.floor(Math.random() * 800);
    player.position.y = Math.floor(Math.random() * 600);
    this.state.players.set(client.sessionId, player);

    // Spawn an enemy when a player joins
    const enemyId = `e-${this.state.enemies.size + 1}`;
    const enemy = new EnemySchema();
    enemy.id = enemyId;
    enemy.position.x = Math.floor(Math.random() * 800);
    enemy.position.y = Math.floor(Math.random() * 600);
    this.state.enemies.set(enemyId, enemy);
  }

  /**
   * @method onLeave
   * @description Called when a client leaves the room.
   * @param {Client} client - The client that left.
   */
  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);

    console.info(
      `${client.sessionId} left! Name: ${player?.name ?? "Unknown"}`
    );
    this.state.players.delete(client.sessionId);

    // Clear the game loop if no players are left
    if (this.clients.length === 0) {
      this.gameLoop?.clear();

      console.info("Room is empty, shutting down game loop.");
    }
  }

  /**
   * @method onDispose
   * @description Called when the room is disposed.
   */
  onDispose() {
    console.info("Disposing room...");
    this.gameLoop?.clear();
  }

  /**
   * @method update
   * @description The main game loop, running at `patchRate`.
   */
  update() {
    // Server-side logic like enemy movement, AI, and physics would go here.
  }
}
