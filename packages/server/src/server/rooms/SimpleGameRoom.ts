/**
 * @deprecated LEGACY ROOM - This room uses a deprecated, simple schema for testing.
 * It is kept for debugging purposes only and is pending removal.
 * Please use 'RuneRogueGameRoom' as a reference for the current implementation.
 */

/**
 * Simple Test Room using simplified schemas to fix encoding issues
 */

// LEGACY/TEST: Not used in production. Retained for reference or testing only.

import { Room, Client } from '@colyseus/core';
import {
  SimpleGameState,
  SimplePlayer,
  createSimplePlayer,
  createSimpleGameState,
  validateSimplePlayer,
} from '../schemas/SimpleSchemas';

export interface SimpleJoinOptions {
  username?: string;
}

export class SimpleGameRoom extends Room<SimpleGameState> {
  maxClients = 4;
  patchRate = 1000 / 60; // 60 FPS

  onCreate(options: any) {
    console.log('SimpleGameRoom created with options:', options);

    // Initialize simple game state
    this.state = createSimpleGameState();

    // Set up minimal game loop
    this.setSimulationInterval(deltaTime => this.simpleUpdate(deltaTime));
  }

  onJoin(client: Client, options: SimpleJoinOptions) {
    console.log(
      `Player ${client.sessionId} joining SimpleGameRoom with username: ${options.username}`
    );

    const username = options.username || `Player_${client.sessionId.slice(0, 6)}`;
    const player = createSimplePlayer(client.sessionId, username);

    // Validate before adding
    if (validateSimplePlayer(player)) {
      this.state.players.set(client.sessionId, player);
      console.log(`Player ${username} spawned at (${player.x}, ${player.y}) in SimpleGameRoom`);
    } else {
      console.error('Failed to validate simple player:', player);
      throw new Error('Failed to create valid simple player');
    }
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Player ${client.sessionId} left SimpleGameRoom (consented: ${consented})`);
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log('SimpleGameRoom disposed');
  }

  private simpleUpdate(deltaTime: number) {
    // Minimal game loop - just update tick and timestamp
    this.state.tick++;
    this.state.timestamp = Date.now();
  }
}
