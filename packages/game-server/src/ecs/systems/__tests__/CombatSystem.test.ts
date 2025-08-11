import { createWorld, addEntity, addComponent } from "bitecs";
import { Position, Health, Target, Combat } from "../../components";
import { createCombatSystem } from "../CombatSystem";
import {
  gameEventEmitter,
  GameEventType,
} from "../../../events/GameEventEmitter";
import type { CombatEvent } from "../../../events/types";
import type { CombatWorld } from "../CombatSystem";

describe("CombatSystem", () => {
  it("emits CombatEvent on hit and miss", () => {
    const world = createWorld() as CombatWorld;
    world.time = { delta: 600, elapsed: 3000 }; // ensure time progressed beyond any attack speed
    world.entitiesToRemove = new Set();
    const room = { broadcast: jest.fn() } as any;
    world.room = room;
    // Add attacker and defender and register components per bitECS pattern
    const attacker = addEntity(world);
    const defender = addEntity(world);
    addComponent(world, Position, attacker);
    addComponent(world, Position, defender);
    addComponent(world, Health, attacker);
    addComponent(world, Health, defender);
    addComponent(world, Target, attacker);
    addComponent(world, Combat, attacker);
    addComponent(world, Combat, defender);

    Position.x[attacker] = 0;
    Position.y[attacker] = 0;
    Position.x[defender] = 0;
    Position.y[defender] = 0;
    Health.current[attacker] = 10;
    Health.current[defender] = 10;
    Target.eid[attacker] = defender;
    Combat.lastAttackTime[attacker] = 0;
    Combat.attackSpeed[attacker] = 0;
    Combat.attack[attacker] = 99;
    Combat.strength[attacker] = 99;
    Combat.defence[attacker] = 99;
    Combat.defence[defender] = 1;
    // Listen for CombatEvent
    const events: CombatEvent[] = [];
    gameEventEmitter.onGameEvent(GameEventType.Combat, (e) => events.push(e));
    // Run system
    const system = createCombatSystem(room);
    world.room = room;
    system(world);
    // Should emit at least one event (hit or miss)
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toHaveProperty("attacker", attacker);
    expect(events[0]).toHaveProperty("defender", defender);
    expect(typeof events[0].hit).toBe("boolean");
    expect(typeof events[0].timestamp).toBe("number");
  });
});
