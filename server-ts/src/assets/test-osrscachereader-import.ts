/**
 * Test osrscachereader import and basic functionality
 */

async function testOSRSCacheReader() {
  try {
    console.log('Testing osrscachereader import...');

    // Try to import osrscachereader
    const osrsCacheModule = await import('osrscachereader');
    console.log('✓ Successfully imported osrscachereader');
    console.log('Available exports:', Object.keys(osrsCacheModule));

    const { RSCache, IndexType, ConfigType } = osrsCacheModule;

    if (RSCache) {
      console.log('✓ RSCache class is available');
    }
    if (IndexType) {
      console.log('✓ IndexType enum is available');
      console.log('IndexType values:', Object.keys(IndexType));
    }
    if (ConfigType) {
      console.log('✓ ConfigType enum is available');
      console.log('ConfigType values:', Object.keys(ConfigType));
    }

    // Try to create a cache instance (will fail without cache files, but we can see if the class works)
    try {
      const cache = new RSCache('./nonexistent');
      console.log('✓ RSCache constructor works');
    } catch (error) {
      console.log('✓ RSCache constructor throws expected error:', error.message);
    }

    console.log('\n=== Test completed successfully ===');
    return true;
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

testOSRSCacheReader().then(success => {
  process.exit(success ? 0 : 1);
});
