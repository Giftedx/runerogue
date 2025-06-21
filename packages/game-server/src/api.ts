import { Router, type Express, type Request, type Response } from "express";

/**
 * @file Manages the Express API routes for the RuneRogue game server.
 * @description This file defines all the API endpoints, handles request validation,
 * and calls the appropriate OSRS calculation functions.
 */

import {
  calculateAccuracy,
  calculateCombatLevel,
  calculateMaxHit,
} from "@runerogue/osrs-data";
import type { OSRSCombatStats, OSRSEquipmentBonuses } from "@runerogue/shared";

/**
 * Configures API routes for the Express app.
 * @param {Express} app The Express application instance.
 */
export function configureApi(app: Express): void {
  const router = Router();

  /**
   * @api {post} /api/osrs/combat/max-hit Calculate OSRS Max Hit
   * @apiName CalculateMaxHit
   * @apiGroup OSRS
   *
   * @apiParam {OSRSCombatStats} stats The combat stats of the player.
   * @apiParam {OSRSEquipmentBonuses} equipment The equipment bonuses of the player.
   * @apiParam {number} [prayerMultiplier=1.0] The prayer damage multiplier (e.g., 1.23 for Piety).
   * @apiParam {number} [styleBonus=0] The combat style bonus (e.g., 3 for Aggressive).
   *
   * @apiSuccess {number} maxHit The calculated maximum hit.
   *
   * @apiError (400) {string} error Missing required parameters: stats and equipment.
   * @apiError (500) {string} error Internal server error.
   */
  router.post("/osrs/combat/max-hit", (req: Request, res: Response) => {
    try {
      const { stats, equipment, prayerMultiplier, styleBonus } = req.body;

      if (!stats || !equipment) {
        return res
          .status(400)
          .json({ error: "Missing required parameters: stats and equipment" });
      }

      const maxHit = calculateMaxHit(
        stats,
        equipment,
        prayerMultiplier,
        styleBonus
      );

      res.status(200).json({ maxHit });
    } catch (error) {
      console.error("Error calculating max hit:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * @api {post} /api/osrs/combat/accuracy Calculate OSRS Combat Accuracy
   * @apiName CalculateAccuracy
   * @apiGroup OSRS
   *
   * @apiParam {OSRSCombatStats} attackerStats The combat stats of the attacker.
   * @apiParam {OSRSEquipmentBonuses} attackerEquipment The equipment bonuses of the attacker.
   * @apiParam {OSRSCombatStats} defenderStats The combat stats of the defender.
   * @apiParam {OSRSEquipmentBonuses} defenderEquipment The equipment bonuses of the defender.
   *
   * @apiSuccess {number} accuracy The calculated accuracy percentage.
   *
   * @apiError (400) {string} error Missing required parameters: attackerStats, attackerEquipment, defenderStats, defenderEquipment.
   * @apiError (500) {string} error Internal server error.
   */
  router.post("/osrs/combat/accuracy", (req: Request, res: Response) => {
    try {
      const {
        attackerStats,
        attackerEquipment,
        defenderStats,
        defenderEquipment,
      } = req.body;

      if (
        !attackerStats ||
        !attackerEquipment ||
        !defenderStats ||
        !defenderEquipment
      ) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const accuracy = calculateAccuracy(
        attackerStats,
        attackerEquipment,
        defenderStats,
        defenderEquipment
      );

      res.json(accuracy);
    } catch (error) {
      console.error("Error calculating accuracy:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * @api {post} /api/osrs/combat/combat-level Calculate OSRS Combat Level
   * @apiName CalculateCombatLevel
   * @apiGroup OSRS
   *
   * @apiParam {OSRSCombatStats} stats The combat stats of the player.
   *
   * @apiSuccess {number} combatLevel The calculated combat level.
   *
   * @apiError (400) {string} error Missing or invalid stats object.
   * @apiError (500) {string} error Internal server error.
   */
  router.post("/osrs/combat/combat-level", (req: Request, res: Response) => {
    try {
      const stats = req.body;

      if (!stats || typeof stats.attack !== "number") {
        return res
          .status(400)
          .json({ error: "Missing or invalid stats object" });
      }

      const combatLevel = calculateCombatLevel(stats);
      res.json({ combatLevel });
    } catch (error) {
      console.error("Error calculating combat level:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.use("/api", router);
}
