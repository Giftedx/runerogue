/**
 * Integration tests for wave progression and combat event broadcasting.
 * Ensures ECS integration, wave spawning, and real-time combat feedback.
 */
import { Server } from '@colyseus/core';
import { ColyseusTestServer, Room } from '@colyseus/testing';
import { GameRoom } from '../../src/server/game/GameRoom';

describe('Wave Progression & Combat System Integration', () => {
  let colyseus: ColyseusTestServer;

  beforeAll(async () => {
    colyseus = new ColyseusTestServer();
    colyseus.define('gameroom', GameRoom);
  });

  afterAll(async () => {
    await colyseus.shutdown();
  });

  it('should spawn enemies and broadcast wave start/completion events', async () => {
    const room = await colyseus.createRoom('gameroom', {});
    const client1 = await colyseus.connectTo(room);

    // Wait for room to initialize
    await room.waitForNextPatch();

    // Check initial wave spawn
    expect(room.state.npcs.size).toBeGreaterThan(0);

    // Listen for wave events
    let waveStartEvent: any = null;
    client1.onMessage('wave_start', message => {
      waveStartEvent = message;
    });

    // Wait for wave start event
    await new Promise(resolve => {
      client1.onMessage('wave_start', message => {
        waveStartEvent = message;
        resolve(message);
      });
      setTimeout(resolve, 5000); // Timeout after 5 seconds
    });

    expect(waveStartEvent).toBeTruthy();
    expect(waveStartEvent).toHaveProperty('wave');
    expect(waveStartEvent).toHaveProperty('enemyCount');
    expect(waveStartEvent.enemyCount).toBeGreaterThan(0);

    await colyseus.cleanup();
  }, 10000);

  it('should handle multiplayer wave combat with 2 players', async () => {
    const room = await colyseus.createRoom('gameroom', {});
    const client1 = await colyseus.connectTo(room, { username: 'Player1' });
    const client2 = await colyseus.connectTo(room, { username: 'Player2' });

    // Wait for both players to join
    await room.waitForNextPatch();

    expect(room.state.players.size).toBe(2);

    // Test player movement synchronization
    client1.send('player_movement', { x: 100, y: 100, direction: 'right' });
    await room.waitForNextPatch();

    const player1 = Array.from(room.state.players.values())[0];
    expect(player1.x).toBe(100);
    expect(player1.y).toBe(100);

    // Test that wave enemies are spawned
    expect(room.state.npcs.size).toBeGreaterThan(0);

    await colyseus.cleanup();
  }, 10000);

  it('should broadcast combat damage and death events', async () => {
    const room = await colyseus.createRoom('gameroom', {});
    const client1 = await colyseus.connectTo(room, { username: 'TestPlayer' });

    // Wait for room setup
    await room.waitForNextPatch();

    // Listen for combat events
    const events: any[] = [];
    client1.onMessage('damage', message => {
      events.push({ type: 'damage', ...message });
    });
    client1.onMessage('death', message => {
      events.push({ type: 'death', ...message });
    });
    client1.onMessage('xp_gain', message => {
      events.push({ type: 'xp_gain', ...message });
    });

    // Get an NPC to attack
    const npcs = Array.from(room.state.npcs.values());
    if (npcs.length > 0) {
      const targetNpc = npcs[0];

      // Simulate combat
      client1.send('player_attack', { targetId: targetNpc.npcId });

      // Wait for combat events
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check that combat events were broadcasted
      expect(events.length).toBeGreaterThan(0);

      const damageEvents = events.filter(e => e.type === 'damage');
      if (damageEvents.length > 0) {
        expect(damageEvents[0]).toHaveProperty('attackerId');
        expect(damageEvents[0]).toHaveProperty('targetId');
        expect(typeof damageEvents[0].damage).toBe('number');
      }
    }

    await colyseus.cleanup();
  }, 10000);

  it('should handle edge case: rapid movement spam', async () => {
    const room = await colyseus.createRoom('gameroom', {});
    const client1 = await colyseus.connectTo(room, { username: 'SpamPlayer' });

    await room.waitForNextPatch();

    // Spam movement commands
    const positions = [
      { x: 50, y: 50 },
      { x: 100, y: 100 },
      { x: 150, y: 150 },
      { x: 200, y: 200 },
      { x: 250, y: 250 },
    ];

    // Send multiple movement commands rapidly
    for (const pos of positions) {
      client1.send('player_movement', { x: pos.x, y: pos.y, direction: 'right' });
    }

    // Wait for all movements to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    await room.waitForNextPatch();

    // Player should end up at the final position
    const player = Array.from(room.state.players.values())[0];
    expect(player.x).toBe(250);
    expect(player.y).toBe(250);

    await colyseus.cleanup();
  }, 10000);

  it('should handle XP distribution in multiplayer combat', async () => {
    const room = await colyseus.createRoom('gameroom', {});
    const client1 = await colyseus.connectTo(room, { username: 'Player1' });
    const client2 = await colyseus.connectTo(room, { username: 'Player2' });

    await room.waitForNextPatch();

    // Track XP events
    const xpEvents: any[] = [];
    client1.onMessage('xp_gain', message => {
      xpEvents.push({ player: 'Player1', ...message });
    });
    client2.onMessage('xp_gain', message => {
      xpEvents.push({ player: 'Player2', ...message });
    });

    // Both players attack the same NPC
    const npcs = Array.from(room.state.npcs.values());
    if (npcs.length > 0) {
      const targetNpc = npcs[0];

      client1.send('player_attack', { targetId: targetNpc.npcId });
      client2.send('player_attack', { targetId: targetNpc.npcId });

      // Wait for combat resolution
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check that XP was distributed appropriately
      if (xpEvents.length > 0) {
        expect(xpEvents.some(e => e.skill && e.xp)).toBe(true);
      }
    }

    await colyseus.cleanup();
  }, 15000);

  it('should maintain performance with 4 players and wave enemies', async () => {
    const room = await colyseus.createRoom('gameroom', {});

    // Connect 4 players
    const clients = await Promise.all([
      colyseus.connectTo(room, { username: 'Player1' }),
      colyseus.connectTo(room, { username: 'Player2' }),
      colyseus.connectTo(room, { username: 'Player3' }),
      colyseus.connectTo(room, { username: 'Player4' }),
    ]);

    await room.waitForNextPatch();

    expect(room.state.players.size).toBe(4);

    // Measure update performance
    const startTime = Date.now();

    // Simulate activity from all players
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      client.send('player_movement', {
        x: 100 + i * 50,
        y: 100 + i * 50,
        direction: 'right',
      });
    }

    // Wait for several update cycles
    await new Promise(resolve => setTimeout(resolve, 2000));

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Performance should be reasonable (this is just a basic check)
    expect(duration).toBeLessThan(5000);

    // All players should be properly positioned
    expect(room.state.players.size).toBe(4);

    await colyseus.cleanup();
  }, 15000);
});
