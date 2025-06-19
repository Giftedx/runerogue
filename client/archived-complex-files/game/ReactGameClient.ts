/**
 * React-friendly Game Client Service
 * Handles connection to Colyseus game server for React components
 */

import { Client, Room } from "colyseus.js";

export interface ReactGameState {
  players: Map<string, any>;
  world: any;
  // Add more game state properties as needed
}

export interface GameClientEvents {
  onStateChange: (state: ReactGameState) => void;
  onPlayerJoin: (player: any) => void;
  onPlayerLeave: (sessionId: string) => void;
  onError: (error: any) => void;
  onDisconnect: () => void;
}

export class ReactGameClient {
  private client: Client | null = null;
  private room: Room<ReactGameState> | null = null;
  private events: Partial<GameClientEvents> = {};
  private isConnected: boolean = false;

  /**
   * Connect to the game server
   */
  async connect(
    serverUrl: string,
    roomName: string = "runerogue",
  ): Promise<void> {
    try {
      console.log(`Connecting to game server at ${serverUrl}...`);

      this.client = new Client(serverUrl);

      // Join or create a room
      this.room = await this.client.joinOrCreate<ReactGameState>(roomName, {
        // Add any room options here
        name: this.generatePlayerName(),
      });

      this.isConnected = true;
      console.log(`Connected to room: ${this.room.id}`);

      // Set up room event listeners
      this.setupRoomEvents();
    } catch (error) {
      console.error("Failed to connect to game server:", error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect from the game server
   */
  disconnect(): void {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }

    if (this.client) {
      this.client = null;
    }

    this.isConnected = false;
    console.log("Disconnected from game server");
  }

  /**
   * Set up room event listeners
   */
  private setupRoomEvents(): void {
    if (!this.room) return;

    // Room state change
    this.room.onStateChange((state: ReactGameState) => {
      console.log("Game state updated:", state);
      this.events.onStateChange?.(state);
    });

    // Player joined
    this.room.onMessage("player_joined", (player: any) => {
      console.log("Player joined:", player);
      this.events.onPlayerJoin?.(player);
    });

    // Player left
    this.room.onMessage("player_left", (sessionId: string) => {
      console.log("Player left:", sessionId);
      this.events.onPlayerLeave?.(sessionId);
    });

    // Error handling
    this.room.onError((code: number, message?: string) => {
      console.error("Room error:", code, message);
      this.events.onError?.({ code, message });
    });

    // Room disconnection
    this.room.onLeave((code: number) => {
      console.log("Left room with code:", code);
      this.isConnected = false;
      this.events.onDisconnect?.();
    });
  }

  /**
   * Send a message to the server
   */
  sendMessage(type: string, data: any = {}): void {
    if (!this.room) {
      console.warn("Cannot send message: not connected to room");
      return;
    }

    this.room.send(type, data);
  }

  /**
   * Register event handlers
   */
  on<K extends keyof GameClientEvents>(
    event: K,
    handler: GameClientEvents[K],
  ): void {
    this.events[event] = handler;
  }

  /**
   * Remove event handler
   */
  off<K extends keyof GameClientEvents>(event: K): void {
    delete this.events[event];
  }

  /**
   * Check if connected to server
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get current room information
   */
  getRoomInfo(): { id: string; sessionId: string } | null {
    if (!this.room) return null;

    return {
      id: this.room.id,
      sessionId: this.room.sessionId,
    };
  }

  /**
   * Get current game state
   */
  getGameState(): ReactGameState | null {
    return this.room?.state || null;
  }

  /**
   * Send player action
   */
  sendPlayerAction(action: string, data: any = {}): void {
    this.sendMessage("player_action", { action, ...data });
  }

  /**
   * Send chat message
   */
  sendChatMessage(message: string): void {
    this.sendMessage("chat_message", { message });
  }

  /**
   * Send player movement
   */
  sendPlayerMovement(x: number, y: number, direction?: string): void {
    this.sendMessage("player_movement", { x, y, direction });
  }

  /**
   * Generate a default player name
   */
  private generatePlayerName(): string {
    const adjectives = ["Brave", "Swift", "Mighty", "Clever", "Bold", "Noble"];
    const nouns = ["Warrior", "Ranger", "Mage", "Rogue", "Knight", "Archer"];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;

    return `${adjective}${noun}${number}`;
  }

  /**
   * Request game server status
   */
  async getServerStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.client?.endpoint || ""}/api/status`);
      return await response.json();
    } catch (error) {
      console.error("Failed to get server status:", error);
      throw error;
    }
  }
}
