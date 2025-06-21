import type { GameRoom } from "../rooms/GameRoom";
import {
  calculateAccuracy,
  calculateMaxHit,
} from "@runerogue/osrs-data/calculators/combat";
import type {
  PlayerSchema,
  EnemySchema,
  CombatStatsSchema,
  EquipmentSchema,
  ItemSchema,
} from "@runerogue/shared/schemas/GameRoomState";
import type { OSRSCombatStats, OSRSEquipmentBonuses } from "@runerogue/shared";
import { OSRS_TICK_MS } from "@runerogue/shared";

/**
 * @class CombatSystem
 * @description Manages all combat interactions within the game room, including
 * player attacks, enemy AI attacks, and damage calculations, ensuring they
 * adhere to OSRS (Old School RuneScape) mechanics.
 */
export class CombatSystem {
  private room: GameRoom;

  /**
   * @constructor
   * @param {GameRoom} room - The game room instance.
   */
  constructor(room: GameRoom) {
    this.room = room;
  }

  /**
   * @method playerAttack
   * @description Handles a player's attack on an enemy.
   * @param {string} playerId - The ID of the attacking player.
   * @param {string} targetId - The ID of the targeted enemy.
   */
  playerAttack(playerId: string, targetId: string): void {
    const attacker = this.room.state.players.get(playerId);
    const defender = this.room.state.enemies.get(targetId);

    if (!attacker || !defender || defender.health.current <= 0) {
      return; // Attacker or defender not found, or defender is already defeated
    }

    const now = Date.now();
    const attackSpeed = attacker.equipment.weapon?.attackSpeed ?? 4;
    const timeSinceLastAttack = now - attacker.lastAttackTick;

    if (timeSinceLastAttack < attackSpeed * OSRS_TICK_MS) {
      return; // Attack is on cooldown.
    }

    attacker.lastAttackTick = now;

    const attackerStats = this.mapPlayerStatsToOSRS(attacker.stats);
    const attackerEquipment = this.getPlayerEquipmentBonuses(attacker);

    const defenderStats: OSRSCombatStats = {
      attack: defender.stats.attack,
      strength: defender.stats.strength,
      defence: defender.stats.defence,
      hitpoints: defender.stats.hitpoints,
      ranged: 1, // Default values for non-player entities
      magic: 1,
      prayer: 1,
    };
    const defenderEquipment: OSRSEquipmentBonuses = defender.bonuses;

    const accuracy = calculateAccuracy(
      attackerStats,
      attackerEquipment,
      defenderStats,
      defenderEquipment
    );

    if (Math.random() > accuracy) {
      console.info(`Player ${playerId} MISSED ${targetId}`);
      return;
    }

    const maxHit = calculateMaxHit(attackerStats, attackerEquipment);
    const damage = Math.floor(Math.random() * (maxHit + 1));

    defender.health.current -= damage;

    console.info(`Player ${playerId} HIT ${targetId} for ${damage} damage.`);

    if (defender.health.current <= 0) {
      this.room.state.enemies.delete(targetId);
      console.info(`Enemy ${targetId} has been defeated.`);
    }
  }

  /**
   * @method update
   * @description The main update loop for the combat system, handling enemy AI and attacks.
   * @param {number} _deltaTime - The time elapsed since the last update.
   */
  update(_deltaTime: number): void {
    const now = Date.now();

    this.room.state.enemies.forEach((enemy, enemyId) => {
      if (enemy.health.current <= 0) return;

      this.handleEnemyTargeting(enemy);

      const targetId = enemy.target;
      if (!targetId) return;

      const targetPlayer = this.room.state.players.get(targetId);
      if (!targetPlayer || targetPlayer.health.current <= 0) {
        enemy.target = ""; // Clear target if player is gone or defeated
        return;
      }

      const attackSpeed = 4 * OSRS_TICK_MS; // Assume 4-tick attack speed for all enemies for now
      const timeSinceLastAttack = now - enemy.lastAttackTick;

      if (timeSinceLastAttack >= attackSpeed) {
        enemy.lastAttackTick = now;
        this.enemyAttack(enemy, enemyId, targetPlayer);
      }
    });
  }

