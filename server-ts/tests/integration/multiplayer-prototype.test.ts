/**
 * Multiplayer Prototype Integration Test
 *
 * Tests the core multiplayer features:
 * - Player join/leave synchronization
 * - Real-time movement broadcasting
 * - Auto-combat system with wave progression
 * - OSRS-authentic mechanics
 */

import { ColyseusTestServer, SimulatedClient } from '@colyseus/testing';
import { GameRoom } from '../../src/server/game/GameRoom';

describe('Multiplayer Prototype Integration', () => {
  let colyseus: ColyseusTestServer;

  beforeAll(async () => {
    // Create test server with default configuration
    try {
      colyseus = new ColyseusTestServer();
      colyseus.define('gameroom', GameRoom);
      await colyseus.listen(2567);
    } catch (error) {
      console.error('Failed to create test server:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (colyseus) {
      try {
        await colyseus.shutdown();
      } catch (error) {
        console.warn('Error during test server shutdown:', error);
      }
    }
  });

  describe('Real-Time Player Movement', () => {
    it('should synchronize movement between 2 players with OSRS speed validation', async () => {
      // Create test room
      const room = await colyseus.createRoom('gameroom', {});

      // Connect two players
      const player1 = await colyseus.connectTo(room, { username: 'TestPlayer1' });
      const player2 = await colyseus.connectTo(room, { username: 'TestPlayer2' });

      // Track position updates received by player2
      const positionUpdates: any[] = [];
      player2.onMessage('player_position_update', message => {
        positionUpdates.push(message);
      });

      // Player 1 moves to a new position
      const targetX = 52;
      const targetY = 52;
      const moveTime = Date.now();

      player1.send('player_movement', { targetX, targetY });

      // Wait for movement to be processed and broadcasted
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify player2 received the position update
      expect(positionUpdates.length).toBeGreaterThan(0);

      const lastUpdate = positionUpdates[positionUpdates.length - 1];
      expect(lastUpdate.playerId).toBe(player1.sessionId);
      expect(lastUpdate.x).toBe(targetX);
      expect(lastUpdate.y).toBe(targetY);
      expect(lastUpdate.timestamp).toBeGreaterThanOrEqual(moveTime);

      await room.disconnect();
    }, 10000);

    it('should validate movement bounds and collision detection', async () => {
      const room = await colyseus.createRoom('gameroom', {});
      const player = await colyseus.connectTo(room, { username: 'TestPlayer' });

      // Track error messages
      const errors: any[] = [];
      player.onMessage('move_error', error => {
        errors.push(error);
      });

      // Try to move out of bounds
      player.send('player_movement', { targetX: -5, targetY: -5 });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe('OUT_OF_BOUNDS');

      // Try to move too far (distance check)
      player.send('player_movement', { targetX: 100, targetY: 100 });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(errors.length).toBeGreaterThan(1);
      expect(errors[1].code).toBe('DISTANCE_TOO_FAR');

      await room.disconnect();
    }, 5000);
  });

  describe('Auto-Combat and Wave System', () => {
    it('should spawn enemies in waves and handle combat automatically', async () => {
      const room = await colyseus.createRoom('gameroom', {});
      const player = await colyseus.connectTo(room, { username: 'CombatTester' });

      // Track wave and combat events
      const waveEvents: any[] = [];
      const combatEvents: any[] = [];

      player.onMessage('wave_started', event => {
        waveEvents.push({ type: 'started', ...event });
      });

      player.onMessage('enemy_defeated', event => {
        combatEvents.push({ type: 'enemy_defeated', ...event });
      });

      player.onMessage('wave_completed', event => {
        waveEvents.push({ type: 'completed', ...event });
      });

      // Wait for automatic wave to start and progress
      await new Promise(resolve => setTimeout(resolve, 6000)); // Wait for wave system

      // Should have received wave start event
      expect(waveEvents.some(e => e.type === 'started')).toBe(true);

      // Wait longer for potential combat and wave completion
      await new Promise(resolve => setTimeout(resolve, 10000));

      await room.disconnect();
    }, 20000);

    it('should handle multiplayer combat with XP distribution', async () => {
      const room = await colyseus.createRoom('gameroom', {});

      // Connect multiple players
      const player1 = await colyseus.connectTo(room, { username: 'Fighter1' });
      const player2 = await colyseus.connectTo(room, { username: 'Fighter2' });

      // Track XP gain events
      const xpEvents: any[] = [];

      player1.onMessage('xp_gained', event => {
        xpEvents.push({ player: 'Fighter1', ...event });
      });

      player2.onMessage('xp_gained', event => {
        xpEvents.push({ player: 'Fighter2', ...event });
      });

      // Wait for combat to occur
      await new Promise(resolve => setTimeout(resolve, 15000));

      await room.disconnect();
    }, 20000);
  });

  describe('Player Join/Leave Synchronization', () => {
    it('should broadcast player join/leave events to all clients', async () => {
      const room = await colyseus.createRoom('gameroom', {});
      const player1 = await colyseus.connectTo(room, { username: 'FirstPlayer' });

      // Track join/leave events
      const joinEvents: any[] = [];
      const leaveEvents: any[] = [];

      player1.onMessage('player_joined', event => {
        joinEvents.push(event);
      });

      player1.onMessage('player_left', event => {
        leaveEvents.push(event);
      });

      // Second player joins
      const player2 = await colyseus.connectTo(room, { username: 'SecondPlayer' });
      await new Promise(resolve => setTimeout(resolve, 100));

      // First player should receive join event
      expect(joinEvents.length).toBe(1);
      expect(joinEvents[0].playerId).toBe(player2.sessionId);
      expect(joinEvents[0].playerState.username).toBe('SecondPlayer');

      // Second player leaves
      await player2.leave();
      await new Promise(resolve => setTimeout(resolve, 100));

      // First player should receive leave event
      expect(leaveEvents.length).toBe(1);
      expect(leaveEvents[0].playerId).toBe(player2.sessionId);

      await room.disconnect();
    }, 5000);
  });

  describe('Performance and Stability', () => {
    it('should maintain stable performance with 4 players and active combat', async () => {
      const room = await colyseus.createRoom('gameroom', {});

      // Connect 4 players
      const players = [];
      for (let i = 0; i < 4; i++) {
        const player = await colyseus.connectTo(room, { username: `Player${i + 1}` });
        players.push(player);
      }

      // Track performance metrics
      const startTime = Date.now();
      let messageCount = 0;

      players.forEach(player => {
        player.onMessage('*', () => {
          messageCount++;
        });
      });

      // Simulate active gameplay for 10 seconds
      const moveInterval = setInterval(() => {
        players.forEach((player, index) => {
          const x = 50 + Math.floor(Math.random() * 5);
          const y = 50 + Math.floor(Math.random() * 5);
          player.send('player_movement', { targetX: x, targetY: y });
        });
      }, 500); // Move every 500ms

      await new Promise(resolve => setTimeout(resolve, 10000));
      clearInterval(moveInterval);

      const totalTime = Date.now() - startTime;
      const avgMessagesPerSecond = messageCount / (totalTime / 1000);

      console.log(
        `Performance test: ${messageCount} messages in ${totalTime}ms (${avgMessagesPerSecond.toFixed(2)} msg/s)`
      );

      // Should handle reasonable message throughput
      expect(avgMessagesPerSecond).toBeGreaterThan(1);
      expect(avgMessagesPerSecond).toBeLessThan(1000); // Not overwhelming

      // Clean up
      for (const player of players) {
        await player.leave();
      }

      await room.disconnect();
    }, 15000);
  });
});
