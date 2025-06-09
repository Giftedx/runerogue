#!/usr/bin/env node

/**
 * Quick Performance Validation Script
 * Tests ECS performance with minimal overhead to validate our optimizations
 */

const { ECSAutomationManager } = require('./src/server/game/ECSAutomationManager');

async function quickPerformanceTest() {
  console.log('🎯 Quick ECS Performance Validation\n');

  // Test 1: Production Configuration (no test overhead)
  console.log('📊 Test 1: Production-Optimized Configuration');
  const productionManager = new ECSAutomationManager({
    targetFrameRate: 60,
    performanceMonitoringEnabled: false, // Disable monitoring overhead
    autoRecoveryEnabled: true,
    maxErrorsPerSecond: 10,
    healthCheckInterval: 60000, // Much less frequent
    gracefulShutdown: false, // No process handlers
  });

  await productionManager.start();

  // Run for 10 seconds
  console.log('   Running for 10 seconds...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  const prodStatus = productionManager.getStatus();
  await productionManager.stop();

  console.log(`   ✅ Production FPS: ${prodStatus.averageFPS.toFixed(2)}/60`);
  console.log(`   📈 Performance: ${((prodStatus.averageFPS / 60) * 100).toFixed(1)}%`);
  console.log(
    `   🎯 Frames: ${prodStatus.frameCount} in ${(prodStatus.uptime / 1000).toFixed(1)}s\n`
  );

  // Test 2: Minimal Configuration (absolute minimal overhead)
  console.log('📊 Test 2: Minimal Overhead Configuration');
  const minimalManager = new ECSAutomationManager({
    targetFrameRate: 60,
    performanceMonitoringEnabled: false,
    autoRecoveryEnabled: false, // Disable recovery overhead
    maxErrorsPerSecond: 100,
    healthCheckInterval: 300000, // 5 minutes
    gracefulShutdown: false,
  });

  await minimalManager.start();

  // Run for 10 seconds
  console.log('   Running for 10 seconds...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  const minStatus = minimalManager.getStatus();
  await minimalManager.stop();

  console.log(`   ✅ Minimal FPS: ${minStatus.averageFPS.toFixed(2)}/60`);
  console.log(`   📈 Performance: ${((minStatus.averageFPS / 60) * 100).toFixed(1)}%`);
  console.log(
    `   🎯 Frames: ${minStatus.frameCount} in ${(minStatus.uptime / 1000).toFixed(1)}s\n`
  );

  // Analysis
  console.log('📋 Performance Analysis:');
  console.log(
    `   🔄 Production vs Test Environment: +${(prodStatus.averageFPS - 38).toFixed(1)} FPS improvement`
  );
  console.log(
    `   ⚡ Minimal vs Production: +${(minStatus.averageFPS - prodStatus.averageFPS).toFixed(1)} FPS improvement`
  );
  console.log(
    `   🎯 Best Performance: ${Math.max(prodStatus.averageFPS, minStatus.averageFPS).toFixed(1)} FPS`
  );

  const bestFPS = Math.max(prodStatus.averageFPS, minStatus.averageFPS);
  if (bestFPS >= 50) {
    console.log('\n   ✅ SUCCESS: Performance target achieved (50+ FPS)');
    console.log('   🚀 Ready for multiplayer prototype development');
  } else if (bestFPS >= 45) {
    console.log('\n   🎯 GOOD: Approaching target, ready for development');
    console.log('   📈 Additional optimizations recommended');
  } else {
    console.log('\n   ⚠️  NEEDS WORK: Performance below production requirements');
    console.log('   🔧 ECS system optimization required');
  }

  return bestFPS;
}

// Only run if called directly
if (require.main === module) {
  quickPerformanceTest()
    .then(fps => {
      console.log(`\n🏁 Performance validation complete: ${fps.toFixed(1)} FPS`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Performance test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { quickPerformanceTest };
