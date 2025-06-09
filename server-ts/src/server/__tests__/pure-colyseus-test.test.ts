/**
 * Pure Colyseus test without any custom fixes
 * This will help identify the root cause of the serialization issues
 */

import { Encoder, Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

// Simple schema without any custom fixes
class PureTestSchema extends Schema {
  @type('string')
  public name: string = '';

  @type('number')
  public value: number = 0;

  constructor() {
    super();
  }
}

describe('Pure Colyseus Schema Test', () => {
  test('should create schema instance', () => {
    const instance = new PureTestSchema();
    instance.name = 'test';
    instance.value = 42;

    expect(instance.name).toBe('test');
    expect(instance.value).toBe(42);
  });

  test('should have proper constructor metadata', () => {
    const instance = new PureTestSchema();

    expect(instance.constructor).toBeDefined();
    expect(typeof instance.constructor).toBe('function');
    expect(instance.constructor.name).toBe('PureTestSchema');
  });

  test('should check metadata availability', () => {
    const instance = new PureTestSchema();

    // Check if reflection metadata is available
    const metadata = Reflect.getMetadata('design:type', instance, 'name');
    console.log('Reflection metadata for name field:', metadata);

    // Check if Symbol.metadata exists
    console.log('Symbol.metadata exists:', !!Symbol.metadata);

    // Check if the instance has any colyseus-specific metadata
    console.log('Instance prototype:', Object.getPrototypeOf(instance));
    console.log('Constructor metadata keys:', Reflect.getMetadataKeys(instance.constructor));
  });

  test('should try simple encoding without TypeContext', () => {
    const instance = new PureTestSchema();
    instance.name = 'test';
    instance.value = 42;

    // Try to create an encoder without TypeContext (empty constructor)
    expect(() => {
      const encoder = new Encoder();
      console.log('Empty Encoder created successfully:', !!encoder);
    }).not.toThrow();
  });

  test('should investigate TypeContext creation', () => {
    const instance = new PureTestSchema();
    instance.name = 'test';
    instance.value = 42;

    expect(() => {
      // Import TypeContext directly to see what fails
      const { TypeContext } = require('@colyseus/schema/build/src/types/TypeContext');
      console.log('TypeContext imported:', !!TypeContext);

      // Try to create TypeContext directly
      const context = new TypeContext();
      console.log('TypeContext created:', !!context);
    }).not.toThrow();
  });

  test('should try encoder with proper error handling', () => {
    const instance = new PureTestSchema();
    instance.name = 'test';
    instance.value = 42;

    try {
      const encoder = new Encoder(instance);
      console.log('✅ Encoder created with instance');

      const encoded = encoder.encode();
      console.log('✅ Encoding successful, bytes:', encoded.length);

      expect(encoded.length).toBeGreaterThan(0);
    } catch (error) {
      console.error('❌ Encoder creation/encoding failed:', error.message);
      console.error('Error stack:', error.stack);

      // Log detailed info about the instance
      console.log('Instance constructor:', instance.constructor);
      console.log('Instance prototype:', Object.getPrototypeOf(instance));
      console.log('Instance own properties:', Object.getOwnPropertyNames(instance));

      throw error;
    }
  });
});
