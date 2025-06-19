// src/database/models.ts

/**
 * Defines the schema for a Player in the database.
 */
export interface PlayerData {
  id: string; // Unique player ID, possibly from authentication service
  username: string;
  x: number;
  y: number;
  health: number;
  level: number;
  experience: number;
  inventory: { itemId: string; quantity: number }[];
  equipment: { slot: string; itemId: string };
  lastLogin: Date;
  createdAt: Date;
}

// Placeholder for ORM entities (e.g., TypeORM, Prisma, Sequelize)
// In a real application, these would be decorated classes or schema definitions
// that map to database tables.

export class PlayerEntity implements PlayerData {
  id: string;
  username: string;
  x: number;
  y: number;
  health: number;
  level: number;
  experience: number;
  inventory: { itemId: string; quantity: number }[];
  equipment: { slot: string; itemId: string };
  lastLogin: Date;
  createdAt: Date;

  constructor(data: PlayerData) {
    this.id = data.id;
    this.username = data.username;
    this.x = data.x;
    this.y = data.y;
    this.health = data.health;
    this.level = data.level;
    this.experience = data.experience;
    this.inventory = data.inventory;
    this.equipment = data.equipment;
    this.lastLogin = data.lastLogin;
    this.createdAt = data.createdAt;
  }
}
