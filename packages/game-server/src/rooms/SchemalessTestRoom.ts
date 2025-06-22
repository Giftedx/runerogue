/**
 * Schema-less test room that uses plain objects for state synchronization
 * This is a fallback approach that doesn't rely on @colyseus/schema decorators
 */

import { Room, Client } from "colyseus";

interface PlayerData {
  id: string;
  x: number;
  y: number;
  health: number;
}

interface GameStateData {
  players: Record<string, PlayerData>;
  lastUpdate: number;
}

export class SchemalessTestRoom extends Room {
  private gameState: GameStateData = {
    players: {},
    lastUpdate: Date.now(),
  };

  onCreate(options: any) {
    console.log("SchemalessTestRoom created!", options);

    // Set initial state as plain object
    this.setState(this.gameState);

    // Handle move messages
    this.onMessage("move", (client, message) => {
      console.log("Move message from", client.sessionId, message);
      if (this.gameState.players[client.sessionId]) {
        this.gameState.players[client.sessionId].x = message.x;
        this.gameState.players[client.sessionId].y = message.y;
        this.gameState.lastUpdate = Date.now();

        // Send update to all clients
        this.broadcast("playerMoved", {
          playerId: client.sessionId,
          x: message.x,
          y: message.y,
        });
      }
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    // Add player to state
    this.gameState.players[client.sessionId] = {
      id: client.sessionId,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      health: 100,
    };

    this.gameState.lastUpdate = Date.now();

    // Send initial state to joining player
    client.send("gameState", this.gameState);

    // Notify other players
    this.broadcast(
      "playerJoined",
      {
        playerId: client.sessionId,
        player: this.gameState.players[client.sessionId],
      },
      { except: client }
    );
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    // Remove player from state
    delete this.gameState.players[client.sessionId];
    this.gameState.lastUpdate = Date.now();

    // Notify remaining players
    this.broadcast("playerLeft", {
      playerId: client.sessionId,
    });
  }

  onDispose() {
    console.log("SchemalessTestRoom disposing...");
  }
}
