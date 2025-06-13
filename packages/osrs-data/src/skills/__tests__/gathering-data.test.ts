/**
 * OSRS Data Validation Tests
 * Ensures all gathering skill data matches OSRS Wiki exactly
 */

import {
  getXpForLevel,
  getLevelFromXp,
  calculateGatheringSuccess,
  calculateBurnChance,
  calculatePetDropChance,
  TREES,
  ROCKS,
  COOKABLE_ITEMS,
  LOGS,
  PET_DROP_RATES,
} from "../gathering-data";

describe("OSRS Data Validation", () => {
  describe("Experience calculations", () => {
    test("getXpForLevel matches OSRS values", () => {
      // Values from OSRS Wiki
      expect(getXpForLevel(1)).toBe(0);
      expect(getXpForLevel(10)).toBe(1154);
      expect(getXpForLevel(20)).toBe(4470);
      expect(getXpForLevel(30)).toBe(13363);
      expect(getXpForLevel(40)).toBe(37224);
      expect(getXpForLevel(50)).toBe(101333);
      expect(getXpForLevel(60)).toBe(273742);
      expect(getXpForLevel(70)).toBe(737627);
      expect(getXpForLevel(80)).toBe(1986068);
      expect(getXpForLevel(90)).toBe(5346332);
      expect(getXpForLevel(99)).toBe(13034431);
    });

    test("getLevelFromXp returns correct levels", () => {
      expect(getLevelFromXp(0)).toBe(1);
      expect(getLevelFromXp(1154)).toBe(10);
      expect(getLevelFromXp(1155)).toBe(10); // Just over level 10
      expect(getLevelFromXp(101332)).toBe(49); // Just under level 50
      expect(getLevelFromXp(101333)).toBe(50);
      expect(getLevelFromXp(13034431)).toBe(99);
    });

    test("experience calculation handles edge cases", () => {
      expect(() => getXpForLevel(0)).toThrow();
      expect(() => getXpForLevel(100)).toThrow();
      expect(getLevelFromXp(-1)).toBe(1);
      expect(getLevelFromXp(999999999)).toBe(99);
    });
  });

  describe("Tree data validation", () => {
    test("all trees have required properties", () => {
      Object.values(TREES).forEach((tree) => {
        expect(tree).toHaveProperty("id");
        expect(tree).toHaveProperty("name");
        expect(tree).toHaveProperty("level");
        expect(tree).toHaveProperty("xp");
        expect(tree).toHaveProperty("logId");
        expect(tree).toHaveProperty("respawnTicks");
        expect(tree).toHaveProperty("depletionChance");
      });
    });

    test("tree XP values match OSRS Wiki", () => {
      expect(TREES.NORMAL.xp).toBe(25);
      expect(TREES.OAK.xp).toBe(37.5);
      expect(TREES.WILLOW.xp).toBe(67.5);
      expect(TREES.MAPLE.xp).toBe(100);
    });

    test("tree level requirements are correct", () => {
      expect(TREES.NORMAL.level).toBe(1);
      expect(TREES.OAK.level).toBe(15);
      expect(TREES.WILLOW.level).toBe(30);
      expect(TREES.TEAK.level).toBe(35);
      expect(TREES.MAPLE.level).toBe(45);
    });
  });

  describe("Mining data validation", () => {
    test("all rocks have required properties", () => {
      Object.values(ROCKS).forEach((rock) => {
        expect(rock).toHaveProperty("id");
        expect(rock).toHaveProperty("name");
        expect(rock).toHaveProperty("level");
        expect(rock).toHaveProperty("xp");
        expect(rock).toHaveProperty("oreId");
        expect(rock).toHaveProperty("respawnTicks");
        expect(rock).toHaveProperty("depletionChance");
      });
    });

    test("rock XP values match OSRS Wiki", () => {
      expect(ROCKS.COPPER.xp).toBe(17.5);
      expect(ROCKS.TIN.xp).toBe(17.5);
      expect(ROCKS.IRON.xp).toBe(35);
      expect(ROCKS.SILVER.xp).toBe(40);
      expect(ROCKS.COAL.xp).toBe(50);
      expect(ROCKS.GOLD.xp).toBe(65);
    });

    test("all rocks always deplete", () => {
      Object.values(ROCKS).forEach((rock) => {
        expect(rock.depletionChance).toBe(1.0);
      });
    });
  });

  describe("Cooking data validation", () => {
    test("cooking XP values match OSRS Wiki", () => {
      expect(COOKABLE_ITEMS.SHRIMPS.xp).toBe(30);
      expect(COOKABLE_ITEMS.TROUT.xp).toBe(70);
      expect(COOKABLE_ITEMS.SALMON.xp).toBe(90);
      expect(COOKABLE_ITEMS.LOBSTER.xp).toBe(120);
      expect(COOKABLE_ITEMS.SWORDFISH.xp).toBe(140);
    });

    test("burn stop levels are correct", () => {
      expect(COOKABLE_ITEMS.SHRIMPS.burnStopLevel).toBe(34);
      expect(COOKABLE_ITEMS.TROUT.burnStopLevel).toBe(49);
      expect(COOKABLE_ITEMS.LOBSTER.burnStopLevel).toBe(74);
      expect(COOKABLE_ITEMS.SWORDFISH.burnStopLevel).toBe(86);
    });

    test("all foods have required item IDs", () => {
      Object.values(COOKABLE_ITEMS).forEach((food) => {
        expect(typeof food.raw).toBe("number");
        expect(typeof food.cooked).toBe("number");
        expect(typeof food.burnt).toBe("number");
        expect(food.raw).toBeGreaterThan(0);
        expect(food.cooked).toBeGreaterThan(0);
        expect(food.burnt).toBeGreaterThan(0);
      });
    });
  });

  describe("Firemaking data validation", () => {
    test("log XP values match OSRS Wiki", () => {
      expect(LOGS.NORMAL.xp).toBe(40);
      expect(LOGS.OAK.xp).toBe(60);
      expect(LOGS.WILLOW.xp).toBe(90);
      expect(LOGS.TEAK.xp).toBe(105);
      expect(LOGS.MAPLE.xp).toBe(135);
    });

    test("log level requirements are correct", () => {
      expect(LOGS.NORMAL.level).toBe(1);
      expect(LOGS.OAK.level).toBe(15);
      expect(LOGS.WILLOW.level).toBe(30);
      expect(LOGS.TEAK.level).toBe(35);
      expect(LOGS.MAPLE.level).toBe(45);
    });
  });
  describe("Gathering success calculations", () => {
    test("success chance increases with level", () => {
      const level1Success = calculateGatheringSuccess(1, 1, 1); // SkillType.WOODCUTTING
      const level50Success = calculateGatheringSuccess(50, 1, 1);
      const level99Success = calculateGatheringSuccess(99, 1, 1);

      expect(level50Success).toBeGreaterThan(level1Success);
      expect(level99Success).toBeGreaterThan(level50Success);
    });
    test("better tools increase success chance", () => {
      const bronzeSuccess = calculateGatheringSuccess(50, 15, 1, 1.0); // Bronze tool
      const runeSuccess = calculateGatheringSuccess(50, 15, 1, 3.0); // Rune tool

      expect(runeSuccess).toBeGreaterThan(bronzeSuccess);
    });
    test("success chance is capped at 99%", () => {
      const maxSuccess = calculateGatheringSuccess(99, 1, 1);
      expect(maxSuccess).toBeLessThanOrEqual(0.99);
    });
  });

  describe("Cooking burn mechanics", () => {
    test("burn chance decreases with cooking level", () => {
      const level1Burn = calculateBurnChance(1, 1, 34, false, false);
      const level20Burn = calculateBurnChance(20, 1, 34, false, false);
      const level34Burn = calculateBurnChance(34, 1, 34, false, false);

      expect(level20Burn).toBeLessThan(level1Burn);
      expect(level34Burn).toBe(0); // Should never burn at stop level
    });

    test("range reduces burn chance compared to fire", () => {
      const fireBurn = calculateBurnChance(10, 1, 34, false, false);
      const rangeBurn = calculateBurnChance(10, 1, 34, true, false);

      expect(rangeBurn).toBeLessThan(fireBurn);
    });

    test("cooking gauntlets reduce burn chance", () => {
      const noBurn = calculateBurnChance(70, 40, 74, false, false);
      const withGauntlets = calculateBurnChance(70, 40, 74, false, true);

      expect(withGauntlets).toBeLessThan(noBurn);
    });

    test("food never burns at or above stop level", () => {
      expect(calculateBurnChance(34, 1, 34, false, false)).toBe(0);
      expect(calculateBurnChance(50, 1, 34, false, false)).toBe(0);
    });
  });

  describe("Pet drop rates", () => {
    test("pet drop rates match OSRS values", () => {
      expect(PET_DROP_RATES.BEAVER).toBe(72321);
      expect(PET_DROP_RATES.ROCK_GOLEM).toBe(244640);
      expect(PET_DROP_RATES.HERON).toBe(128456);
      expect(PET_DROP_RATES.PHOENIX).toBe(5000);
    });

    test("pet drop chance calculation works correctly", () => {
      // Phoenix should be flat rate
      const phoenixChance1 = calculatePetDropChance(PET_DROP_RATES.PHOENIX, 1);
      const phoenixChance99 = calculatePetDropChance(
        PET_DROP_RATES.PHOENIX,
        99
      );
      expect(phoenixChance1).toBe(phoenixChance99);
      expect(phoenixChance1).toBe(1 / 5000);

      // Other pets should improve with level
      const beaverChance1 = calculatePetDropChance(PET_DROP_RATES.BEAVER, 1);
      const beaverChance99 = calculatePetDropChance(PET_DROP_RATES.BEAVER, 99);
      expect(beaverChance99).toBeGreaterThan(beaverChance1);
    });

    test("pet drop chance never goes below minimum", () => {
      // Very high level shouldn't make rate too high
      const extremeChance = calculatePetDropChance(PET_DROP_RATES.BEAVER, 999);
      expect(extremeChance).toBeLessThanOrEqual(1 / 1000);
    });
  });
});
