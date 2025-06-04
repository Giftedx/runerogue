// src/database/db.ts

import { PlayerData } from './models';

/**
 * Placeholder for database connection and operations.
 * In a real application, this would use a proper ORM (e.g., TypeORM, Prisma) and a PostgreSQL client.
 */
class Database {
  private players: Map<string, PlayerData> = new Map(); // In-memory mock database

  constructor() {
    console.log('Initializing mock database...');
    // Add some dummy data
    const dummyPlayer: PlayerData = {
      id: 'dummy_player_1',
      username: 'TestPlayer',
      x: 50,
      y: 50,
      health: 100,
      level: 1,
      experience: 0,
      inventory: [],
      equipment: { slot: 'weapon', itemId: 'bronze_sword' },
      lastLogin: new Date(),
      createdAt: new Date(),
    };
    this.players.set(dummyPlayer.id, dummyPlayer);
  }

  public async getPlayerById(id: string): Promise<PlayerData | undefined> {
    console.log(`Fetching player with ID: ${id}`);
    return this.players.get(id);
  }

  public async savePlayer(player: PlayerData): Promise<void> {
    console.log(`Saving player: ${player.username}`);
    this.players.set(player.id, player);
  }

  public async createPlayer(player: PlayerData): Promise<PlayerData> {
    if (this.players.has(player.id)) {
      throw new Error(`Player with ID ${player.id} already exists.`);
    }
    this.players.set(player.id, player);
    console.log(`Created new player: ${player.username}`);
    return player;
  }
}

export const db = new Database();
