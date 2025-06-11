/**
 * Server-side test for OSRS asset pipeline verification
 * Tests the asset extraction and manifest system without browser APIs
 */

import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Test the OSRS asset pipeline (server-side verification)
 */
async function testOSRSAssetPipeline(): Promise<void> {
  console.log('🧪 Testing OSRS Asset Pipeline (Server-side)...');
  console.log('====================================================');

  try {
    // Test 1: Check asset cache directory
    console.log('\n📁 Test 1: Asset Cache Directory');
    console.log('--------------------------------');

    const cacheDir = path.join(process.cwd(), 'assets/osrs-cache');
    const cacheExists = await fs.pathExists(cacheDir);
    console.log(`Cache directory exists: ${cacheExists ? '✅' : '❌'}`);

    if (!cacheExists) {
      throw new Error('Asset cache directory not found. Run: npm run extract-assets');
    }

    // Test 2: Check manifest file
    console.log('\n📋 Test 2: Asset Manifest');
    console.log('--------------------------');

    const manifestPath = path.join(cacheDir, 'manifest.json');
    const manifestExists = await fs.pathExists(manifestPath);
    console.log(`Manifest file exists: ${manifestExists ? '✅' : '❌'}`);

    if (!manifestExists) {
      throw new Error('Asset manifest not found. Run: npm run extract-assets');
    }

    // Load and validate manifest
    const manifest = await fs.readJson(manifestPath);
    const assetCount = Object.keys(manifest).length;
    console.log(`Assets in manifest: ${assetCount}`);

    if (assetCount === 0) {
      throw new Error('Empty manifest found');
    }

    // Test 3: Verify critical assets
    console.log('\n🎯 Test 3: Critical Assets Verification');
    console.log('----------------------------------------');

    const criticalAssets = [
      'ui/orbs/Hitpoints_orb',
      'ui/orbs/Prayer_orb',
      'ui/skills/Attack_icon',
      'ui/interfaces/Minimap',
      'equipment/helmets/detail/Bronze_full_helm_detail',
    ];

    let foundAssets = 0;
    let verifiedFiles = 0;

    for (const assetKey of criticalAssets) {
      const assetData = manifest[assetKey];
      if (assetData) {
        foundAssets++;
        console.log(`  ✅ ${assetKey} (found in manifest)`);

        // Check if file exists
        if (assetData.variants && assetData.variants.length > 0) {
          const filePath = assetData.variants[0].path;
          const fileExists = await fs.pathExists(filePath);
          if (fileExists) {
            verifiedFiles++;
            console.log(`     📄 File verified: ${path.basename(filePath)}`);
          } else {
            console.log(`     ❌ File missing: ${path.basename(filePath)}`);
          }
        }
      } else {
        console.log(`  ❌ ${assetKey} (not found)`);
      }
    }

    console.log(`\nCritical assets found: ${foundAssets}/${criticalAssets.length}`);
    console.log(`Files verified: ${verifiedFiles}/${foundAssets}`);

    // Test 4: Asset categories
    console.log('\n📦 Test 4: Asset Categories');
    console.log('---------------------------');

    const categories: Record<string, number> = {};
    for (const assetKey of Object.keys(manifest)) {
      const category = assetKey.split('/')[0];
      categories[category] = (categories[category] || 0) + 1;
    }

    for (const [category, count] of Object.entries(categories)) {
      console.log(`  ${category}: ${count} assets`);
    }

    // Test 5: Cache size and performance
    console.log('\n📊 Test 5: Performance Metrics');
    console.log('-------------------------------');

    const stats = await fs.stat(cacheDir);
    const cacheSize = await getCacheSize(cacheDir);
    console.log(`Cache size: ${(cacheSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Cache created: ${stats.birthtime.toISOString()}`);

    // Test Results
    console.log('\n====================================================');
    const successRate = (foundAssets / criticalAssets.length) * 100;
    const fileVerificationRate = foundAssets > 0 ? (verifiedFiles / foundAssets) * 100 : 0;

    if (successRate >= 80 && fileVerificationRate >= 80) {
      console.log('🎉 OSRS ASSET PIPELINE TEST PASSED!');
      console.log('✅ Asset extraction system working correctly');
      console.log('✅ Manifest generation functional');
      console.log('✅ File verification successful');
      console.log('🎮 RuneRogue is ready for Discord Activity launch!');

      console.log('\n🚀 Next Steps for Discord Launch:');
      console.log('   1. ✅ Asset pipeline complete');
      console.log('   2. 🔄 Discord SDK integration');
      console.log('   3. 🔄 Web export optimization');
      console.log('   4. 🔄 Production deployment');
    } else {
      console.log('⚠️  Asset pipeline needs attention:');
      console.log(`   Asset availability: ${successRate.toFixed(1)}%`);
      console.log(`   File verification: ${fileVerificationRate.toFixed(1)}%`);
      console.log('   Consider re-running: npm run extract-assets');
    }

    console.log('====================================================');
  } catch (error: any) {
    console.error('❌ Asset pipeline test failed:', error.message);
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('   1. Run: npm run extract-assets');
    console.log('   2. Run: npm run verify-assets');
    console.log('   3. Check internet connection');
    console.log('   4. Verify OSRS Wiki accessibility');
    throw error;
  }
}

/**
 * Calculate total cache directory size
 */
async function getCacheSize(dir: string): Promise<number> {
  let totalSize = 0;

  try {
    const items = await fs.readdir(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        totalSize += await getCacheSize(itemPath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    // Directory might not exist or be inaccessible
  }

  return totalSize;
}

// Run the test
if (require.main === module) {
  testOSRSAssetPipeline()
    .then(() => {
      console.log('\n✅ Server-side asset pipeline test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

export { testOSRSAssetPipeline };
