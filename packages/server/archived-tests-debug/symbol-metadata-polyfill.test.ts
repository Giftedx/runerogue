import 'reflect-metadata';

/**
 * Symbol.metadata polyfill for compatibility with Colyseus schema system
 * This provides the missing Symbol.metadata that Colyseus encoder expects
 */

// Check if Symbol.metadata exists, if not create it
if (typeof Symbol.metadata === 'undefined') {
  (Symbol as any).metadata = Symbol.for('Symbol.metadata');
  console.log('Created Symbol.metadata polyfill');
} else {
  console.log('Symbol.metadata already exists');
}

// Verify the polyfill works
console.log('Symbol.metadata after polyfill:', Symbol.metadata);
console.log('typeof Symbol.metadata:', typeof Symbol.metadata);

describe('Symbol.metadata Polyfill Test', () => {
  it('should have Symbol.metadata defined after polyfill', () => {
    expect(Symbol.metadata).toBeDefined();
    expect(typeof Symbol.metadata).toBe('symbol');
  });

  it('should allow Colyseus encoder to be created', () => {
    expect(() => {
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder();
      console.log('Encoder created successfully:', encoder);
    }).not.toThrow();
  });
});
