import { Schema, type } from "@colyseus/schema";

export class EnemyState extends Schema {
  @type("string") id = "";
  @type("string") type = ""; // e.g., "Goblin", "Skeleton"
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") health = 0; // Will be set based on enemy type
}
