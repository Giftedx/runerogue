/**
 * Clean Game Schemas Test
 * Tests only the working GameSchemas.ts implementation
 */

import { Player, Enemy, GameRoomState } from '../schemas/GameSchemas';

describe('Clean Game Schemas', () => {
  describe('Player Schema', () => {
    it('should create a player with default values', () => {
      const player = new Player();

      expect(player).toBeDefined();
      expect(player.id).toBe('');
      expect(player.username).toBe('');
      expect(player.x).toBe(0);
      expect(player.y).toBe(0);
      expect(player.health).toBe(100);
      expect(player.maxHealth).toBe(100);
      expect(player.combatLevel).toBe(3);
      expect(player.isAttacking).toBe(false);
      expect(player.targetId).toBe('');
      expect(player.lastAction).toBe('');
    });

    it('should allow setting player properties', () => {
      const player = new Player();

      player.id = 'player123';
      player.username = 'TestUser';
      player.x = 50;
      player.y = 75;
      player.health = 80;
      player.combatLevel = 5;
      player.isAttacking = true;
      player.targetId = 'enemy456';
      player.lastAction = 'attack';

      expect(player.id).toBe('player123');
      expect(player.username).toBe('TestUser');
      expect(player.x).toBe(50);
      expect(player.y).toBe(75);
      expect(player.health).toBe(80);
      expect(player.combatLevel).toBe(5);
      expect(player.isAttacking).toBe(true);
      expect(player.targetId).toBe('enemy456');
      expect(player.lastAction).toBe('attack');
    });

    it('should handle skills map', () => {
      const player = new Player();

      // Check default skills (constructor adds 5 skills)
      expect(player.skills.size).toBe(5);
      expect(player.skills.get('attack')).toBe(1);
      expect(player.skills.get('strength')).toBe(1);
      expect(player.skills.get('defence')).toBe(1);
      expect(player.skills.get('hitpoints')).toBe(10);
      expect(player.skills.get('prayer')).toBe(1);

      // Set additional skill levels
      player.skills.set('attack', 10);
      player.skills.set('defence', 15);
      player.skills.set('magic', 12);

      expect(player.skills.get('attack')).toBe(10);
      expect(player.skills.get('defence')).toBe(15);
      expect(player.skills.get('magic')).toBe(12);
      expect(player.skills.size).toBe(6); // 5 default + 1 new
    });

    it('should handle equipment map', () => {
      const player = new Player();

      // Set equipment
      player.equipment.set('weapon', 'iron_sword');
      player.equipment.set('helmet', 'iron_helmet');

      expect(player.equipment.get('weapon')).toBe('iron_sword');
      expect(player.equipment.get('helmet')).toBe('iron_helmet');
      expect(player.equipment.size).toBe(2);
    });
  });

  describe('Enemy Schema', () => {
    it('should create an enemy with default values', () => {
      const enemy = new Enemy();

      expect(enemy).toBeDefined();
      expect(enemy.id).toBe('');
      expect(enemy.type).toBe('');
      expect(enemy.x).toBe(0);
      expect(enemy.y).toBe(0);
      expect(enemy.health).toBe(100);
      expect(enemy.maxHealth).toBe(100);
      expect(enemy.combatLevel).toBe(1);
      expect(enemy.isAggressive).toBe(false);
      expect(enemy.targetId).toBe('');
      expect(enemy.lastAction).toBe('');
    });

    it('should allow setting enemy properties', () => {
      const enemy = new Enemy();

      enemy.id = 'enemy789';
      enemy.type = 'goblin';
      enemy.x = 100;
      enemy.y = 200;
      enemy.health = 50;
      enemy.maxHealth = 75;
      enemy.combatLevel = 8;
      enemy.isAggressive = true;
      enemy.targetId = 'player123';
      enemy.lastAction = 'chase';

      expect(enemy.id).toBe('enemy789');
      expect(enemy.type).toBe('goblin');
      expect(enemy.x).toBe(100);
      expect(enemy.y).toBe(200);
      expect(enemy.health).toBe(50);
      expect(enemy.maxHealth).toBe(75);
      expect(enemy.combatLevel).toBe(8);
      expect(enemy.isAggressive).toBe(true);
      expect(enemy.targetId).toBe('player123');
      expect(enemy.lastAction).toBe('chase');
    });
  });

  describe('GameRoomState Schema', () => {
    it('should create a game room state with default values', () => {
      const gameState = new GameRoomState();

      expect(gameState).toBeDefined();
      expect(gameState.tick).toBe(0);
      expect(gameState.timestamp).toBeGreaterThan(0); // Constructor sets Date.now()
      expect(gameState.waveNumber).toBe(1);
      expect(gameState.enemiesRemaining).toBe(0);
      expect(gameState.gamePhase).toBe('waiting');
      expect(gameState.players).toBeDefined();
      expect(gameState.enemies).toBeDefined();
      expect(gameState.players.size).toBe(0);
      expect(gameState.enemies.size).toBe(0);
    });

    it('should allow adding players to the game state', () => {
      const gameState = new GameRoomState();
      const player1 = new Player();
      const player2 = new Player();

      player1.id = 'player1';
      player1.username = 'User1';
      player2.id = 'player2';
      player2.username = 'User2';

      gameState.players.set('player1', player1);
      gameState.players.set('player2', player2);

      expect(gameState.players.size).toBe(2);
      expect(gameState.players.get('player1')?.username).toBe('User1');
      expect(gameState.players.get('player2')?.username).toBe('User2');
    });

    it('should allow adding enemies to the game state', () => {
      const gameState = new GameRoomState();
      const enemy1 = new Enemy();
      const enemy2 = new Enemy();

      enemy1.id = 'enemy1';
      enemy1.type = 'goblin';
      enemy2.id = 'enemy2';
      enemy2.type = 'orc';

      gameState.enemies.set('enemy1', enemy1);
      gameState.enemies.set('enemy2', enemy2);

      expect(gameState.enemies.size).toBe(2);
      expect(gameState.enemies.get('enemy1')?.type).toBe('goblin');
      expect(gameState.enemies.get('enemy2')?.type).toBe('orc');
    });

    it('should update game state properties', () => {
      const gameState = new GameRoomState();

      gameState.tick = 100;
      gameState.timestamp = Date.now();
      gameState.waveNumber = 3;
      gameState.enemiesRemaining = 5;
      gameState.gamePhase = 'combat';

      expect(gameState.tick).toBe(100);
      expect(gameState.timestamp).toBeGreaterThan(0);
      expect(gameState.waveNumber).toBe(3);
      expect(gameState.enemiesRemaining).toBe(5);
      expect(gameState.gamePhase).toBe('combat');
    });
  });

  describe('Schema Serialization', () => {
    it('should have basic schema functionality', () => {
      const gameState = new GameRoomState();
      const player = new Player();

      player.id = 'test_player';
      player.username = 'TestUser';
      player.x = 50;
      player.y = 100;

      gameState.players.set('test_player', player);
      gameState.tick = 10;
      gameState.timestamp = Date.now();

      // Basic schema operations should work
      expect(gameState.players.get('test_player')).toBe(player);
      expect(gameState.players.get('test_player')?.username).toBe('TestUser');
    });

    it('should support schema operations', () => {
      const gameState = new GameRoomState();
      const player = new Player();

      // Basic schema operations should work
      expect(gameState).toBeInstanceOf(GameRoomState);
      expect(player).toBeInstanceOf(Player);
      
      // Can add to maps
      gameState.players.set('test', player);
      expect(gameState.players.has('test')).toBe(true);
    });
  });
});
