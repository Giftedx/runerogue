/**
 * Test working schemas without decorator issues
 */

import 'reflect-metadata';
import { createTestGameState, createTestPlayer } from '../../game/WorkingSchemas';

describe('Working Schemas Test', () => {
  it('should create working player without decorator issues', () => {
    const player = createTestPlayer('player1', 'TestUser');

    expect(player).toBeDefined();
    expect(player.id).toBe('player1');
    expect(player.username).toBe('TestUser');
    expect(player.health).toBe(100);
    expect(player.x).toBe(0);
    expect(player.y).toBe(0);

    console.log('Player created successfully:', {
      id: player.id,
      username: player.username,
      health: player.health,
    });
  });

  it('should handle player movement', () => {
    const player = createTestPlayer();

    player.moveTo(10, 20);

    expect(player.x).toBe(10);
    expect(player.y).toBe(20);

    console.log('Player movement works:', { x: player.x, y: player.y });
  });

  it('should handle player damage', () => {
    const player = createTestPlayer();

    expect(player.health).toBe(100);

    const isDead = player.takeDamage(30);
    expect(player.health).toBe(70);
    expect(isDead).toBe(false);

    const isDeadNow = player.takeDamage(80);
    expect(player.health).toBe(0);
    expect(isDeadNow).toBe(true);

    console.log('Player damage system works correctly');
  });

  it('should create and manage game state', () => {
    const gameState = createTestGameState();
    const player1 = createTestPlayer('p1', 'Player1');
    const player2 = createTestPlayer('p2', 'Player2');

    expect(gameState.players.size).toBe(0);

    gameState.addPlayer(player1);
    gameState.addPlayer(player2);

    expect(gameState.players.size).toBe(2);
    expect(gameState.players.get('p1')).toBe(player1);
    expect(gameState.players.get('p2')).toBe(player2);

    gameState.removePlayer('p1');
    expect(gameState.players.size).toBe(1);
    expect(gameState.players.get('p1')).toBeUndefined();
    expect(gameState.players.get('p2')).toBe(player2);

    console.log('Game state management works correctly');
  });

  it('should update game tick', () => {
    const gameState = createTestGameState();

    expect(gameState.tick).toBe(0);

    gameState.updateTick();
    expect(gameState.tick).toBe(1);

    gameState.updateTick();
    expect(gameState.tick).toBe(2);

    console.log('Game tick system works correctly');
  });
});
