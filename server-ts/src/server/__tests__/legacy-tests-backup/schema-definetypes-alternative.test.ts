import { Schema, defineTypes } from '@colyseus/schema';
import 'reflect-metadata';

/**
 * Test using defineTypes instead of decorators
 */
describe('Schema defineTypes Alternative', () => {
  class TestSchemaDefineTypes extends Schema {
    public name: string = '';
    public value: number = 0;

    static schema = defineTypes(TestSchemaDefineTypes, {
      name: 'string',
      value: 'number',
    });
  }

  it('should work with defineTypes approach', () => {
    const instance = new TestSchemaDefineTypes();
    instance.name = 'test';
    instance.value = 42;

    // Try to create encoder and encode
    expect(() => {
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder();
      const encoded = encoder.encode(instance, {}, false);
      console.log('Encoded successfully with defineTypes:', encoded.length, 'bytes');
    }).not.toThrow();

    expect(instance.name).toBe('test');
    expect(instance.value).toBe(42);
  });
});
