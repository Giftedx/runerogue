/**
 * Combat Assets Extraction Script
 * Extracts specific OSRS combat visual effects (damage splats, projectiles)
 * discovered from OSRS Wiki analysis for multiplayer gameplay feedback.
 *
 * @author RuneRogue Team
 * @license CC BY-NC-SA 3.0 (Attribution required for OSRS Wiki content)
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");

// Configuration
const WIKI_API = "https://oldschool.runescape.wiki/api.php";
const WIKI_IMAGE_BASE = "https://oldschool.runescape.wiki/images/";
const ASSET_CACHE_DIR = path.join(
  __dirname,
  "../packages/server/assets/osrs-cache"
);
const MANIFEST_PATH = path.join(ASSET_CACHE_DIR, "manifest.json");

// Combat assets to extract (discovered from OSRS Wiki)
const COMBAT_ASSETS = [
  // Damage Hitsplats
  {
    name: "Damage_hitsplat.png",
    category: "effects/hitsplats",
    description: "Standard damage hitsplat",
  },
  {
    name: "Zero_damage_hitsplat.png",
    category: "effects/hitsplats",
    description: "Zero damage (blocked/missed)",
  },
  {
    name: "Heal_hitsplat.png",
    category: "effects/hitsplats",
    description: "Healing effect hitsplat",
  },
  {
    name: "Poison_hitsplat.png",
    category: "effects/hitsplats",
    description: "Poison damage hitsplat",
  },
  {
    name: "Venom_hitsplat.png",
    category: "effects/hitsplats",
    description: "Venom damage hitsplat",
  },

  // Additional combat effects to try
  {
    name: "Max_hit_hitsplat.png",
    category: "effects/hitsplats",
    description: "Maximum damage hitsplat",
  },
  {
    name: "Prayer_hitsplat.png",
    category: "effects/hitsplats",
    description: "Prayer point change",
  },

  // Projectiles (common ones to try)
  {
    name: "Arrow.png",
    category: "effects/projectiles",
    description: "Basic arrow projectile",
  },
  {
    name: "Bronze_arrow.png",
    category: "effects/projectiles",
    description: "Bronze arrow projectile",
  },
  {
    name: "Iron_arrow.png",
    category: "effects/projectiles",
    description: "Iron arrow projectile",
  },
  {
    name: "Magic_dart.png",
    category: "effects/projectiles",
    description: "Magic dart spell projectile",
  },
  {
    name: "Fire_bolt.png",
    category: "effects/projectiles",
    description: "Fire bolt spell projectile",
  },
];

/**
 * Get the direct image URL from OSRS Wiki for a specific file
 */
