/**
 * Minimal test room using @type decorators to fix Symbol.metadata issues
 */

import { Room, Client } from '@colyseus/core';
import {
  MinimalGameState,
  MinimalPlayer,
  createMinimalPlayer,
  createMinimalGameState,
  validateMinimalPlayer,
} from '../schemas/MinimalSchema';

export interface MinimalJoinOptions {
  username?: string;
}

export class MinimalGameRoom extends Room<MinimalGameState> {
  maxClients = 4;
  patchRate = 1000 / 20; // 20 FPS for testing

  onCreate(options: any) {
    console.log('MinimalGameRoom created with options:', options);

    // Initialize minimal game state
    this.state = createMinimalGameState();

    // Set up minimal game loop
    this.setSimulationInterval(deltaTime => this.minimalUpdate(deltaTime));

    console.log('MinimalGameRoom state initialized');
  }

  onJoin(client: Client, options: MinimalJoinOptions) {
    console.log(
      `Player ${client.sessionId} joining MinimalGameRoom with username: ${options.username}`
    );

    const username = options.username || `Player_${client.sessionId.slice(0, 6)}`;
    const player = createMinimalPlayer(client.sessionId, username);

    // Validate before adding
    if (validateMinimalPlayer(player)) {
      this.state.players.set(client.sessionId, player);
      console.log(`Player ${username} spawned at (${player.x}, ${player.y}) in MinimalGameRoom`);
      console.log(`Current players in room: ${this.state.players.size}`);
    } else {
      console.error('Failed to validate minimal player:', player);
      throw new Error('Failed to create valid minimal player');
    }
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Player ${client.sessionId} left MinimalGameRoom (consented: ${consented})`);
    this.state.players.delete(client.sessionId);
    console.log(`Players remaining: ${this.state.players.size}`);
  }

  onDispose() {
    console.log('MinimalGameRoom disposed');
  }

  private minimalUpdate(deltaTime: number) {
    // Very minimal game loop - just update tick
    this.state.tick++;

    // Update timestamp every 60 ticks (about once per second at 20 FPS)
    if (this.state.tick % 60 === 0) {
      this.state.timestamp = Date.now();
      console.log(`MinimalGameRoom tick: ${this.state.tick}, players: ${this.state.players.size}`);
    }
  }
}
