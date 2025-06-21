import express from "express";
import type { Express } from "express";
import request from "supertest";
import { configureApi } from "../api";
import type { OSRSCombatStats, OSRSEquipmentBonuses } from "@runerogue/shared";

// Mock the osrs-data module
jest.mock("@runerogue/osrs-data", () => ({
  calculateMaxHit: jest.fn(
    (
      stats: OSRSCombatStats,
      equipment: OSRSEquipmentBonuses,
      prayerMultiplier?: number,
      styleBonus?: number
    ) => {
      // Simple mock calculation for testing purposes
      return (
        Number(stats.strength ?? 0) * Number(prayerMultiplier ?? 1.0) +
        Number(equipment.strengthBonus ?? 0) +
        Number(styleBonus ?? 0)
      );
    }
  ),
  calculateAccuracy: jest.fn(
    (
      attackerStats: OSRSCombatStats,
      attackerEquipment: OSRSEquipmentBonuses,
      defenderStats: OSRSCombatStats,
      defenderEquipment: OSRSEquipmentBonuses
    ) => ({
      attackRoll:
        Number(attackerStats.attack ?? 0) +
        Number(attackerEquipment.attackBonus ?? 0),
      defenceRoll:
        Number(defenderStats.defence ?? 0) +
        Number(defenderEquipment.defenceBonus ?? 0),
    })
  ),
  calculateCombatLevel: jest.fn((stats: OSRSCombatStats) => {
    // Simplified mock calculation
    return Math.floor(
      (Number(stats.attack ?? 0) +
        Number(stats.strength ?? 0) +
        Number(stats.defence ?? 0) +
        Number(stats.hitpoints ?? 0)) /
        4
    );
  }),
}));

describe("OSRS API Endpoints", () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    configureApi(app);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/osrs/combat/max-hit", () => {
    it("should calculate max hit with valid data", async () => {
      const payload = {
        stats: {
          attack: 99,
          strength: 99,
          defence: 99,
          hitpoints: 99,
          ranged: 99,
          magic: 99,
          prayer: 77,
        },
        equipment: {
          attackBonus: 10,
          strengthBonus: 120,
          defenceBonus: 5,
        },
        prayerMultiplier: 1.23,
        styleBonus: 3,
      };

      const response = await request(app)
        .post("/api/osrs/combat/max-hit")
        .send(payload);

      expect(response.status).toBe(200);
      // Mocked calculation: (99 * 1.23) + 120 + 3 = 121.77 + 123 = 244.77
      expect(response.body.maxHit).toBeCloseTo(244.77);
    });

    it("should return 400 if stats or equipment are missing", async () => {
      const response = await request(app)
        .post("/api/osrs/combat/max-hit")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Missing required parameters: stats and equipment"
      );
    });

    it("should return 400 if equipment is missing", async () => {
      const stats = {
        attack: 99,
        strength: 99,
        defence: 99,
        hitpoints: 99,
        ranged: 99,
        magic: 99,
        prayer: 77,
      };

      const response = await request(app)
        .post("/api/osrs/combat/max-hit")
        .send({ stats });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Missing required parameters: stats and equipment"
      );
    });

    it("should return 500 for server errors", async () => {
      const { calculateMaxHit } = jest.requireMock("@runerogue/osrs-data");
      calculateMaxHit.mockImplementationOnce(() => {
        throw new Error("Test error");
      });

      const payload = {
        stats: {
          attack: 1,
          strength: 1,
          defence: 1,
          hitpoints: 1,
          ranged: 1,
          magic: 1,
          prayer: 1,
        },
        equipment: { attackBonus: 1, strengthBonus: 1, defenceBonus: 1 },
      };

      const response = await request(app)
        .post("/api/osrs/combat/max-hit")
        .send(payload);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });
  });

  describe("POST /api/osrs/combat/accuracy", () => {
    it("should calculate accuracy with valid data", async () => {
      const payload = {
        attackerStats: {
          attack: 90,
          strength: 90,
          defence: 1,
          hitpoints: 99,
          ranged: 1,
          magic: 1,
          prayer: 1,
        },
        attackerEquipment: {
          attackBonus: 100,
          strengthBonus: 80,
          defenceBonus: 0,
        },
        defenderStats: {
          attack: 1,
          strength: 1,
          defence: 75,
          hitpoints: 99,
          ranged: 1,
          magic: 1,
          prayer: 1,
        },
        defenderEquipment: {
          attackBonus: 0,
          strengthBonus: 0,
          defenceBonus: 200,
        },
      };

      const response = await request(app)
        .post("/api/osrs/combat/accuracy")
        .send(payload);

      expect(response.status).toBe(200);
      // Mocked calculation: attackRoll = 90 + 100 = 190, defenceRoll = 75 + 200 = 275
      expect(response.body).toEqual({
        attackRoll: 190,
        defenceRoll: 275,
      });
    });

    it("should return 400 for missing parameters", async () => {
      const response = await request(app)
        .post("/api/osrs/combat/accuracy")
        .send({ attackerStats: {}, attackerEquipment: {} });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Missing required parameters");
    });
  });

  describe("POST /api/osrs/combat/combat-level", () => {
    it("should calculate combat level with valid stats", async () => {
      const stats: OSRSCombatStats = {
        attack: 60,
        strength: 80,
        defence: 70,
        hitpoints: 75,
        ranged: 50,
        magic: 50,
        prayer: 52,
      };

      const response = await request(app)
        .post("/api/osrs/combat/combat-level")
        .send(stats);

      expect(response.status).toBe(200);
      // Mocked calculation: (60 + 80 + 70 + 75) / 4 = 71.25 -> 71
      expect(response.body.combatLevel).toBe(71);
    });

    it("should return 400 for missing stats", async () => {
      const response = await request(app)
        .post("/api/osrs/combat/combat-level")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing or invalid stats object");
    });
  });
});
