import { defineQuery, type IWorld, type System } from "bitecs";
import { Combat, Enemy, Player } from "../components/Combat";
import { Position } from "../components/Movement";

export interface GameWorld extends IWorld {
  time: {
    delta: number;
    elapsed: number;
    then: number;
  };
}

/**
 * Creates the combat system.
 * @returns A function to run the combat system.
 */
export const createCombatSystem = (): System<GameWorld> => {
  const playerQuery = defineQuery([Player, Position, Combat]);
  const enemyQuery = defineQuery([Enemy, Position, Combat]);

  return (world: GameWorld) => {
    const now = world.time.elapsed;
    const playerEntities = playerQuery(world);
    const enemyEntities = enemyQuery(world);

    for (const playerEid of playerEntities) {
      // Player attacks first enemy in range
      if (
        now - Combat.lastAttackTime[playerEid] <
        Combat.attackSpeed[playerEid]
      ) {
        continue;
      }

      for (const enemyEid of enemyEntities) {
        const distance = Math.hypot(
          Position.x[playerEid] - Position.x[enemyEid],
          Position.y[playerEid] - Position.y[enemyEid]
        );

        if (distance <= Combat.attackRange[playerEid]) {
          // In a real scenario, you'd have a health component and reduce it.
          Combat.lastAttackTime[playerEid] = now;
          break; // Attack one enemy at a time
        }
      }
    }

    for (const enemyEid of enemyEntities) {
      // Enemy attacks first player in range
      if (
        now - Combat.lastAttackTime[enemyEid] <
        Combat.attackSpeed[enemyEid]
      ) {
        continue;
      }

      for (const playerEid of playerEntities) {
        const distance = Math.hypot(
          Position.x[enemyEid] - Position.x[playerEid],
          Position.y[enemyEid] - Position.y[playerEid]
        );

        if (distance <= Combat.attackRange[enemyEid]) {
          Combat.lastAttackTime[enemyEid] = now;
          break; // Attack one player at a time
        }
      }
    }

    return world;
  };
};
