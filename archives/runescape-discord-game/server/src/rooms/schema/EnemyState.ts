import { Schema, type } from "@colyseus/schema";

export class EnemyState extends Schema {
  @type("string") id: string;
  @type("string") type: string; // e.g., "Goblin", "Skeleton"
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") health: number = 0; // Will be set based on enemy type
}
