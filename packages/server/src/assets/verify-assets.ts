#!/usr/bin/env ts-node

/**
 * Asset Verification Script
 * Verifies all required OSRS assets are extracted and accessible
 */

import fs from 'fs-extra';
import path from 'path';

interface AssetRequirement {
  category: string;
  required: string[];
  critical: boolean;
}

const REQUIRED_ASSETS: AssetRequirement[] = [
  {
    category: 'ui/orbs',
    required: [
      'Hitpoints_orb',
      'Prayer_orb',
      'Run_energy_orb',
      'Special_attack_orb',
      'XP_drops_icon',
    ],
    critical: true,
  },
  {
    category: 'ui/skills',
    required: [
      'Attack_icon',
      'Strength_icon',
      'Defence_icon',
      'Ranged_icon',
      'Prayer_icon',
      'Magic_icon',
      'Hitpoints_icon',
    ],
    critical: true,
  },
  {
    category: 'ui/interfaces',
    required: ['Minimap', 'Compass', 'World_map_icon', 'Wiki_lookup'],
    critical: true,
  },
  {
    category: 'ui/buttons',
    required: ['Minimap_self_marker', 'Flag_map_marker', 'Minimap_player_marker'],
    critical: false,
  },
  {
    category: 'equipment/helmets/detail',
    required: ['Bronze_full_helm_detail', 'Iron_full_helm_detail', 'Steel_full_helm_detail'],
    critical: false,
  },
  {
    category: 'equipment/bodies/detail',
    required: ['Bronze_platebody_detail', 'Iron_platebody_detail', 'Steel_platebody_detail'],
    critical: false,
  },
  {
    category: 'equipment/weapons/detail',
    required: ['Bronze_sword_detail', 'Iron_scimitar_detail', 'Steel_longsword_detail'],
    critical: false,
  },
];

/**
 * Verify all required OSRS assets are present and accessible
 */
async function verifyAssets(): Promise<void> {
  console.log('🔍 Verifying OSRS asset extraction...\n');

  const cacheDir = path.join(process.cwd(), 'assets/osrs-cache');
  let totalChecked = 0;
  let totalFound = 0;
  let criticalMissing = 0;
  let optionalMissing = 0;

  // Check if cache directory exists
  if (!(await fs.pathExists(cacheDir))) {
    console.log('❌ Asset cache directory not found!');
    console.log('Run "npm run extract-assets" to download OSRS assets');
    process.exit(1);
  }

  // Check manifest
  const manifestPath = path.join(cacheDir, 'manifest.json');
  if (!(await fs.pathExists(manifestPath))) {
    console.log('❌ Asset manifest not found!');
    console.log('Run "npm run extract-assets" to generate manifest');
    process.exit(1);
  }

  console.log('✅ Asset cache directory found');
  console.log('✅ Asset manifest found\n');

  // Verify each category
  for (const requirement of REQUIRED_ASSETS) {
    const categoryIcon = requirement.critical ? '🎯' : '📦';
    const statusText = requirement.critical ? 'CRITICAL' : 'OPTIONAL';

    console.log(`${categoryIcon} ${requirement.category} (${statusText}):`);

    let categoryFound = 0;

    for (const asset of requirement.required) {
      const assetPath = path.join(cacheDir, requirement.category, `${asset}.png`);
      totalChecked++;

      if (await fs.pathExists(assetPath)) {
        console.log(`  ✅ ${asset}`);
        totalFound++;
        categoryFound++;
      } else {
        console.log(`  ❌ ${asset} - MISSING`);
        if (requirement.critical) {
          criticalMissing++;
        } else {
          optionalMissing++;
        }
      }
    }

    const categoryPercent = Math.round((categoryFound / requirement.required.length) * 100);
    console.log(`     ${categoryFound}/${requirement.required.length} (${categoryPercent}%)\n`);
  }

  // Summary
  console.log('=====================================');
  console.log('📊 ASSET VERIFICATION SUMMARY');
  console.log('=====================================');
  console.log(`Total assets checked: ${totalChecked}`);
  console.log(`Found: ${totalFound}`);
  console.log(`Missing: ${totalChecked - totalFound}`);
  console.log(`  Critical missing: ${criticalMissing}`);
  console.log(`  Optional missing: ${optionalMissing}`);

  const overallPercent = Math.round((totalFound / totalChecked) * 100);
  console.log(`Overall completion: ${overallPercent}%`);

  // Status determination
  if (criticalMissing === 0) {
    console.log('\n🎉 VERIFICATION PASSED!');
    console.log('✅ All critical assets present');
    console.log('🎮 Ready to launch RuneRogue!');

    if (optionalMissing > 0) {
      console.log(`\n💡 Note: ${optionalMissing} optional assets missing`);
      console.log('Game will work but some features may use placeholders');
    }
  } else {
    console.log('\n❌ VERIFICATION FAILED!');
    console.log(`🚨 ${criticalMissing} critical assets missing`);
    console.log('\n🔧 To fix:');
    console.log('1. Run: npm run extract-assets');
    console.log('2. Check network connection');
    console.log('3. Verify OSRS Wiki access');
    process.exit(1);
  }

  console.log('\n=====================================');
}

// Check manifest integrity
async function checkManifestIntegrity(): Promise<void> {
  try {
    const manifestPath = path.join(process.cwd(), 'assets/osrs-cache/manifest.json');
    const manifest = await fs.readJson(manifestPath);

    console.log('📋 Manifest integrity check:');
    console.log(`  Total entries: ${Object.keys(manifest).length}`);

    // Check for required fields
    let validEntries = 0;
    for (const [key, metadata] of Object.entries(manifest)) {
      const meta = metadata as any;
      if (meta.name && meta.category && meta.extractedAt && meta.variants) {
        validEntries++;
      }
    }

    console.log(`  Valid entries: ${validEntries}`);
    console.log(
      `  Manifest health: ${Math.round((validEntries / Object.keys(manifest).length) * 100)}%`
    );

    if (validEntries === Object.keys(manifest).length) {
      console.log('✅ Manifest integrity check passed\n');
    } else {
      console.log('⚠️ Some manifest entries may be corrupted\n');
    }
  } catch (error) {
    console.log('❌ Manifest integrity check failed\n');
  }
}

// Performance check
async function checkPerformance(): Promise<void> {
  const cacheDir = path.join(process.cwd(), 'assets/osrs-cache');

  try {
    // Get directory size
    const getDirSize = async (dirPath: string): Promise<number> => {
      let size = 0;
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          size += await getDirSize(filePath);
        } else {
          size += stats.size;
        }
      }

      return size;
    };

    const totalSize = await getDirSize(cacheDir);
    const sizeMB = Math.round(totalSize / (1024 * 1024));

    console.log('🚀 Performance metrics:');
    console.log(`  Cache size: ${sizeMB} MB`);

    if (sizeMB > 100) {
      console.log('⚠️ Large cache size may impact loading times');
    } else {
      console.log('✅ Cache size is optimal');
    }

    console.log('');
  } catch (error) {
    console.log('⚠️ Could not check performance metrics\n');
  }
}

async function main(): Promise<void> {
  try {
    await checkManifestIntegrity();
    await checkPerformance();
    await verifyAssets();
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
