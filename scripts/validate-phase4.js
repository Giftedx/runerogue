#!/usr/bin/env node

/**
 * RuneRogue Phase 4 Validation Script
 * Comprehensive test of all Phase 4 skill system implementation features
 */

const fs = require("fs");
const path = require("path");

console.log("🎮 RuneRogue Phase 4 Skill System Validation");
console.log("===========================================");
console.log("");

// Test results
const results = {
  magicCombat: false,
  rangedCombat: false,
  smithing: false,
  equipment: false,
  consumables: false,
  xpSystem: false,
  dataFiles: false,
  integration: false,
};

/**
 * Test file existence and basic content
 */
function testFileExists(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${description}`);
    return true;
  } else {
    console.log(`   ❌ ${description} - File not found: ${fullPath}`);
    return false;
  }
}

/**
 * Test file content for specific patterns
 */
function testFileContent(filePath, patterns, description) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`   ❌ ${description} - File not found: ${fullPath}`);
    return false;
  }

  try {
    const content = fs.readFileSync(fullPath, "utf8");
    const passed = patterns.every((pattern) => {
      if (typeof pattern === "string") {
        return content.includes(pattern);
      } else if (pattern instanceof RegExp) {
        return pattern.test(content);
      }
      return false;
    });

    if (passed) {
      console.log(`   ✅ ${description}`);
      return true;
    } else {
      console.log(`   ❌ ${description} - Missing required content`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${description} - Error reading file: ${error.message}`);
    return false;
  }
}

/**
 * Test Magic Combat System
 */
function testMagicCombat() {
  console.log("🔮 Testing Magic Combat System...");

  const tests = [
    testFileExists(
      "packages/server/src/server/ecs/systems/MagicCombatSystem.ts",
      "MagicCombatSystem exists",
    ),
    testFileContent(
      "packages/server/src/server/ecs/systems/MagicCombatSystem.ts",
      ["MagicCombat", "defineComponent", "calculateMagicMaxHit", "castSpell"],
      "MagicCombatSystem has required functions",
    ),
    testFileExists(
      "packages/osrs-data/src/skills/magic.ts",
      "Magic data file exists",
    ),
    testFileContent(
      "packages/osrs-data/src/skills/magic.ts",
      [
        "STANDARD_COMBAT_SPELLS",
        "calculateMagicMaxHit",
        "calculateMagicAccuracy",
      ],
      "Magic data has OSRS formulas",
    ),
  ];

  results.magicCombat = tests.every(Boolean);
  return results.magicCombat;
}

/**
 * Test Ranged Combat System
 */
function testRangedCombat() {
  console.log("🏹 Testing Ranged Combat System...");

  const tests = [
    testFileExists(
      "packages/server/src/server/ecs/systems/RangedCombatSystem.ts",
      "RangedCombatSystem exists",
    ),
    testFileContent(
      "packages/server/src/server/ecs/systems/RangedCombatSystem.ts",
      [
        "RangedCombat",
        "defineComponent",
        "calculateRangedMaxHit",
        "shootProjectile",
      ],
      "RangedCombatSystem has required functions",
    ),
    testFileExists(
      "packages/osrs-data/src/skills/ranged.ts",
      "Ranged data file exists",
    ),
    testFileContent(
      "packages/osrs-data/src/skills/ranged.ts",
      ["calculateRangedMaxHit", "calculateRangedAccuracy", "RangedWeapon"],
      "Ranged data has OSRS formulas",
    ),
  ];

  results.rangedCombat = tests.every(Boolean);
  return results.rangedCombat;
}

/**
 * Test Smithing System
 */
function testSmithing() {
  console.log("⚒️  Testing Smithing System...");

  const tests = [
    testFileExists(
      "packages/server/src/server/ecs/systems/SmithingSystem.ts",
      "SmithingSystem exists",
    ),
    testFileContent(
      "packages/server/src/server/ecs/systems/SmithingSystem.ts",
      [
        "SmithingAction",
        "SMITHING_RECIPES",
        "startSmithing",
        "processSmithing",
      ],
      "SmithingSystem has required functions",
    ),
  ];

  results.smithing = tests.every(Boolean);
  return results.smithing;
}

/**
 * Test Equipment System
 */
