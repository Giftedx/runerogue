/**
 * Ultra simple room to test basic schema encoding
 */

import { Room, Client } from '@colyseus/core';
import { UltraSimpleState, createUltraSimpleState } from '../schemas/UltraSimpleSchema';

export class UltraSimpleRoom extends Room<UltraSimpleState> {
  maxClients = 4;
  patchRate = 1000 / 10; // 10 FPS for testing

  onCreate(options: any) {
    console.log('UltraSimpleRoom created with options:', options);

    // Initialize ultra simple state
    this.state = createUltraSimpleState();

    // Set up ultra simple game loop
    this.setSimulationInterval(() => this.ultraSimpleUpdate());

    console.log('UltraSimpleRoom state initialized');
  }
  onJoin(client: Client, options: any) {
    console.log(`Player ${client.sessionId} joining UltraSimpleRoom`);
    this.state.playerCount++;
    this.state.message = `${this.state.playerCount} players connected`;
    console.log(`Players in room: ${this.state.playerCount}`);
    console.log(`State values after join:`, {
      tick: this.state.tick,
      playerCount: this.state.playerCount,
      message: this.state.message,
    });

    // Send state as JSON message for debugging
    client.send('stateDebug', {
      tick: this.state.tick,
      playerCount: this.state.playerCount,
      message: this.state.message,
    });
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Player ${client.sessionId} left UltraSimpleRoom (consented: ${consented})`);
    this.state.playerCount--;
    this.state.message = `${this.state.playerCount} players connected`;
    console.log(`Players remaining: ${this.state.playerCount}`);
  }

  onDispose() {
    console.log('UltraSimpleRoom disposed');
  }

  private ultraSimpleUpdate() {
    // Ultra minimal game loop - just update tick
    this.state.tick++;

    // Log every 50 ticks
    if (this.state.tick % 50 === 0) {
      console.log(`UltraSimpleRoom tick: ${this.state.tick}, players: ${this.state.playerCount}`);
    }
  }
}
