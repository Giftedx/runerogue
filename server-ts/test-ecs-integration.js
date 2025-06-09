/**
 * Quick ECS Integration Test
 * Testing the fixed ECS integration without full build
 */

const fs = require('fs');
const path = require('path');

// Simple mock player object
const mockPlayer = {
  id: 'test-player-123',
  x: 10,
  y: 20,
  health: 85,
  maxHealth: 100,
  skills: {
    attack: { level: 50, experience: 12345 },
    defence: { level: 45, experience: 9876 },
    strength: { level: 48, experience: 11234 },
    hitpoints: { level: 60, experience: 23456 },
    ranged: { level: 30, experience: 4567 },
    magic: { level: 25, experience: 3456 },
    prayer: { level: 15, experience: 1234 },
  },
};

console.log('🧪 Testing ECS Integration...');
console.log('Mock Player:', JSON.stringify(mockPlayer, null, 2));

try {
  // Try to load the compiled ECS integration
  const ECSIntegrationModule = require('./dist/src/server/game/ECSIntegration.js');

  if (ECSIntegrationModule && ECSIntegrationModule.ECSIntegration) {
    console.log('✅ ECSIntegration loaded successfully');

    const ecsIntegration = new ECSIntegrationModule.ECSIntegration();
    console.log('✅ ECS Integration instance created');

    // Test player sync
    const entityId = ecsIntegration.syncPlayerToECS(mockPlayer);
    console.log('✅ Player synced to ECS. Entity ID:', entityId);

    // Test getting stats
    const stats = ecsIntegration.getStats();
    console.log('✅ ECS Stats:', stats);

    // Test update loop
    ecsIntegration.update(16.67);
    console.log('✅ ECS Update completed');
  } else {
    console.log('❌ ECSIntegration class not found in module');
    console.log('Available exports:', Object.keys(ECSIntegrationModule || {}));
  }
} catch (error) {
  console.error('❌ ECS Integration Test Failed:', error.message);

  if (error.message.includes('Cannot find module')) {
    console.log('🔄 Attempting to run TypeScript build...');

    const { execSync } = require('child_process');
    try {
      execSync('npx tsc --build --verbose', { stdio: 'inherit', cwd: __dirname });
      console.log('✅ TypeScript build completed');
    } catch (buildError) {
      console.error('❌ Build failed:', buildError.message);
    }
  }

  console.error('Stack:', error.stack);
}
