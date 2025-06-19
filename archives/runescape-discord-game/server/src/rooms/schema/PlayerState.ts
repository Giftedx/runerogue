import { Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") id: string; // Or use client.sessionId directly in GameRoom
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") health: number = 100; // Default health
  @type("number") currentLevel: number = 1;
  @type("number") xp: number = 0; // Added as per plan step 19
}
