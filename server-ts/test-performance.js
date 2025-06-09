/**
 * Performance Test Script for ECS Automation Manager
 *
 * This script tests the performance optimizations we've made to the ECS system.
 */

const { ECSAutomationManager } = require('./dist/server/game/ECSAutomationManager');

// Test with production configuration
async function testProductionPerformance() {
  console.log('🚀 Testing Production Performance Configuration...\n');

  const manager = new ECSAutomationManager({
    targetFrameRate: 60,
    performanceMonitoringEnabled: true,
    autoRecoveryEnabled: true,
    maxErrorsPerSecond: 5,
    healthCheckInterval: 10000, // 10 seconds
    gracefulShutdown: false, // Don't set up process handlers in test
  });

  await manager.start();

  // Let it run for 15 seconds
  await new Promise(resolve => setTimeout(resolve, 15000));

  const status = manager.getStatus();
  console.log('📊 Production Test Results:');
  console.log(`   Runtime: ${(status.uptime / 1000).toFixed(1)}s`);
  console.log(`   Frames: ${status.frameCount}`);
  console.log(`   Average FPS: ${status.averageFPS.toFixed(2)}/60`);
  console.log(`   Performance: ${((status.averageFPS / 60) * 100).toFixed(1)}%`);
  console.log(`   Errors: ${status.errorCount}`);

  await manager.stop();
  return status.averageFPS;
}

// Test with test configuration
async function testOptimizedPerformance() {
  console.log('\n🧪 Testing Test-Optimized Configuration...\n');

  // Simulate test environment
  process.env.NODE_ENV = 'test';

  const manager = new ECSAutomationManager(); // Will auto-detect test environment

  await manager.start();

  // Let it run for 15 seconds
  await new Promise(resolve => setTimeout(resolve, 15000));

  const status = manager.getStatus();
  console.log('📊 Test-Optimized Results:');
  console.log(`   Runtime: ${(status.uptime / 1000).toFixed(1)}s`);
  console.log(`   Frames: ${status.frameCount}`);
  console.log(`   Average FPS: ${status.averageFPS.toFixed(2)}/60`);
  console.log(`   Performance: ${((status.averageFPS / 60) * 100).toFixed(1)}%`);
  console.log(`   Errors: ${status.errorCount}`);

  await manager.stop();

  // Clean up test environment
  delete process.env.NODE_ENV;

  return status.averageFPS;
}

// Run both tests and compare
async function runPerformanceComparison() {
  console.log('🎯 RuneRogue ECS Performance Analysis\n');
  console.log('Target: 60 FPS (current ~38-39 FPS)\n');

  try {
    const productionFPS = await testProductionPerformance();
    const optimizedFPS = await testOptimizedPerformance();

    console.log('\n📈 Performance Comparison:');
    console.log(`   Production Config: ${productionFPS.toFixed(2)} FPS`);
    console.log(`   Test-Optimized:    ${optimizedFPS.toFixed(2)} FPS`);
    console.log(`   Improvement:       ${(optimizedFPS - productionFPS).toFixed(2)} FPS`);
    console.log(`   Efficiency Gain:   ${((optimizedFPS / productionFPS - 1) * 100).toFixed(1)}%`);

    if (optimizedFPS >= 50) {
      console.log('\n✅ SUCCESS: Achieved target performance (>50 FPS)');
    } else if (optimizedFPS >= 45) {
      console.log('\n🎯 GOOD: Significant improvement, approaching target');
    } else {
      console.log('\n⚠️  NEEDS WORK: Still below performance target');
    }
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }
}

// Run the test
runPerformanceComparison()
  .then(() => {
    console.log('\n🏁 Performance test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test error:', error);
    process.exit(1);
  });