  private getPlayerEquipmentBonuses(
    player: PlayerSchema
  ): OSRSEquipmentBonuses {
    const totalBonuses: OSRSEquipmentBonuses = {
      attackStab: 0,
      attackSlash: 0,
      attackCrush: 0,
      attackMagic: 0,
      attackRanged: 0,
      defenceStab: 0,
      defenceSlash: 0,
      defenceCrush: 0,
      defenceMagic: 0,
      defenceRanged: 0,
      meleeStrength: 0,
      rangedStrength: 0,
      magicDamage: 0,
      prayer: 0,
    };

    const equipmentSlots: (keyof EquipmentSchema)[] = [
      "weapon",
      "helmet",
      "chest",
      "legs",
    ];

    for (const slot of equipmentSlots) {
      const item = player.equipment[slot];
      if (item?.bonuses) {
        const bonuses = item.bonuses;
        totalBonuses.attackStab += bonuses.attackStab;
        totalBonuses.attackSlash += bonuses.attackSlash;
        totalBonuses.attackCrush += bonuses.attackCrush;
        totalBonuses.attackMagic += bonuses.attackMagic;
        totalBonuses.attackRanged += bonuses.attackRanged;
        totalBonuses.defenceStab += bonuses.defenceStab;
        totalBonuses.defenceSlash += bonuses.defenceSlash;
        totalBonuses.defenceCrush += bonuses.defenceCrush;
        totalBonuses.defenceMagic += bonuses.defenceMagic;
        totalBonuses.defenceRanged += bonuses.defenceRanged;
        totalBonuses.meleeStrength += bonuses.meleeStrength;
        totalBonuses.rangedStrength += bonuses.rangedStrength;
        totalBonuses.magicDamage += bonuses.magicDamage;
        totalBonuses.prayer += bonuses.prayer;
      }
    }
    return totalBonuses;
  }

  private handleEnemyTargeting(enemy: EnemySchema): void {
    if (enemy.target && this.room.state.players.has(enemy.target)) {
      return;
    }

    let closestPlayerId: string | null = null;
    let minDistance = Infinity;

    this.room.state.players.forEach((player, playerId) => {
      if (player.health.current > 0) {
        const distance = Math.hypot(
          player.position.x - enemy.position.x,
          player.position.y - enemy.position.y
        );
        if (distance < enemy.aggroRange && distance < minDistance) {
          minDistance = distance;
          closestPlayerId = playerId;
        }
      }
    });

    if (closestPlayerId) {
      enemy.target = closestPlayerId;
    }
  }

  private enemyAttack(
    attacker: EnemySchema,
    attackerId: string,
    defender: PlayerSchema
  ): void {
    const attackerStats: OSRSCombatStats = {
      attack: attacker.stats.attack,
      strength: attacker.stats.strength,
      defence: attacker.stats.defence,
      hitpoints: attacker.stats.hitpoints,
      ranged: 1,
      magic: 1,
      prayer: 1,
    };
    const attackerEquipment: OSRSEquipmentBonuses = attacker.bonuses;

    const defenderStats = this.mapPlayerStatsToOSRS(defender.stats);
    const defenderEquipment = this.getPlayerEquipmentBonuses(defender);

    const accuracy = calculateAccuracy(
      attackerStats,
      attackerEquipment,
      defenderStats,
      defenderEquipment
    );

    if (Math.random() > accuracy) {
      console.info(`Enemy ${attackerId} MISSED Player ${defender.id}`);
      return;
    }

    const maxHit = calculateMaxHit(attackerStats, attackerEquipment);
    const damage = Math.floor(Math.random() * (maxHit + 1));

    defender.health.current -= damage;
    console.info(
      `Enemy ${attackerId} HIT Player ${defender.id} for ${damage} damage.`
    );

    if (defender.health.current <= 0) {
      console.info(`Player ${defender.id} has been defeated.`);
    }
  }

  private mapPlayerStatsToOSRS(
    playerStats: CombatStatsSchema
  ): OSRSCombatStats {
    return {
      attack: playerStats.attack.level,
      strength: playerStats.strength.level,
      defence: playerStats.defence.level,
      hitpoints: playerStats.hitpoints.level,
      ranged: playerStats.ranged.level,
      magic: playerStats.magic.level,
      prayer: playerStats.prayer.level,
    };
  }
}
