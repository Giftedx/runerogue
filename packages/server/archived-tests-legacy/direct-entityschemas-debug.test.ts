/**
 * Direct test of EntitySchemas exports to debug the empty export issue
 */

import 'reflect-metadata';

describe('EntitySchemas Direct Import Debug', () => {
  it('should show what is actually exported from EntitySchemas', () => {
    // Use require to see what's actually there
    const entitySchemas = require('../../game/EntitySchemas');

    console.log('=== EntitySchemas Direct Import ===');
    console.log('Object.keys(entitySchemas):', Object.keys(entitySchemas));
    console.log('typeof entitySchemas:', typeof entitySchemas);
    console.log('entitySchemas === null:', entitySchemas === null);
    console.log('entitySchemas === undefined:', entitySchemas === undefined);
    console.log(
      'Object.getOwnPropertyNames(entitySchemas):',
      Object.getOwnPropertyNames(entitySchemas)
    );

    // Check specific exports
    console.log('entitySchemas.Player:', typeof entitySchemas.Player);
    console.log('entitySchemas.GameState:', typeof entitySchemas.GameState);
    console.log('entitySchemas.InventoryItem:', typeof entitySchemas.InventoryItem);
    console.log('entitySchemas.SchemaFactories:', typeof entitySchemas.SchemaFactories);

    // Check if they are constructors
    if (entitySchemas.Player) {
      console.log('Player.prototype:', typeof entitySchemas.Player.prototype);
      console.log('Player constructor:', entitySchemas.Player.constructor);
    }
  });

  it('should try dynamic import', async () => {
    try {
      // Try dynamic import
      const dynamicImport = await import('../../game/EntitySchemas');
      console.log('=== Dynamic Import ===');
      console.log('Dynamic import keys:', Object.keys(dynamicImport));
      console.log('Dynamic Player:', typeof dynamicImport.Player);
      console.log('Dynamic GameState:', typeof dynamicImport.GameState);
    } catch (error) {
      console.error('Dynamic import failed:', error);
    }
  });

  it('should check the actual file content via raw require', () => {
    // Try to see if there's a compilation issue
    const fs = require('fs');
    const path = require('path');

    const entitySchemasPath = path.resolve(__dirname, '../../game/EntitySchemas.ts');
    console.log('=== File System Check ===');
    console.log('File exists:', fs.existsSync(entitySchemasPath));

    if (fs.existsSync(entitySchemasPath)) {
      const content = fs.readFileSync(entitySchemasPath, 'utf8');
      const exportMatches = content.match(/export\s+class\s+(\w+)/g);
      console.log('Export classes found in file:', exportMatches);

      // Check if there are any obvious syntax errors
      const hasPlayerClass = content.includes('export class Player');
      const hasGameStateClass = content.includes('export class GameState');
      console.log('Has Player class export:', hasPlayerClass);
      console.log('Has GameState class export:', hasGameStateClass);
    }
  });
});
