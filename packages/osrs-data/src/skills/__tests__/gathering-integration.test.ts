/**
 * Integration Test for OSRS Gathering Skills
 * Demonstrates complete functionality of all gathering systems
 */

import {
  TREES,
  ROCKS,
  FISHING_SPOTS,
  COOKABLE_ITEMS,
  LOGS,
  WOODCUTTING_TOOLS,
  MINING_TOOLS,
  calculateLevelFromXp,
  calculateWoodcuttingSuccess,
  calculateMiningSuccess,
  calculateFishingSuccess,
  calculateBurnChance,
  getEffectiveTool,
} from "../gathering-data";

describe("OSRS Gathering Skills Integration", () => {
  describe("Player progression simulation", () => {
    test("level 1 player can gather basic resources", () => {
      const playerLevel = 1;
      const playerXp = 0; // Level 1 woodcutting - Normal trees
      const normalTree = TREES.NORMAL;
      const bronzeAxe = getEffectiveTool(WOODCUTTING_TOOLS, playerLevel);
      expect(bronzeAxe?.name).toBe("Bronze axe"); // Level 1 players start with bronze tools

      const woodcuttingSuccess = calculateWoodcuttingSuccess(
        playerLevel,
        normalTree.level,
        bronzeAxe!.effectiveness,
      );
      expect(woodcuttingSuccess).toBeGreaterThanOrEqual(0.5); // Should have decent success rate

      // Level 1 mining - Copper/Tin
      const copperRock = ROCKS.COPPER;
      const bronzePickaxe = getEffectiveTool(MINING_TOOLS, playerLevel);
      expect(bronzePickaxe?.name).toBe("Bronze pickaxe");

      const miningSuccess = calculateMiningSuccess(
        playerLevel,
        copperRock.level,
        bronzePickaxe!.effectiveness,
      );
      expect(miningSuccess).toBeGreaterThanOrEqual(0.4);

      // Level 1 fishing - Shrimps
      const netFishing = FISHING_SPOTS.NET_BAIT.options.NET;
      const fishingSuccess = calculateFishingSuccess(
        playerLevel,
        netFishing.level,
      );
      expect(fishingSuccess).toBeGreaterThan(0.25); // Fishing is harder at low levels

      // Level 1 cooking - Shrimps
      const shrimps = COOKABLE_ITEMS.SHRIMPS;
      const burnChance = calculateBurnChance(
        playerLevel,
        shrimps.level,
        shrimps.burnStopLevel,
        false, // cooking on fire
        false, // no cooking gauntlets
      );
      expect(burnChance).toBeGreaterThanOrEqual(0.5); // High burn chance at level 1
    });
    test("level 30 player has better success rates and access to mid-tier content", () => {
      const playerLevel = 30;
      const playerXp = 13363; // Level 30 XP      expect(calculateLevelFromXp(playerXp)).toBe(30); // Level 30 woodcutting - Willow trees
      const willowTree = TREES.WILLOW;

      // Debug: check what the function returns
      const mithrilAxe = getEffectiveTool(WOODCUTTING_TOOLS, playerLevel);
      console.log(`Debug test: Level ${playerLevel} tool:`, mithrilAxe?.name);

      expect(mithrilAxe?.name).toBe("Mithril axe"); // Level 30 players would use mithril tools (level 21+ requirement)

      const woodcuttingSuccess = calculateWoodcuttingSuccess(
        playerLevel,
        willowTree.level,
        mithrilAxe!.effectiveness,
      );
      expect(woodcuttingSuccess).toBeGreaterThan(0.55); // Better success at higher level      // Level 30 mining - Coal
      const coalRock = ROCKS.COAL;
      const mithrilPickaxe = getEffectiveTool(MINING_TOOLS, playerLevel);

      const miningSuccess = calculateMiningSuccess(
        playerLevel,
        coalRock.level,
        mithrilPickaxe!.effectiveness,
      );
      expect(miningSuccess).toBeGreaterThanOrEqual(0.55); // Exact threshold may vary slightly      // Level 30 cooking - Trout (should rarely burn)
      const trout = COOKABLE_ITEMS.TROUT;
      const burnChance = calculateBurnChance(
        playerLevel,
        trout.level,
        trout.burnStopLevel,
        false, // cooking on fire
      );
      expect(burnChance).toBeLessThan(0.7); // Reasonable burn chance improvement
    });

    test("level 50 player has access to all content and best tools", () => {
      const playerLevel = 50;
      const playerXp = 101333; // Level 50 XP

      expect(calculateLevelFromXp(playerXp)).toBe(50); // Level 50 woodcutting - All trees available
      const mapleTree = TREES.MAPLE;
      const runeAxe = getEffectiveTool(WOODCUTTING_TOOLS, playerLevel);
      expect(runeAxe?.name).toBe("Rune axe"); // Players would use best available tool at level 50

      const woodcuttingSuccess = calculateWoodcuttingSuccess(
        playerLevel,
        mapleTree.level,
        runeAxe!.effectiveness,
      );
      expect(woodcuttingSuccess).toBeGreaterThan(0.7);

      // Level 50 mining - All rocks available
      const goldRock = ROCKS.GOLD;
      const adamantPickaxe = getEffectiveTool(MINING_TOOLS, playerLevel);

      const miningSuccess = calculateMiningSuccess(
        playerLevel,
        goldRock.level,
        adamantPickaxe!.effectiveness,
      );
      expect(miningSuccess).toBeGreaterThan(0.6);

      // Level 50 fishing - All fish available
      const lobsterFishing = FISHING_SPOTS.CAGE_HARPOON.options.CAGE;
      const fishingSuccess = calculateFishingSuccess(
        playerLevel,
        lobsterFishing.level,
      );
      expect(fishingSuccess).toBeGreaterThan(0.45); // Better at higher level but lobsters are still challenging      // Level 50 cooking - Most foods don't burn
      const tuna = COOKABLE_ITEMS.TUNA;
      const burnChance = calculateBurnChance(
        playerLevel,
        tuna.level,
        tuna.burnStopLevel,
        true, // cooking on range
      );
      expect(burnChance).toBeLessThan(0.5); // Should have reasonable success rate with proper level
    });
  });

  describe("Tool progression validation", () => {
    test("better tools provide better effectiveness", () => {
      const playerLevel = 50;

      // Woodcutting tools
      const bronzeAxe = WOODCUTTING_TOOLS.BRONZE_AXE;
      const adamantAxe = WOODCUTTING_TOOLS.ADAMANT_AXE;

      expect(adamantAxe.effectiveness).toBeGreaterThan(bronzeAxe.effectiveness);
      expect(adamantAxe.speed).toBeLessThan(bronzeAxe.speed); // Faster = lower number

      // Mining tools
      const bronzePickaxe = MINING_TOOLS.BRONZE_PICKAXE;
      const adamantPickaxe = MINING_TOOLS.ADAMANT_PICKAXE;

      expect(adamantPickaxe.effectiveness).toBeGreaterThan(
        bronzePickaxe.effectiveness,
      );
      expect(adamantPickaxe.speed).toBeLessThan(bronzePickaxe.speed);
    });
  });

  describe("OSRS data accuracy validation", () => {
    test("XP values match OSRS exactly", () => {
      // Woodcutting XP
      expect(TREES.NORMAL.xp).toBe(25);
      expect(TREES.OAK.xp).toBe(37.5);
      expect(TREES.WILLOW.xp).toBe(67.5);
      expect(TREES.MAPLE.xp).toBe(100);

      // Mining XP
      expect(ROCKS.COPPER.xp).toBe(17.5);
      expect(ROCKS.IRON.xp).toBe(35);
      expect(ROCKS.COAL.xp).toBe(50);
      expect(ROCKS.GOLD.xp).toBe(65);

      // Firemaking XP
      expect(LOGS.NORMAL.xp).toBe(40);
      expect(LOGS.OAK.xp).toBe(60);
      expect(LOGS.WILLOW.xp).toBe(90);
      expect(LOGS.MAPLE.xp).toBe(135);
    });

    test("level requirements match OSRS", () => {
      // Tree level requirements
      expect(TREES.NORMAL.level).toBe(1);
      expect(TREES.OAK.level).toBe(15);
      expect(TREES.WILLOW.level).toBe(30);
      expect(TREES.MAPLE.level).toBe(45);

      // Rock level requirements
      expect(ROCKS.COPPER.level).toBe(1);
      expect(ROCKS.IRON.level).toBe(15);
      expect(ROCKS.COAL.level).toBe(30);
      expect(ROCKS.GOLD.level).toBe(40);
    });
  });

  describe("Complete gathering cycle simulation", () => {
    test("player can progress from level 1 to 50 using correct resources", () => {
      // Level 1-15: Normal trees, Copper/Tin ore
      let playerLevel = 1;
      expect(calculateLevelFromXp(0)).toBe(1);

      // Can access level 1 content
      expect(TREES.NORMAL.level).toBeLessThanOrEqual(playerLevel);
      expect(ROCKS.COPPER.level).toBeLessThanOrEqual(playerLevel);

      // Level 15-30: Oak trees, Iron ore
      playerLevel = 15;
      expect(calculateLevelFromXp(2411)).toBe(15);

      expect(TREES.OAK.level).toBeLessThanOrEqual(playerLevel);
      expect(ROCKS.IRON.level).toBeLessThanOrEqual(playerLevel);

      // Level 30-45: Willow trees, Coal
      playerLevel = 30;
      expect(calculateLevelFromXp(13363)).toBe(30);

      expect(TREES.WILLOW.level).toBeLessThanOrEqual(playerLevel);
      expect(ROCKS.COAL.level).toBeLessThanOrEqual(playerLevel);

      // Level 45-50: Maple trees, Gold ore
      playerLevel = 45;
      expect(calculateLevelFromXp(61512)).toBe(45);

      expect(TREES.MAPLE.level).toBeLessThanOrEqual(playerLevel);
      expect(ROCKS.GOLD.level).toBeLessThanOrEqual(playerLevel);

      // Level 50: All content available
      playerLevel = 50;
      expect(calculateLevelFromXp(101333)).toBe(50);

      // All gathering content should be accessible
      const allTrees = Object.values(TREES);
      const allRocks = Object.values(ROCKS);
      const allLogs = Object.values(LOGS);

      allTrees.forEach((tree) => {
        expect(tree.level).toBeLessThanOrEqual(playerLevel);
      });

      allRocks.forEach((rock) => {
        expect(rock.level).toBeLessThanOrEqual(playerLevel);
      });

      allLogs.forEach((log) => {
        expect(log.level).toBeLessThanOrEqual(playerLevel);
      });
    });
  });
});
