import { CombatSystem, AttackResult, CombatStyle } from '../../game/CombatSystem';
import { GameState, Player, NPC } from '../../game/EntitySchemas';

describe('CombatSystem.handlePlayerAction', () => {
  let state: GameState;
  let system: CombatSystem;
  let attacker: Player;
  let npc: NPC;

  beforeEach(() => {
    state = new GameState();
    system = new CombatSystem(state);

    attacker = new Player();
    attacker.id = 'attacker1';
    state.players.set(attacker.id, attacker);

    npc = new NPC('npc1', 'TestNPC', 0, 0, 'npc', []);
    state.npcs.set(npc.id, npc);
  });

  it('should return null for non-attack actions', () => {
    const result = system.handlePlayerAction(attacker.id, { type: 'move', x: 5, y: 5 });
    expect(result).toBeNull();
  });

  it('should return null if target not found', () => {
    const result = system.handlePlayerAction(attacker.id, { type: 'attack', targetId: 'unknown' });
    expect(result).toBeNull();
  });

  it('should call performAttack and return result for valid attack', () => {
    const mockResult: AttackResult = { hit: true, damage: 10, criticalHit: false, effects: [] };
    const performSpy = jest.spyOn(CombatSystem, 'performAttack').mockReturnValue(mockResult as any);

    const action = system.handlePlayerAction(attacker.id, {
      type: 'attack',
      targetId: npc.id,
      combatStyle: CombatStyle.ACCURATE,
      useSpecial: false,
    });
    expect(action).not.toBeNull();
    expect(action).toHaveProperty('result', mockResult);
    expect(action).toHaveProperty('targetId', npc.id);
    expect(performSpy).toHaveBeenCalledWith(attacker, npc, CombatStyle.ACCURATE, false);

    performSpy.mockRestore();
  });
});