async function getWikiImageUrl(filename) {
  try {
    const response = await axios.get(WIKI_API, {
      params: {
        action: "query",
        format: "json",
        titles: `File:${filename}`,
        prop: "imageinfo",
        iiprop: "url",
      },
      headers: {
        "User-Agent": "RuneRogue/1.0 (Asset Extraction Bot)",
      },
      timeout: 15000,
    });

    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0];

    if (pageId === "-1") {
      return null; // File not found
    }

    const imageInfo = pages[pageId].imageinfo;
    if (imageInfo && imageInfo.length > 0) {
      return imageInfo[0].url;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching image URL for ${filename}:`, error.message);
    return null;
  }
}

/**
 * Download and save an asset
 */
async function downloadAsset(imageUrl, localPath) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "RuneRogue/1.0 (Asset Extraction Bot)",
      },
      timeout: 30000,
    });

    const buffer = Buffer.from(response.data);

    // Ensure directory exists
    await fs.ensureDir(path.dirname(localPath));

    // Write file
    await fs.writeFile(localPath, buffer);

    // Calculate hash for integrity
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    return {
      success: true,
      hash,
      size: buffer.length,
      format: path.extname(localPath).toLowerCase(),
    };
  } catch (error) {
    console.error(`Error downloading asset:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Load existing manifest
 */
async function loadManifest() {
  try {
    if (await fs.pathExists(MANIFEST_PATH)) {
      const content = await fs.readJson(MANIFEST_PATH);
      return new Map(Object.entries(content));
    }
  } catch (error) {
    console.warn("Could not load existing manifest:", error.message);
  }
  return new Map();
}

/**
 * Save manifest
 */
async function saveManifest(manifest) {
  try {
    const manifestObj = Object.fromEntries(manifest);
    await fs.writeJson(MANIFEST_PATH, manifestObj, { spaces: 2 });
    console.log("✅ Manifest updated successfully");
  } catch (error) {
    console.error("❌ Error saving manifest:", error.message);
  }
}

/**
 * Main extraction function
 */
async function extractCombatAssets() {
  console.log("🎮 RuneRogue Combat Assets Extraction");
  console.log("=====================================");
  console.log(`📁 Asset cache directory: ${ASSET_CACHE_DIR}`);
  console.log(`📋 Assets to extract: ${COMBAT_ASSETS.length}`);
  console.log("");

  // Ensure cache directory exists
  await fs.ensureDir(ASSET_CACHE_DIR);

  // Load existing manifest
  const manifest = await loadManifest();

  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  for (const asset of COMBAT_ASSETS) {
    const { name, category, description } = asset;
    const cacheKey = `${category}/${name}`;
    const localPath = path.join(ASSET_CACHE_DIR, category, name);

    console.log(`🔍 Processing: ${name}`);
    console.log(`   📂 Category: ${category}`);
    console.log(`   📄 Description: ${description}`);

    // Check if already exists
    if (await fs.pathExists(localPath)) {
      console.log(`   ✓ Already cached: ${cacheKey}`);
      skippedCount++;
      console.log("");
      continue;
    }

    // Get Wiki image URL
    console.log(`   🌐 Fetching from OSRS Wiki...`);
    const imageUrl = await getWikiImageUrl(name);

    if (!imageUrl) {
      console.log(`   ❌ Not found on Wiki: ${name}`);
      failureCount++;
      console.log("");
      continue;
    }

    console.log(`   📥 Downloading from: ${imageUrl}`);

    // Download asset
    const result = await downloadAsset(imageUrl, localPath);

    if (result.success) {
      console.log(`   ✅ Downloaded successfully`);
      console.log(`   📊 Size: ${result.size} bytes`);
      console.log(`   🔐 Hash: ${result.hash.substring(0, 16)}...`);

      // Add to manifest
      manifest.set(cacheKey, {
        name: name.replace(".png", ""),
        category,
        description,
        originalUrl: imageUrl,
        hash: result.hash,
        size: result.size,
        format: result.format,
        extractedAt: new Date().toISOString(),
        variants: [
          {
            resolution: "original",
            path: path.relative(ASSET_CACHE_DIR, localPath),
            format: result.format,
          },
        ],
      });

      successCount++;
    } else {
      console.log(`   ❌ Download failed: ${result.error}`);
      failureCount++;
    }

    console.log("");

    // Small delay to be respectful to the Wiki
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Save manifest
  await saveManifest(manifest);

  // Summary
  console.log("📊 EXTRACTION SUMMARY");
  console.log("====================");
  console.log(`✅ Successfully extracted: ${successCount} assets`);
  console.log(`⏭️  Already cached: ${skippedCount} assets`);
  console.log(`❌ Failed to extract: ${failureCount} assets`);
  console.log(`📁 Total cache size: ${manifest.size} assets`);
  console.log("");

  if (successCount > 0) {
    console.log("🎉 New combat assets are ready for integration!");
    console.log(`📍 Location: ${ASSET_CACHE_DIR}`);
    console.log("");
    console.log("Next steps:");
    console.log("1. Integrate assets into Phaser client");
    console.log("2. Implement damage splat rendering");
    console.log("3. Test multiplayer combat feedback");
  }

  return {
    success: successCount + skippedCount,
    failed: failureCount,
    total: COMBAT_ASSETS.length,
  };
}

// Run extraction if this script is executed directly
if (require.main === module) {
  extractCombatAssets()
    .then((result) => {
      if (result.failed > 0) {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("💥 Fatal error during extraction:", error);
      process.exit(1);
    });
}

module.exports = { extractCombatAssets };
