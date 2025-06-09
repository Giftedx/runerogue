/**
 * Simple test to verify the decorator transpilation issue
 */

import 'reflect-metadata';

describe('Decorator Transpilation Debug', () => {
  it('should test decorator support in Jest environment', () => {
    // Test if decorators are working by importing from compiled JS
    const compiledSchemas = require('../../../dist/src/server/game/EntitySchemas');

    console.log('Compiled JS exports:', Object.keys(compiledSchemas));
    console.log('Player type:', typeof compiledSchemas.Player);

    expect(compiledSchemas.Player).toBeDefined();
    expect(typeof compiledSchemas.Player).toBe('function');

    // Try to create an instance
    const player = new compiledSchemas.Player();
    expect(player).toBeDefined();
    console.log('Player instance created successfully');
  });

  it('should compare TypeScript vs compiled output', () => {
    // Try the TypeScript version (this will likely fail)
    console.log('Testing TypeScript import...');
    try {
      const tsSchemas = require('../../game/EntitySchemas');
      console.log('TS exports:', Object.keys(tsSchemas));
      console.log('TS Player type:', typeof tsSchemas.Player);
    } catch (error) {
      console.log('TS import failed:', error.message);
    }

    // Use the compiled version that works
    const compiledSchemas = require('../../../dist/src/server/game/EntitySchemas');
    expect(compiledSchemas.Player).toBeDefined();
  });
});
