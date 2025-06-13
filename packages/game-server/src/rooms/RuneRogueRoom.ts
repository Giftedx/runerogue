/**
 * RuneRogue Game Room
 * Main Colyseus room for RuneRogue multiplayer sessions
 *
 * @author agent/backend-infra (The Architect)
 */

import { Room, Client } from "colyseus";
import { GameState } from "../schemas/GameState";

export class RuneRogueRoom extends Room<GameState> {
  maxClients = 4; // Discord group limit

  onCreate(options: any) {
    this.setState(new GameState());

    console.log(
      `[${new Date().toISOString()}] RuneRogueRoom created with options:`,
      options
    );

    // Set up message handlers using modern Colyseus v2 pattern
    this.onMessage("*", (client, type, message) => {
      console.log(
        `[${new Date().toISOString()}] Message from ${client.sessionId} - Type: ${type}`,
        message
      );

      // TODO: Handle different message types
      // TODO: Process game actions
      // TODO: Update game state
      // TODO: Broadcast state changes
    });

    // TODO: Initialize game state
    // TODO: Set up game loop
    // TODO: Configure room options
  }

  onJoin(client: Client, options: any) {
    console.log(
      `[${new Date().toISOString()}] Player joined room '${this.roomId}' - Player ID: ${client.sessionId}`
    );
    console.log(
      `[${new Date().toISOString()}] Room '${this.roomId}' state - Players: ${this.clients.length}/${this.maxClients}`
    );

    // TODO: Add player to game state
    // TODO: Send initial game data to client
    // TODO: Broadcast player join to other clients
  }

  onLeave(client: Client, consented: boolean) {
    console.log(
      `[${new Date().toISOString()}] Player left room '${this.roomId}' - Player ID: ${client.sessionId} (consented: ${consented})`
    );
    console.log(
      `[${new Date().toISOString()}] Room '${this.roomId}' state - Players: ${this.clients.length}/${this.maxClients}`
    );

    // TODO: Remove player from game state
    // TODO: Handle disconnection cleanup
    // TODO: Broadcast player leave to other clients
  }

  onDispose() {
    console.log(`[${new Date().toISOString()}] Room '${this.roomId}' disposed`);

    // TODO: Cleanup room resources
    // TODO: Save final game state if needed
  }
}
