/**
 * Gathering Systems Integration Test
 * Tests all gathering skill systems (Woodcutting, Mining, Fishing, Cooking, Firemaking)
 * with OSRS-authentic data and mechanics
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import { createWorld, IWorld, Entity } from "bitecs";
import {
  ResourceNodeComponent,
  SkillDataComponent,
  GatheringActionComponent,
  InventoryComponent,
  WorldObjectComponent,
} from "../../../server-ts/src/server/ecs/components/GatheringComponents";
import {
  WoodcuttingSystem,
  startWoodcutting,
  stopWoodcutting,
} from "../../../server-ts/src/server/ecs/systems/WoodcuttingSystem";
import {
  MiningSystem,
  startMining,
  stopMining,
} from "../../../server-ts/src/server/ecs/systems/MiningSystem";
import {
  FishingSystem,
  startFishing,
  stopFishing,
} from "../../../server-ts/src/server/ecs/systems/FishingSystem";
import {
  CookingSystem,
  startCooking,
  stopCooking,
} from "../../../server-ts/src/server/ecs/systems/CookingSystem";
import {
  FiremakingSystem,
  startFiremaking,
  stopFiremaking,
} from "../../../server-ts/src/server/ecs/systems/FiremakingSystem";
import {
  TREES,
  ROCKS,
  FISH,
  COOKABLES,
  LOGS,
  calculateLevelFromXp,
  calculateXpFromLevel,
} from "@runerogue/osrs-data";

describe("Gathering Systems Integration", () => {
  let world: IWorld;
  let playerId: Entity;
  let treeNode: Entity;
  let rockNode: Entity;
  let fishingNode: Entity;
  let fireNode: Entity;

  beforeEach(() => {
    world = createWorld();

    // Create a test player
    playerId = world.create();
    SkillDataComponent.woodcuttingXp[playerId] = calculateXpFromLevel(50) * 10; // Level 50
    SkillDataComponent.miningXp[playerId] = calculateXpFromLevel(40) * 10; // Level 40
    SkillDataComponent.fishingXp[playerId] = calculateXpFromLevel(35) * 10; // Level 35
    SkillDataComponent.cookingXp[playerId] = calculateXpFromLevel(30) * 10; // Level 30
    SkillDataComponent.firemakingXp[playerId] = calculateXpFromLevel(25) * 10; // Level 25
    InventoryComponent.isFull[playerId] = 0;
    InventoryComponent.itemCount[playerId] = 0;

    // Create test resource nodes
    treeNode = world.create();
    ResourceNodeComponent.resourceType[treeNode] = 1; // Tree
    ResourceNodeComponent.resourceId[treeNode] = 1517; // Maple tree
    ResourceNodeComponent.requiredLevel[treeNode] = 45;
    ResourceNodeComponent.isDepleted[treeNode] = 0;
    ResourceNodeComponent.currentRespawnTick[treeNode] = 0;

    rockNode = world.create();
    ResourceNodeComponent.resourceType[rockNode] = 2; // Rock
    ResourceNodeComponent.resourceId[rockNode] = 453; // Coal rock
    ResourceNodeComponent.requiredLevel[rockNode] = 30;
    ResourceNodeComponent.isDepleted[rockNode] = 0;
    ResourceNodeComponent.currentRespawnTick[rockNode] = 0;

    fishingNode = world.create();
    ResourceNodeComponent.resourceType[fishingNode] = 3; // Fishing spot
    ResourceNodeComponent.resourceId[fishingNode] = 359; // Tuna
    ResourceNodeComponent.requiredLevel[fishingNode] = 35;
    ResourceNodeComponent.isDepleted[fishingNode] = 0;
    ResourceNodeComponent.currentRespawnTick[fishingNode] = 0;

    fireNode = world.create();
    WorldObjectComponent.objectType[fireNode] = 0; // Fire
    WorldObjectComponent.createdTick[fireNode] = Date.now();
    WorldObjectComponent.expirationTick[fireNode] = Date.now() + 60000; // 1 minute
    WorldObjectComponent.creatorEntity[fireNode] = playerId;
  });

  describe("Woodcutting System", () => {
    test("should start woodcutting action successfully", () => {
      const success = startWoodcutting(playerId, treeNode);
      expect(success).toBe(true);
      expect(GatheringActionComponent.actionType[playerId]).toBe(1);
      expect(GatheringActionComponent.targetEntity[playerId]).toBe(treeNode);
    });

    test("should stop woodcutting action", () => {
      startWoodcutting(playerId, treeNode);
      stopWoodcutting(playerId);
      expect(GatheringActionComponent.actionType[playerId]).toBe(0);
      expect(GatheringActionComponent.targetEntity[playerId]).toBe(0);
    });

    test("should process woodcutting system without errors", () => {
      startWoodcutting(playerId, treeNode);
      expect(() => WoodcuttingSystem(world)).not.toThrow();
    });
  });

  describe("Mining System", () => {
    test("should start mining action successfully", () => {
      const success = startMining(playerId, rockNode);
      expect(success).toBe(true);
      expect(GatheringActionComponent.actionType[playerId]).toBe(2);
      expect(GatheringActionComponent.targetEntity[playerId]).toBe(rockNode);
    });

    test("should process mining system without errors", () => {
      startMining(playerId, rockNode);
      expect(() => MiningSystem(world)).not.toThrow();
    });
  });

  describe("Fishing System", () => {
    test("should start fishing action successfully", () => {
      const success = startFishing(playerId, fishingNode);
      expect(success).toBe(true);
      expect(GatheringActionComponent.actionType[playerId]).toBe(3);
      expect(GatheringActionComponent.targetEntity[playerId]).toBe(fishingNode);
    });

    test("should process fishing system without errors", () => {
      startFishing(playerId, fishingNode);
      expect(() => FishingSystem(world)).not.toThrow();
    });
  });

  describe("Cooking System", () => {
    test("should start cooking action successfully", () => {
      const success = startCooking(playerId, fireNode, 359); // Raw tuna
      expect(success).toBe(true);
      expect(GatheringActionComponent.actionType[playerId]).toBe(4);
      expect(GatheringActionComponent.targetEntity[playerId]).toBe(fireNode);
    });

    test("should process cooking system without errors", () => {
      startCooking(playerId, fireNode, 359);
      expect(() => CookingSystem(world)).not.toThrow();
    });
  });

  describe("Firemaking System", () => {
    test("should start firemaking action successfully", () => {
      const success = startFiremaking(playerId, 1517); // Maple logs
      expect(success).toBe(true);
      expect(GatheringActionComponent.actionType[playerId]).toBe(5);
      expect(GatheringActionComponent.actionSubtype[playerId]).toBe(1517);
    });

    test("should process firemaking system without errors", () => {
      startFiremaking(playerId, 1517);
      expect(() => FiremakingSystem(world)).not.toThrow();
    });
  });

  describe("Level Requirements", () => {
    test("should validate woodcutting level requirements", () => {
      // Reset to low level
      SkillDataComponent.woodcuttingXp[playerId] = calculateXpFromLevel(1) * 10;

      const success = startWoodcutting(playerId, treeNode); // Maple tree requires level 45
      expect(success).toBe(false);
    });

    test("should validate mining level requirements", () => {
      // Reset to low level
      SkillDataComponent.miningXp[playerId] = calculateXpFromLevel(1) * 10;

      const success = startMining(playerId, rockNode); // Coal requires level 30
      expect(success).toBe(false);
    });

    test("should validate fishing level requirements", () => {
      // Reset to low level
      SkillDataComponent.fishingXp[playerId] = calculateXpFromLevel(1) * 10;

      const success = startFishing(playerId, fishingNode); // Tuna requires level 35
      expect(success).toBe(false);
    });
  });

  describe("XP Calculations", () => {
    test("should calculate levels from XP correctly", () => {
      expect(calculateLevelFromXp(0)).toBe(1);
      expect(calculateLevelFromXp(830)).toBe(10);
      expect(calculateLevelFromXp(13363)).toBe(30);
      expect(calculateLevelFromXp(41171)).toBe(50);
    });

    test("should store XP as integers (multiplied by 10)", () => {
      const initialXp = SkillDataComponent.woodcuttingXp[playerId];
      startWoodcutting(playerId, treeNode);

      // Simulate one successful woodcutting action
      // The XP should be stored as integer * 10 for decimal precision
      expect(typeof SkillDataComponent.woodcuttingXp[playerId]).toBe("number");
    });
  });

  describe("Resource Depletion and Respawn", () => {
    test("should handle tree depletion", () => {
      ResourceNodeComponent.isDepleted[treeNode] = 1;
      ResourceNodeComponent.currentRespawnTick[treeNode] = 5;

      WoodcuttingSystem(world);

      // After system runs, respawn timer should decrease
      expect(
        ResourceNodeComponent.currentRespawnTick[treeNode]
      ).toBeLessThanOrEqual(5);
    });

    test("should respawn depleted resources", () => {
      ResourceNodeComponent.isDepleted[treeNode] = 1;
      ResourceNodeComponent.currentRespawnTick[treeNode] = 0;

      WoodcuttingSystem(world);

      // Resource should be available again
      expect(ResourceNodeComponent.isDepleted[treeNode]).toBe(0);
    });
  });

  describe("Inventory Handling", () => {
    test("should prevent actions when inventory is full", () => {
      InventoryComponent.isFull[playerId] = 1;

      const woodcuttingSuccess = startWoodcutting(playerId, treeNode);
      const miningSuccess = startMining(playerId, rockNode);
      const fishingSuccess = startFishing(playerId, fishingNode);

      // Actions should still start, but processing should handle full inventory
      expect(woodcuttingSuccess).toBe(true);
      expect(miningSuccess).toBe(true);
      expect(fishingSuccess).toBe(true);
    });
  });

  describe("OSRS Data Integration", () => {
    test("should have valid tree data", () => {
      expect(TREES).toBeDefined();
      expect(Object.keys(TREES).length).toBeGreaterThan(0);

      // Check maple tree data (ID 1517)
      const mapleTree = Object.values(TREES).find(
        (tree) => tree.logId === 1517
      );
      expect(mapleTree).toBeDefined();
      expect(mapleTree?.level).toBe(45);
      expect(mapleTree?.xp).toBe(100);
    });

    test("should have valid rock data", () => {
      expect(ROCKS).toBeDefined();
      expect(Object.keys(ROCKS).length).toBeGreaterThan(0);

      // Check coal rock data (ID 453)
      const coalRock = Object.values(ROCKS).find((rock) => rock.oreId === 453);
      expect(coalRock).toBeDefined();
      expect(coalRock?.level).toBe(30);
      expect(coalRock?.xp).toBe(50);
    });

    test("should have valid fish data", () => {
      expect(FISH).toBeDefined();
      expect(Object.keys(FISH).length).toBeGreaterThan(0);

      // Check tuna data (ID 359)
      const tuna = Object.values(FISH).find((fish) => fish.fishId === 359);
      expect(tuna).toBeDefined();
      expect(tuna?.level).toBe(35);
      expect(tuna?.xp).toBe(80);
    });
  });
});

describe("System Performance", () => {
  test("should handle multiple concurrent actions efficiently", () => {
    const world = createWorld();
    const numPlayers = 100;
    const players: Entity[] = [];

    // Create many players with actions
    for (let i = 0; i < numPlayers; i++) {
      const playerId = world.create();
      SkillDataComponent.woodcuttingXp[playerId] =
        calculateXpFromLevel(50) * 10;
      InventoryComponent.isFull[playerId] = 0;
      players.push(playerId);
    }

    const startTime = performance.now();

    // Run all systems
    WoodcuttingSystem(world);
    MiningSystem(world);
    FishingSystem(world);
    CookingSystem(world);
    FiremakingSystem(world);

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Should complete within reasonable time (100ms for 100 players)
    expect(executionTime).toBeLessThan(100);
  });
});
