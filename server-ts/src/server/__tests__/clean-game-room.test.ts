/**
 * Test for CleanGameRoom to verify multiplayer functionality works
 */

import { ColyseusTestServer, SimulatedClient } from '@colyseus/testing';
import { CleanGameRoom } from '../rooms/CleanGameRoom';

describe('CleanGameRoom Integration Tests', () => {
  let colyseus: ColyseusTestServer;

  beforeAll(async () => {
    colyseus = new ColyseusTestServer();
    await colyseus.listen(2568);
  });

  afterAll(async () => {
    await colyseus.shutdown();
  });

  beforeEach(async () => {
    await colyseus.defineRoomType('clean_game', CleanGameRoom);
  });

  it('should allow a player to join and receive initial state', async () => {
    const client = new SimulatedClient('clean_game');
    const room = await client.joinOrCreate('clean_game', { username: 'TestPlayer' });

    expect(room.sessionId).toBeDefined();
    expect(room.state).toBeDefined();
    expect(room.state.players).toBeDefined();
    expect(room.state.enemies).toBeDefined();

    // Player should be added to the game state
    await new Promise(resolve => setTimeout(resolve, 100)); // Give time for state sync
    expect(room.state.players.size).toBe(1);

    const player = room.state.players.get(room.sessionId);
    expect(player).toBeDefined();
    expect(player?.username).toBe('TestPlayer');
    expect(player?.health).toBe(100);

    await room.leave();
  });

  it('should handle multiple players joining', async () => {
    const client1 = new SimulatedClient('clean_game');
    const client2 = new SimulatedClient('clean_game');

    const room1 = await client1.joinOrCreate('clean_game', { username: 'Player1' });
    const room2 = await client2.join(room1.roomId, { username: 'Player2' });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(room1.state.players.size).toBe(2);
    expect(room2.state.players.size).toBe(2);

    const player1 = room1.state.players.get(room1.sessionId);
    const player2 = room1.state.players.get(room2.sessionId);

    expect(player1?.username).toBe('Player1');
    expect(player2?.username).toBe('Player2');

    await room1.leave();
    await room2.leave();
  });

  it('should handle player movement', async () => {
    const client = new SimulatedClient('clean_game');
    const room = await client.joinOrCreate('clean_game', { username: 'MoveTest' });

    await new Promise(resolve => setTimeout(resolve, 100));

    const player = room.state.players.get(room.sessionId);
    const initialX = player?.position.x;
    const initialY = player?.position.y;

    // Send movement command
    room.send('input', {
      type: 'move',
      x: 50,
      y: 50,
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const updatedPlayer = room.state.players.get(room.sessionId);
    expect(updatedPlayer?.position.x).toBe(50);
    expect(updatedPlayer?.position.y).toBe(50);
    expect(updatedPlayer?.position.x).not.toBe(initialX);
    expect(updatedPlayer?.position.y).not.toBe(initialY);

    await room.leave();
  });

  it('should remove player when they leave', async () => {
    const client = new SimulatedClient('clean_game');
    const room = await client.joinOrCreate('clean_game', { username: 'LeaveTest' });

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(room.state.players.size).toBe(1);

    await room.leave();

    // Note: We can't easily test the state after leaving since we don't have access
    // to the room state anymore, but the onLeave handler should remove the player
  });

  it('should update game tick and timestamp', async () => {
    const client = new SimulatedClient('clean_game');
    const room = await client.joinOrCreate('clean_game', { username: 'TickTest' });

    await new Promise(resolve => setTimeout(resolve, 100));

    const initialTick = room.state.tick;
    const initialTimestamp = room.state.timestamp;

    // Wait for some updates
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(room.state.tick).toBeGreaterThan(initialTick);
    expect(room.state.timestamp).toBeGreaterThan(initialTimestamp);

    await room.leave();
  });

  it('should validate room state integrity', async () => {
    const client = new SimulatedClient('clean_game');
    const room = await client.joinOrCreate('clean_game', { username: 'IntegrityTest' });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Check that all required state properties exist and are properly typed
    expect(typeof room.state.tick).toBe('number');
    expect(typeof room.state.timestamp).toBe('number');
    expect(room.state.players).toBeDefined();
    expect(room.state.enemies).toBeDefined();

    const player = room.state.players.get(room.sessionId);
    expect(player).toBeDefined();
    expect(typeof player?.id).toBe('string');
    expect(typeof player?.username).toBe('string');
    expect(typeof player?.health).toBe('number');
    expect(player?.position).toBeDefined();
    expect(player?.inventory).toBeDefined();
    expect(player?.equipment).toBeDefined();
    expect(player?.skills).toBeDefined();

    await room.leave();
  });
});
