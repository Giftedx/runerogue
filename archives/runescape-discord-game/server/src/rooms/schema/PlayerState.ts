import { Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") id = ""; // Or use client.sessionId directly in GameRoom
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") health = 100; // Default health
  @type("number") currentLevel = 1;
  @type("number") xp = 0; // Added as per plan step 19
}
