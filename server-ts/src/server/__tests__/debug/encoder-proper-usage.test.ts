/**
 * Test to check if Encoder works with proper schema instance
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

describe('Encoder with Proper Schema Instance', () => {
  it('should create encoder with schema instance', () => {
    const instance = new TestSchema();
    instance.name = 'test_name';
    instance.value = 123;

    expect(() => {
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder(instance); // Pass schema instance to constructor
      console.log('Encoder created successfully with schema instance:', encoder);
    }).not.toThrow();
  });

  it('should encode schema instance properly', () => {
    const instance = new TestSchema();
    instance.name = 'test_name';
    instance.value = 123;

    expect(() => {
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder(instance);
      const encoded = encoder.encode();
      console.log('Encoded successfully:', encoded.length, 'bytes');
    }).not.toThrow();
  });

  it('should check what metadata is available on the schema', () => {
    const instance = new TestSchema();
    const constructor = instance.constructor as any;

    console.log('Constructor:', constructor.name);
    console.log('Symbol.metadata on global:', typeof Symbol.metadata);
    console.log('Constructor[Symbol.metadata]:', constructor[Symbol.metadata]);

    // Check all symbols on the constructor
    const symbols = Object.getOwnPropertySymbols(constructor);
    console.log('Constructor symbols:', symbols);

    symbols.forEach(symbol => {
      console.log(`Symbol ${symbol.toString()}:`, constructor[symbol]);
    });
  });
});
