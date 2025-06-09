/**
 * Test to verify Symbol.metadata polyfill works correctly
 */

import '../../utils/comprehensive-metadata-polyfill';

describe('Symbol.metadata Polyfill Test', () => {
  it('should have Symbol.metadata available globally', () => {
    expect(Symbol.metadata).toBeDefined();
    expect(typeof Symbol.metadata).toBe('symbol');
  });

  it('should allow Colyseus schema creation without errors', () => {
    // This test just verifies that requiring @colyseus/schema doesn't throw
    expect(() => {
      const { Schema, type } = require('@colyseus/schema');

      class TestSchema extends Schema {
        @type('string')
        name: string = '';

        @type('number')
        value: number = 0;
      }

      const instance = new TestSchema();
      instance.name = 'test';
      instance.value = 42;

      console.log('✅ Schema created successfully:', instance.name, instance.value);
    }).not.toThrow();
  });
});