function testEquipment() {
  console.log("🛡️  Testing Equipment System...");

  const tests = [
    testFileExists(
      "packages/server/src/server/ecs/systems/EquipmentSystem.ts",
      "EquipmentSystem exists",
    ),
    testFileContent(
      "packages/server/src/server/ecs/systems/EquipmentSystem.ts",
      ["Inventory", "Item", "equipItem", "calculateBonuses"],
      "EquipmentSystem has required functions",
    ),
  ];

  results.equipment = tests.every(Boolean);
  return results.equipment;
}

/**
 * Test Consumable System
 */
function testConsumables() {
  console.log("🍖 Testing Consumable System...");

  const tests = [
    testFileExists(
      "packages/server/src/server/ecs/systems/ConsumableSystem.ts",
      "ConsumableSystem exists",
    ),
    testFileContent(
      "packages/server/src/server/ecs/systems/ConsumableSystem.ts",
      ["ActiveEffects", "consumeFood", "consumePotion", "OSRS_FOOD"],
      "ConsumableSystem has required functions",
    ),
  ];

  results.consumables = tests.every(Boolean);
  return results.consumables;
}

/**
 * Test XP System
 */
function testXPSystem() {
  console.log("✨ Testing XP System...");

  const tests = [
    testFileExists(
      "packages/server/src/server/ecs/systems/XPSystem.ts",
      "XPSystem exists",
    ),
    testFileContent(
      "packages/server/src/server/ecs/systems/XPSystem.ts",
      ["LevelUpEvents", "OSRS_XP_TABLE", "grantXP", "calculateCombatLevel"],
      "XPSystem has required functions",
    ),
  ];

  results.xpSystem = tests.every(Boolean);
  return results.xpSystem;
}

/**
 * Test Data Files Integration
 */
function testDataFiles() {
  console.log("📊 Testing OSRS Data Integration...");

  const tests = [
    testFileExists("packages/osrs-data/src/skills/magic.ts", "Magic data file"),
    testFileExists(
      "packages/osrs-data/src/skills/ranged.ts",
      "Ranged data file",
    ),
    testFileExists(
      "packages/osrs-data/src/skills/gathering-data.ts",
      "Gathering data file",
    ),
  ];

  results.dataFiles = tests.every(Boolean);
  return results.dataFiles;
}

/**
 * Test ECS Integration
 */
function testIntegration() {
  console.log("🔗 Testing ECS Integration...");

  const tests = [
    testFileExists(
      "packages/server/src/server/game/ECSIntegration.ts",
      "ECS Integration file exists",
    ),
    testFileContent(
      "packages/server/src/server/game/ECSIntegration.ts",
      [
        "MagicCombatSystem",
        "RangedCombatSystem",
        "SmithingSystem",
        "EquipmentSystem",
        "ConsumableSystem",
        "XPSystem",
      ],
      "ECS Integration includes Phase 4 systems",
    ),
    testFileExists(
      "packages/server/src/server/ecs/systems/index.ts",
      "Systems index file exists",
    ),
    testFileContent(
      "packages/server/src/server/ecs/systems/index.ts",
      [
        "MagicCombatSystem",
        "RangedCombatSystem",
        "SmithingSystem",
        "EquipmentSystem",
        "ConsumableSystem",
        "XPSystem",
      ],
      "Systems index exports Phase 4 systems",
    ),
  ];

  results.integration = tests.every(Boolean);
  return results.integration;
}

/**
 * Main validation function
 */
async function validatePhase4() {
  console.log("Starting Phase 4 Skill System validation...\n");

  const tests = [
    testMagicCombat,
    testRangedCombat,
    testSmithing,
    testEquipment,
    testConsumables,
    testXPSystem,
    testDataFiles,
    testIntegration,
  ];

  const passed = [];
  const failed = [];

  for (const test of tests) {
    console.log("");
    if (test()) {
      passed.push(test.name);
    } else {
      failed.push(test.name);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 PHASE 4 VALIDATION RESULTS");
  console.log("=".repeat(50));

  const total = Object.keys(results).length;
  const passedCount = Object.values(results).filter(Boolean).length;
  const failedCount = total - passedCount;

  console.log(`✅ Passed: ${passedCount}/${total}`);
  console.log(`❌ Failed: ${failedCount}/${total}`);

  if (passedCount === total) {
    console.log("\n🎉 ALL PHASE 4 TESTS PASSED!");
    console.log("Ready for skill system integration and testing.");
    process.exit(0);
  } else {
    console.log("\n⚠️  SOME TESTS FAILED");
    console.log("Please fix the issues above before proceeding.");
    process.exit(1);
  }
}

// Run validation
validatePhase4().catch(console.error);
