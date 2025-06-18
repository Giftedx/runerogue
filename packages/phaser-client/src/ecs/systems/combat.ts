import { defineQuery, IWorld } from "bitecs";
import { Health, MeleeAttack, Player, Stats, Target } from "../components";
import { calculateAccuracy, calculateMaxHit } from "@runerogue/osrs-data";

// A simplified representation of equipment bonuses.
// In a real scenario, this would be derived from equipped items.
const placeholderEquipment = {
  attackBonus: 10,
  strengthBonus: 8,
  defenceBonus: 20,
};

const meleeAttackQuery = defineQuery([MeleeAttack, Target, Stats]);
const healthQuery = defineQuery([Health, Stats]);

/**
 * Processes melee combat between entities.
 * @param world The game world.
 */
export const meleeCombatSystem = (world: IWorld) => {
  const attackers = meleeAttackQuery(world);

  for (const attackerId of attackers) {
    const targetId = Target.eid[attackerId];

    // Ensure the target is valid and has health/stats
    const targetExists = healthQuery(world).includes(targetId);
    if (!targetExists) {
      // Target is gone or dead, remove component and skip
      // world.removeComponent(world, MeleeAttack, attackerId);
      // world.removeComponent(world, Target, attackerId);
      continue;
    }

    // 1. Get attacker and defender stats
    const attackerStats = {
      attack: Stats.attack[attackerId],
      strength: Stats.strength[attackerId],
      defence: Stats.defence[attackerId],
    };
    const defenderStats = {
      attack: Stats.attack[targetId],
      strength: Stats.strength[targetId],
      defence: Stats.defence[targetId],
    };

    // 2. Calculate accuracy and max hit using osrs-data formulas
    const accuracy = calculateAccuracy(
      attackerStats,
      placeholderEquipment, // Attacker equipment
      defenderStats,
      placeholderEquipment // Defender equipment
    );
    const maxHit = calculateMaxHit(
      attackerStats,
      placeholderEquipment // Attacker equipment
    );

    // 3. Determine if the attack hits
    const doesHit = Math.random() < accuracy;

    if (doesHit) {
      // 4. Calculate damage
      const damage = Math.floor(Math.random() * (maxHit + 1));

      // 5. Apply damage
      Health.current[targetId] -= damage;

      console.log(
        `Entity ${attackerId} hit Entity ${targetId} for ${damage} damage!`
      );
      console.log(
        `Entity ${targetId} health is now ${Health.current[targetId]}`
      );

      // Optional: Add a damage splat entity for visual feedback
    } else {
      console.log(`Entity ${attackerId} missed Entity ${targetId}!`);
    }

    // 6. Remove MeleeAttack component to prevent attacking every frame
    // world.removeComponent(world, MeleeAttack, attackerId);
    // For now, we'll leave it to demonstrate repeated attacks.
    // In a real game, this would be tied to an attack speed timer.
  }
};
