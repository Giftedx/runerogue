import { Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

/**
 * Test to check if schema metadata is working correctly
 */
describe('Schema Metadata Test', () => {
  class TestSchema extends Schema {
    @type('string')
    public name: string = '';

    @type('number')
    public value: number = 0;
  }

  it('should have metadata available for TestSchema', () => {
    const instance = new TestSchema();
    instance.name = 'test';
    instance.value = 42;

    // Check if metadata is available
    const prototype = Object.getPrototypeOf(instance);
    const metadata = prototype[Symbol.metadata];

    console.log('TestSchema prototype:', prototype);
    console.log('Symbol.metadata:', Symbol.metadata);
    console.log('Metadata:', metadata);
    console.log('Constructor:', prototype.constructor);
    console.log('All symbols:', Object.getOwnPropertySymbols(prototype));

    expect(metadata).toBeDefined();
  });

  it('should serialize without errors', () => {
    const instance = new TestSchema();
    instance.name = 'test';
    instance.value = 42;

    // Try to create encoder and encode
    expect(() => {
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder();
      const encoded = encoder.encode(instance, {}, false);
      console.log('Encoded successfully:', encoded.length, 'bytes');
    }).not.toThrow();
  });
});
