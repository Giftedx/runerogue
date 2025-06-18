import { Room } from '@colyseus/core';
import { WorldState, Enemy } from '../../game/EntitySchemas';
import { SurvivorWaveSystem } from '../../game/SurvivorWaveSystem';

class MockRoom extends Room<WorldState> {
  public state = new WorldState();
  public broadcastMessages: any[] = [];
  broadcast(type: string, message: unknown): boolean {
    this.broadcastMessages.push({ type, message });
    return true;
  }
}

describe('SurvivorWaveSystem Enemy Spawning (enemies map)', () => {
  let mockRoom: MockRoom;
  let waveSystem: SurvivorWaveSystem;

  beforeEach(() => {
    mockRoom = new MockRoom();
    waveSystem = new SurvivorWaveSystem(mockRoom);
  });

  it('spawns enemies in the enemies map with correct OSRS stats', () => {
    const enemyType = {
      npcId: 'goblin',
      name: 'Goblin',
      level: 2,
      hitpoints: 7,
      attack: 3,
      strength: 4,
      defense: 2,
      spawnWeight: 100,
      spawnCount: 1,
    };
    (waveSystem as any).spawnEnemy(enemyType, 1.0);
    const enemies = Array.from(mockRoom.state.enemies.values());
    expect(enemies.length).toBe(1);
    const enemy = enemies[0] as Enemy;
    expect(enemy.name).toBe('Goblin');
    expect(enemy.attack).toBe(3);
    expect(enemy.strength).toBe(4);
    expect(enemy.defence).toBe(2);
    expect(enemy.maxHealth).toBe(7);
    expect(enemy.health).toBe(7);
  });
});
