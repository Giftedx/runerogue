/**
 * OSRS Data Validation Tests
 * Ensures all gathering skill data matches OSRS Wiki exactly
 */

import {
  calculateLevelFromXp,
  calculateXpFromLevel,
  calculateFishingSuccess,
  calculateWoodcuttingSuccess,
  calculateMiningSuccess,
  TREES,
  ROCKS,
  COOKABLE_ITEMS,
  LOGS,
  FISH,
} from "../gathering-data";

describe("OSRS Data Validation", () => {
  describe("Experience calculations", () => {
    test("calculateXpFromLevel matches OSRS values", () => {
      // Values from OSRS Wiki
      expect(calculateXpFromLevel(1)).toBe(0);
      expect(calculateXpFromLevel(10)).toBe(1154);
      expect(calculateXpFromLevel(20)).toBe(4470);
      expect(calculateXpFromLevel(30)).toBe(13363);
      expect(calculateXpFromLevel(40)).toBe(37224);
      expect(calculateXpFromLevel(50)).toBe(101333);
      expect(calculateXpFromLevel(60)).toBe(273742);
      expect(calculateXpFromLevel(70)).toBe(737627);
      expect(calculateXpFromLevel(80)).toBe(1986068);
      expect(calculateXpFromLevel(90)).toBe(5346332);
      expect(calculateXpFromLevel(99)).toBe(13034431);
    });

    test("calculateLevelFromXp returns correct levels", () => {
      expect(calculateLevelFromXp(0)).toBe(1);
      expect(calculateLevelFromXp(1154)).toBe(10);
      expect(calculateLevelFromXp(1155)).toBe(10); // Just over level 10
      expect(calculateLevelFromXp(101332)).toBe(49); // Just under level 50      expect(calculateLevelFromXp(101333)).toBe(50);
      expect(calculateLevelFromXp(13034431)).toBe(99);
    });
    test("experience calculation handles edge cases", () => {
      expect(() => calculateXpFromLevel(0)).toThrow();
      expect(() => calculateXpFromLevel(100)).toThrow();
      expect(calculateLevelFromXp(-1)).toBe(1);
      expect(calculateLevelFromXp(999999999)).toBe(99);
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
    test("woodcutting success chance increases with level", () => {
      const level1Success = calculateWoodcuttingSuccess(1, 1, 1.0); // Normal tree, bronze axe
      const level50Success = calculateWoodcuttingSuccess(50, 1, 1.0);
      const level99Success = calculateWoodcuttingSuccess(99, 1, 1.0);

      expect(level50Success).toBeGreaterThan(level1Success);
      expect(level99Success).toBeGreaterThan(level50Success);
    });

    test("better tools increase success chance", () => {
      const bronzeSuccess = calculateWoodcuttingSuccess(50, 45, 1.0); // Maple tree, bronze axe
      const runeSuccess = calculateWoodcuttingSuccess(50, 45, 3.0); // Maple tree, rune axe

      expect(runeSuccess).toBeGreaterThan(bronzeSuccess);
    });
    test("mining success chance increases with level", () => {
      const level1Success = calculateMiningSuccess(1, 15, 1.0); // Iron ore vs level 1
      const level50Success = calculateMiningSuccess(50, 15, 1.0); // Iron ore vs level 50
      const level99Success = calculateMiningSuccess(99, 15, 1.0); // Iron ore vs level 99

      expect(level50Success).toBeGreaterThan(level1Success);
      expect(level99Success).toBeGreaterThan(level50Success);
    });

    test("fishing success chance increases with level", () => {
      const level1Success = calculateFishingSuccess(1, 20); // Pike vs level 1
      const level50Success = calculateFishingSuccess(50, 20); // Pike vs level 50
      const level99Success = calculateFishingSuccess(99, 20); // Pike vs level 99

      expect(level50Success).toBeGreaterThan(level1Success);
      expect(level99Success).toBeGreaterThan(level50Success);
    });
  });

  describe("Data validation", () => {
    test("tree data has required properties", () => {
      const tree = TREES.OAK;
      expect(tree.name).toBe("Oak tree");
      expect(tree.logId).toBe(1521);
      expect(tree.level).toBe(15);
      expect(tree.xp).toBe(37.5);
    });

    test("rock data has required properties", () => {
      const rock = ROCKS.IRON;
      expect(rock.name).toBe("Iron rock");
      expect(rock.oreId).toBe(440);
      expect(rock.level).toBe(15);
      expect(rock.xp).toBe(35);
    });
    test("fish data has required properties", () => {
      const fish = FISH.sardine;
      expect(fish.level).toBe(5);
      expect(fish.xp).toBe(20);
      expect(fish.itemId).toBe(327);
    });
  });
});
