import { createWorld, addEntity } from "bitecs";
import { Prayer } from "../../components";
import { createPrayerSystem } from "../PrayerSystem";
import type { PrayerSystemOptions } from "../PrayerSystem";

describe("PrayerSystem", () => {
  it("drains prayer points over time and deactivates prayers at zero", () => {
    const world = createWorld();
    // @ts-expect-error: test mock
    world.time = { delta: 600, elapsed: 0 }; // 1 OSRS tick (ms)
    const eid = addEntity(world);
    Prayer.current[eid] = 10;
    Prayer.max[eid] = 10;
    Prayer.drainTimer[eid] = 0;
    Prayer.activeMask[eid] = 1; // Assume prayer 0 is active

    // Drain rate: 60 points/minute (1 per second)
    const options: PrayerSystemOptions = {
      getDrainRate: () => 60,
      getPrayerBonus: () => 0,
      onPrayerDepleted: jest.fn(),
    };
    const system = createPrayerSystem(options);

    // Simulate 10 seconds (should drain all points)
    for (let t = 0; t < 10; t++) {
      world.time.delta = 1000;
      system(world);
    }
    expect(Prayer.current[eid]).toBe(0);
    expect(Prayer.activeMask[eid]).toBe(0);
    expect(options.onPrayerDepleted).toHaveBeenCalledWith(eid);
  });

  it("applies equipment prayer bonus to slow drain", () => {
    const world = createWorld();
    // @ts-expect-error: test mock
    world.time = { delta: 600, elapsed: 0 };
    const eid = addEntity(world);
    Prayer.current[eid] = 10;
    Prayer.max[eid] = 10;
    Prayer.drainTimer[eid] = 0;
    Prayer.activeMask[eid] = 1;

    // +15 prayer bonus = 50% longer duration
    const options: PrayerSystemOptions = {
      getDrainRate: () => 60,
      getPrayerBonus: () => 15,
    };
    const system = createPrayerSystem(options);

    // Simulate 10 seconds (should drain only ~6.7 points)
    for (let t = 0; t < 10; t++) {
      world.time.delta = 1000;
      system(world);
    }
    expect(Prayer.current[eid]).toBeGreaterThan(3);
  });
});
