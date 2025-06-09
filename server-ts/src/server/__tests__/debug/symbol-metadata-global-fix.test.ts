/**
 * Test to fix Symbol.metadata globally before any other imports
 */

// Define Symbol.metadata globally before any imports if it doesn't exist
if (!Symbol.metadata) {
  (global as any).Symbol.metadata = Symbol.for('Symbol.metadata');
}

import { Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

class TestSchema extends Schema {
  @type('string')
  name: string = 'test';

  @type('number')
  value: number = 42;
}

describe('Symbol.metadata Global Fix', () => {
  it('should have Symbol.metadata defined globally', () => {
    console.log('Symbol.metadata:', Symbol.metadata);
    expect(Symbol.metadata).toBeDefined();
  });

  it('should have metadata on TestSchema', () => {
    const prototype = TestSchema.prototype;
    const metadata = prototype.constructor[Symbol.metadata];
    console.log('TestSchema metadata:', metadata);

    // Check all symbols on prototype
    console.log('All symbols:', Object.getOwnPropertySymbols(prototype));

    expect(metadata).toBeDefined();
  });

  it('should serialize without errors using global Symbol.metadata', () => {
    const instance = new TestSchema();
    instance.name = 'test_name';
    instance.value = 123;

    expect(() => {
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder();
      const encoded = encoder.encode(instance, {}, false);
      console.log('Encoded successfully with global Symbol.metadata:', encoded.length, 'bytes');
    }).not.toThrow();
  });
});
