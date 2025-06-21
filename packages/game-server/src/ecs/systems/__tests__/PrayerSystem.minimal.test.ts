import { createWorld, addEntity, addComponent } from "bitecs";
import { Prayer } from "../../components";
import { createPrayerSystem } from "../PrayerSystem";
import type { PrayerSystemOptions } from "../PrayerSystem";
import type { CombatWorld } from "../CombatSystem";

/**
 * Minimal test case to diagnose the Prayer drain timer issue.
 * This test focuses specifically on whether the timer accumulates correctly.
 */
describe("PrayerSystem - Minimal Diagnosis", () => {
  it("timer accumulates correctly when component is properly added", () => {
    const world = createWorld() as CombatWorld;
    world.time = { delta: 600, elapsed: 0 };
    world.entitiesToRemove = new Set();
    world.room = {} as any;

    const eid = addEntity(world);

    // CRITICAL: Add the component first!
    addComponent(world, Prayer, eid);

    // Now set the values
    Prayer.current[eid] = 10;
    Prayer.max[eid] = 10;
    Prayer.activeMask[eid] = 1; // Simple single prayer active
    // drainTimer starts at 0 by default

    const options: PrayerSystemOptions = {
      getDrainRate: () => 20, // Simple constant drain rate (points/minute)
      getPrayerBonus: () => 0, // No equipment bonus
    };
    const system = createPrayerSystem(options);

    // Test a few ticks to see if timer accumulates
    console.log(
      `Initial: current=${Prayer.current[eid]}, timer=${Prayer.drainTimer[eid]}`
    );

    // Tick 1
    system(world);
    console.log(
      `Tick 1: current=${Prayer.current[eid]}, timer=${Prayer.drainTimer[eid]}`
    );

    // Tick 2
    system(world);
    console.log(
      `Tick 2: current=${Prayer.current[eid]}, timer=${Prayer.drainTimer[eid]}`
    );

    // Tick 3
    system(world);
    console.log(
      `Tick 3: current=${Prayer.current[eid]}, timer=${Prayer.drainTimer[eid]}`
    );

    // The timer should be accumulating (600 + 600 + 600 = 1800ms)
    expect(Prayer.drainTimer[eid]).toBeGreaterThan(0);
    expect(Prayer.drainTimer[eid]).toBeCloseTo(1800, 1);
  });

  it("demonstrates the bug when component is NOT properly added", () => {
    const world = createWorld() as CombatWorld;
    world.time = { delta: 600, elapsed: 0 };
    world.entitiesToRemove = new Set();
    world.room = {} as any;

    const eid = addEntity(world);

    // BUG: Setting values WITHOUT calling addComponent first
    Prayer.current[eid] = 10;
    Prayer.max[eid] = 10;
    Prayer.activeMask[eid] = 1;

    const options: PrayerSystemOptions = {
      getDrainRate: () => 20,
      getPrayerBonus: () => 0,
    };
    const system = createPrayerSystem(options);

    console.log(
      `Initial (no addComponent): current=${Prayer.current[eid]}, timer=${Prayer.drainTimer[eid]}`
    );

    // This should fail to accumulate timer
    system(world);
    console.log(
      `After system call: current=${Prayer.current[eid]}, timer=${Prayer.drainTimer[eid]}`
    );

    // Timer will remain 0 because component wasn't properly registered
    expect(Prayer.drainTimer[eid]).toBe(0);
  });
});
