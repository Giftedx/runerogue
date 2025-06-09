/**
 * Minimal test to isolate Colyseus schema issues
 */

import 'reflect-metadata';
import '../../../server/utils/metadata-polyfill';

describe('Minimal Working Schema Test', () => {
  it('should check if we can create any schema at all', () => {
    console.log('Starting minimal schema test...');

    // Try to import just the basics
    const { Schema, defineTypes } = require('@colyseus/schema');

    console.log('Schema class:', !!Schema);
    console.log('defineTypes function:', !!defineTypes);

    // Create the most basic possible schema
    class TestSchema extends Schema {
      public name: string = 'test';
    }

    // Use defineTypes
    defineTypes(TestSchema, {
      name: 'string',
    });

    console.log('Schema created');

    // Create instance
    const instance = new TestSchema();
    console.log('Instance created:', instance.name);

    // Check metadata manually
    const metadata = (instance.constructor as any)[Symbol.metadata];
    console.log('Symbol.metadata exists on constructor:', !!metadata);
    console.log('Symbol.metadata value:', metadata);

    // Check if prototype has metadata
    const prototypeMetadata = (TestSchema.prototype as any)[Symbol.metadata];
    console.log('Symbol.metadata exists on prototype:', !!prototypeMetadata);

    // Check what's on the constructor
    const constructorKeys = Object.getOwnPropertyNames(instance.constructor);
    console.log('Constructor property names:', constructorKeys);

    const constructorSymbols = Object.getOwnPropertySymbols(instance.constructor);
    console.log('Constructor symbols:', constructorSymbols);

    expect(instance.name).toBe('test');
  });

  it('should attempt to encode without using Room', () => {
    console.log('Testing encoding without Room...');

    const { Schema, defineTypes } = require('@colyseus/schema');

    // Create ultra-minimal schema
    class SimpleSchema extends Schema {
      public value: number = 42;
    }

    defineTypes(SimpleSchema, {
      value: 'number',
    });

    const instance = new SimpleSchema();
    console.log('SimpleSchema instance created, value:', instance.value);

    // Try to manually add metadata if missing
    if (!(instance.constructor as any)[Symbol.metadata]) {
      console.log('Manually adding metadata to constructor...');
      (instance.constructor as any)[Symbol.metadata] = {
        value: { type: 'number', offset: 0 },
      };
    }

    // Check metadata again
    const metadata = (instance.constructor as any)[Symbol.metadata];
    console.log('Metadata after manual addition:', metadata);

    expect(instance.value).toBe(42);
  });
});
