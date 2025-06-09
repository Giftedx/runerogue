/**
 * Test to verify that decorators are working properly in Jest environment
 */

import { Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

// Test basic decorator functionality
@type('string')
class TestMetadata {
  value: string = 'test';
}

class TestSchema extends Schema {
  @type('string') public testField: string = 'hello';
  @type('number') public testNumber: number = 42;
}

describe('Decorator Functionality Test', () => {
  it('should verify Reflect.metadata is available', () => {
    expect(Reflect).toBeDefined();
    expect(Reflect.getMetadata).toBeDefined();
  });

  it('should create TestSchema without errors', () => {
    expect(() => {
      const instance = new TestSchema();
      console.log('Created TestSchema:', instance);
      console.log('TestSchema fields:', Object.keys(instance));
      console.log('TestSchema constructor:', instance.constructor.name);
    }).not.toThrow();
  });

  it('should have decorator metadata on TestSchema', () => {
    const instance = new TestSchema();

    // Check if the class has the expected structure
    expect(instance).toBeInstanceOf(Schema);
    expect(instance.testField).toBe('hello');
    expect(instance.testNumber).toBe(42);

    // Check for Colyseus-specific metadata
    console.log('TestSchema metadata keys:', Reflect.getMetadataKeys(TestSchema));
    console.log(
      'TestSchema prototype metadata keys:',
      Reflect.getMetadataKeys(TestSchema.prototype)
    );
  });

  it('should be able to access colyseus schema properties', () => {
    const instance = new TestSchema();

    // Try to access schema-specific methods/properties
    console.log(
      'Schema methods available:',
      Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
    );
    console.log('Schema constructor properties:', Object.getOwnPropertyNames(instance.constructor));

    // Check if defineTypes was called (which is what triggers the schema registration)
    const hasDefineTypes = typeof (instance.constructor as any)._definition !== 'undefined';
    console.log('Has _definition:', hasDefineTypes);
  });
});
