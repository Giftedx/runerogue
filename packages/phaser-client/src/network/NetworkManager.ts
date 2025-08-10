import { Client } from "colyseus.js";

/**
 * NetworkManager handles all client-server communication using Colyseus
 * Provides a clean interface for joining rooms and sending game events
 */
export class NetworkManager {
  private client: Client;
  private room: any;
  private isConnected = false;
  constructor() {
    // Use secure protocols (https/wss) if running on HTTPS, otherwise fallback to http/ws
    const isHttps = window.location.protocol === "https:";
    const httpProtocol = isHttps ? "https:" : "http:";
    const port = "2567";
    const serverUrl = `${httpProtocol}//${window.location.hostname}:${port}`;

    console.log(`Connecting to game server: ${serverUrl}`);
    this.client = new Client(serverUrl);
  }

  /**
   * Join or create a game room
   * @param roomId - The room ID to join
   * @param onJoin - Callback when successfully joined
   * @param onError - Callback for errors
   */
  async joinRoom(
    roomId: string,
    onJoin: () => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      this.room = await this.client.joinOrCreate(roomId);
      this.isConnected = true;
      onJoin();
    } catch (error) {
      onError(error);
    }
  }

  /**
   * Send movement command to server
   * @param x - Target X position
   * @param y - Target Y position
   */
  sendMove(x: number, y: number): void {
    if (this.room && this.isConnected) {
      this.room.send("move", { x, y });
    }
  }

  /**
   * Send attack command to server
   * @param targetId - ID of target to attack
   */
  sendAttack(targetId: string): void {
    if (this.room && this.isConnected) {
      this.room.send("attack", { targetId });
    }
  }

  /**
   * Get the current room instance
   * @returns The current room or null
   */
  getRoom(): any {
    return this.room;
  }

  /**
   * Check if connected to a room
   * @returns Connection status
   */
  isRoomConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from current room
   */
  disconnect(): void {
    if (this.room) {
      this.room.leave();
      this.isConnected = false;
    }
  }
}
