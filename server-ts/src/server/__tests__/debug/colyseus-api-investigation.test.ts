/**
 * Investigate what the encode object actually contains in Colyseus v2.x
 */
import 'reflect-metadata';
import '../../utils/symbol-metadata-polyfill';

describe('Colyseus v2.x API Investigation', () => {
  it('should investigate what encode actually is', () => {
    const colyseusSchema = require('@colyseus/schema');

    console.log('Type of encode:', typeof colyseusSchema.encode);
    console.log('Encode object structure:', colyseusSchema.encode);

    if (typeof colyseusSchema.encode === 'object' && colyseusSchema.encode !== null) {
      console.log('Encode object keys:', Object.keys(colyseusSchema.encode));
      console.log('Encode object properties:', Object.getOwnPropertyNames(colyseusSchema.encode));
    }
  });

  it('should check if schemas have a built-in serialize method', () => {
    const { Schema, type } = require('@colyseus/schema');

    class TestSchema extends Schema {
      @type('string') name: string = 'test';
      @type('number') value: number = 42;
    }

    const instance = new TestSchema();

    console.log('Instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
    console.log(
      'Instance constructor methods:',
      Object.getOwnPropertyNames(instance.constructor.prototype)
    );

    // Check if there's a serialize, encode, or similar method
    if ('serialize' in instance) {
      console.log('Found serialize method');
    }
    if ('encode' in instance) {
      console.log('Found encode method');
    }
    if ('toJSON' in instance) {
      console.log('Found toJSON method');
    }
  });

  it('should investigate Schema base class methods', () => {
    const { Schema } = require('@colyseus/schema');

    console.log('Schema prototype methods:', Object.getOwnPropertyNames(Schema.prototype));
    console.log('Schema static methods:', Object.getOwnPropertyNames(Schema));

    // Check if Schema has static encode method
    if (Schema.encode) {
      console.log('Schema has static encode method');
      console.log('Schema.encode type:', typeof Schema.encode);
    }
  });
});
