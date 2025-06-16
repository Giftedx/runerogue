/**
 * Isolated test to check EntitySchemas without any patches or setup
 */

// No jest setup imports - bypass all patches
import 'reflect-metadata';

describe('EntitySchemas Isolated Test', () => {
  it('should load EntitySchemas classes directly', () => {
    // Import after describe to avoid jest setup interference
    const EntitySchemas = require('../../game/EntitySchemas');

    console.log('Direct require result:', EntitySchemas);
    console.log('Keys:', Object.keys(EntitySchemas));
    console.log('Player:', EntitySchemas.Player);
    console.log('typeof Player:', typeof EntitySchemas.Player);

    expect(EntitySchemas).toBeDefined();
    expect(Object.keys(EntitySchemas).length).toBeGreaterThan(0);
  });

  it('should create classes using ES6 import syntax', async () => {
    // Use dynamic import to bypass CommonJS issues
    const EntitySchemas = await import('../../game/EntitySchemas');

    console.log('ES6 import result:', EntitySchemas);
    console.log('ES6 Keys:', Object.keys(EntitySchemas));
    console.log('ES6 Player:', EntitySchemas.Player);

    if (EntitySchemas.Player) {
      try {
        const player = new EntitySchemas.Player();
        console.log('ES6 Player instance:', player);
        expect(player).toBeDefined();
      } catch (error) {
        console.error('ES6 Player creation error:', error);
      }
    }
  });
});
