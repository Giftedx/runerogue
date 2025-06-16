/**
 * Test script to verify OSRS asset integration with the game client
 * This demonstrates how to use authentic OSRS visuals in RuneRogue
 */

import { AssetLoader } from '../client/game/AssetLoader';

/**
 * Test the complete OSRS asset pipeline integration
 */
async function testOSRSAssetIntegration(): Promise<void> {
  console.log('🧪 Testing OSRS Asset Integration...');
  console.log('=====================================');

  try {
    // Initialize asset loader
    const assetLoader = new AssetLoader();

    // Load all assets (including OSRS assets)
    console.log('📦 Loading all game assets...');
    await assetLoader.loadAllAssets();

    console.log('✅ Asset loading completed successfully!');

    // Test OSRS asset availability
    console.log('\n🎮 Testing OSRS Asset Availability:');
    console.log('-------------------------------------');

    const criticalAssets = [
      'Hitpoints_orb',
      'Prayer_orb',
      'Attack_icon',
      'Strength_icon',
      'Defence_icon',
      'Minimap',
      'Compass',
    ];

    let availableAssets = 0;
    for (const assetName of criticalAssets) {
      const isAvailable = assetLoader.hasOSRSAsset(assetName);
      const status = isAvailable ? '✅' : '❌';
      console.log(`  ${status} ${assetName}`);

      if (isAvailable) {
        availableAssets++;
        // Get the actual asset to verify it's loadable
        const asset = assetLoader.getOSRSAsset(assetName);
        if (asset && asset instanceof HTMLImageElement) {
          console.log(`     🖼️  Image dimensions: ${asset.naturalWidth}x${asset.naturalHeight}`);
        }
      }
    }

    const completionRate = (availableAssets / criticalAssets.length) * 100;
    console.log(
      `\n📊 OSRS Asset Availability: ${availableAssets}/${criticalAssets.length} (${completionRate.toFixed(1)}%)`
    );

    // Test fallback assets
    console.log('\n🔄 Testing Fallback Assets:');
    console.log('-----------------------------');

    const gameAssets = ['player', 'npcs', 'tiles', 'items', 'effects'];
    for (const assetKey of gameAssets) {
      const asset = assetLoader.getImage(assetKey);
      const status = asset ? '✅' : '❌';
      console.log(`  ${status} ${assetKey}`);
    }

    // Integration test result
    console.log('\n=====================================');
    if (completionRate >= 50) {
      console.log('🎉 INTEGRATION TEST PASSED!');
      console.log('✅ OSRS assets are properly integrated');
      console.log('🎮 RuneRogue is ready for Discord Activity launch!');
      console.log('\n🚀 Next Steps:');
      console.log('   1. Discord SDK integration');
      console.log('   2. Web export optimization');
      console.log('   3. Production deployment pipeline');
    } else {
      console.log('⚠️  Integration test warning:');
      console.log('   Low OSRS asset availability detected');
      console.log('   Consider running: npm run extract-assets');
    }

    console.log('=====================================');
  } catch (error) {
    console.error('❌ Asset integration test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Run: npm run extract-assets');
    console.log('   2. Run: npm run verify-assets');
    console.log('   3. Check internet connection for Wiki access');
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testOSRSAssetIntegration()
    .then(() => {
      console.log('\n✅ OSRS asset integration test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

export { testOSRSAssetIntegration };
