/**
 * Test script to verify @runerogue/osrs-data imports are working
 */

console.log('Testing gathering system imports...');

try {
  // Test WoodcuttingSystem import
  console.log('Testing WoodcuttingSystem...');
  const WoodcuttingSystem = require('./src/server/ecs/systems/WoodcuttingSystem');
  console.log('✅ WoodcuttingSystem imported successfully');

  // Test MiningSystem import
  console.log('Testing MiningSystem...');
  const MiningSystem = require('./src/server/ecs/systems/MiningSystem');
  console.log('✅ MiningSystem imported successfully');

  // Test FishingSystem import
  console.log('Testing FishingSystem...');
  const FishingSystem = require('./src/server/ecs/systems/FishingSystem');
  console.log('✅ FishingSystem imported successfully');

  // Test CookingSystem import
  console.log('Testing CookingSystem...');
  const CookingSystem = require('./src/server/ecs/systems/CookingSystem');
  console.log('✅ CookingSystem imported successfully');

  // Test FiremakingSystem import
  console.log('Testing FiremakingSystem...');
  const FiremakingSystem = require('./src/server/ecs/systems/FiremakingSystem');
  console.log('✅ FiremakingSystem imported successfully');

  // Test AutoCombatSystem import
  console.log('Testing AutoCombatSystem...');
  const AutoCombatSystem = require('./src/server/ecs/systems/AutoCombatSystem');
  console.log('✅ AutoCombatSystem imported successfully');

  console.log('\n🎉 ALL GATHERING SYSTEM IMPORTS SUCCESSFUL!');
  console.log('✅ Module resolution issues have been fixed!');
} catch (error) {
  console.error('❌ Import test failed:', error.message);
  process.exit(1);
}
