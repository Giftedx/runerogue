/**
 * Simple test room to verify client-server connectivity
 * This bypasses schema compatibility issues for basic testing
 */

import { Room, Client } from "colyseus";
import { MapSchema, Schema, type } from "@colyseus/schema";

export class SimplePlayer extends Schema {
  @type("string")
  id: string = "";

  @type("number")
  x: number = 0;

  @type("number")
  y: number = 0;

  @type("number")
  health: number = 100;

  constructor() {
    super();
  }
}

export class SimpleGameState extends Schema {
  @type({ map: SimplePlayer })
  players: MapSchema<SimplePlayer> = new MapSchema<SimplePlayer>();

  constructor() {
    super();
  }
}

export class SimpleTestRoom extends Room<SimpleGameState> {
  onCreate(options: any) {
    console.log("SimpleTestRoom created!", options);
    this.setState(new SimpleGameState());

    this.onMessage("move", (client, message) => {
      console.log("Move message from", client.sessionId, message);
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = message.x;
        player.y = message.y;
      }
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    const player = new SimplePlayer();
    player.id = client.sessionId;
    player.x = 100 + Math.random() * 200;
    player.y = 100 + Math.random() * 200;
    player.health = 100;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("Room", this.roomId, "disposing...");
  }
}
