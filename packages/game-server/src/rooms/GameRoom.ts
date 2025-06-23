import { Room, Client } from "colyseus";
import { GameRoomState, PlayerSchema } from "@runerogue/shared/schemas";
import { fixSchemaHierarchy } from "@runerogue/shared/utils";

/**
 * @class GameRoom
 * @description Manages the game state and player interactions for a single game room.
 * This room handles player joining/leaving, state synchronization, and game logic.
 * @author The Architect
 */
export class GameRoom extends Room<GameRoomState> {
  /**
   * @property {number} maxClients
   * @description The maximum number of clients that can connect to this room.
   */
  maxClients = 16;

  /**
   * @method onCreate
   * @description Called when the room is created. Initializes the room state.
   * @param {any} options - Options passed from the client when creating the room.
   */
  onCreate(options: any) {
    console.log("GameRoom created!");

    // Initialize the state with our GameRoomState schema
    this.setState(new GameRoomState());

    // Apply the schema compatibility fix recursively to the entire state
    fixSchemaHierarchy(this.state);

    // Set up a simulation interval for game logic updates
    this.setSimulationInterval((deltaTime) => this.update(deltaTime));

    // Register message handlers
    this.onMessage("move", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = message.x;
        player.y = message.y;
        player.isMoving = true;
        // Add further validation and logic here
      }
    });

    this.onMessage("stopMove", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.isMoving = false;
      }
    });

    this.onMessage("chat", (client, message) => {
      // Handle chat messages
      // Example: this.broadcast("chatMessage", { sender: client.sessionId, message });
    });
  }

  /**
   * @method onJoin
   * @description Called when a new client joins the room.
   * @param {Client} client - The client that joined.
   * @param {any} options - Options passed from the client when joining.
   */
  onJoin(client: Client, options: any) {
    console.log(`${client.sessionId} joined!`);

    // Create a new PlayerSchema instance for the joining client
    const player = new PlayerSchema();
    player.sessionId = client.sessionId;
    player.username =
      options.username || "Player" + Math.floor(Math.random() * 1000);
    player.x = Math.floor(Math.random() * 800);
    player.y = Math.floor(Math.random() * 600);
    // Initialize other player properties as needed

    // Add the new player to the state
    this.state.players.set(client.sessionId, player);
  }

  /**
   * @method onLeave
   * @description Called when a client leaves the room.
   * @param {Client} client - The client that left.
   * @param {boolean} consented - Whether the client left intentionally.
   */
  async onLeave(client: Client, consented: boolean) {
    console.log(`${client.sessionId} left!`);

    // Mark the player as disconnected
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.isConnected = false;
    }

    try {
      if (consented) {
        throw new Error("consented leave");
      }

      // Allow reconnection for a short period
      await this.allowReconnection(client, 60); // 60 seconds
      console.log(`${client.sessionId} reconnected!`);
      if (player) {
        player.isConnected = true;
      }
    } catch (e) {
      console.log(`${client.sessionId} will not reconnect.`);
      // Remove the player from the state if they don't reconnect
      if (this.state.players.has(client.sessionId)) {
        this.state.players.delete(client.sessionId);
      }
    }
  }

  /**
   * @method onDispose
   * @description Called when the room is about to be disposed.
   * Used for cleanup tasks.
   */
  onDispose() {
    console.log(`Room ${this.roomId} disposing...`);
  }

  /**
   * @method update
   * @description The main game loop, called at a fixed interval.
   * @param {number} deltaTime - The time elapsed since the last update.
   */
  update(deltaTime: number) {
    // This is where you would put your main game logic
    // For example, updating enemy positions, checking for combat, etc.
    this.state.serverTime += deltaTime;
  }
}
