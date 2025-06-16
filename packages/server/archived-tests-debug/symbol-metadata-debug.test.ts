/**
 * Quick test to debug Symbol.metadata issue
 */

// Import our polyfill
import '../../utils/reflect-metadata-init';

describe('Symbol.metadata debug', () => {
  it('should have Symbol.metadata available', () => {
    console.log('Symbol.metadata exists:', !!Symbol.metadata);
    console.log('Symbol.metadata value:', Symbol.metadata);
    expect(Symbol.metadata).toBeDefined();
  });

  it('should be able to access metadata on objects', () => {
    const testObj = {};
    console.log('Can access testObj[Symbol.metadata]:', testObj[Symbol.metadata]);
    // This should not throw
    expect(() => testObj[Symbol.metadata]).not.toThrow();
  });

  it('should work with Colyseus imports', () => {
    expect(() => {
      const { Schema } = require('@colyseus/schema');
      console.log('Schema imported successfully:', !!Schema);

      // Try to create a simple schema
      class TestSchema extends Schema {}
      const instance = new TestSchema();
      console.log('Schema instance created:', !!instance);
    }).not.toThrow();
  });
});
