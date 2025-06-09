/**
 * Test to check Colyseus v1.x API exports and usage
 */

describe('Colyseus v1.x API Investigation', () => {
  it('should show available exports from @colyseus/schema v1.x', () => {
    const schema = require('@colyseus/schema');
    console.log('Available exports:', Object.keys(schema));
    console.log('Schema version:', schema.SCHEMA_VERSION || 'unknown');

    // Check if Encoder exists and how it works
    if (schema.Encoder) {
      console.log('Encoder constructor:', schema.Encoder);
      console.log('Encoder prototype:', Object.getOwnPropertyNames(schema.Encoder.prototype));
    } else {
      console.log('Encoder not found in exports');
    }

    // Check for other encoding functions
    if (schema.encode) {
      console.log('encode function:', schema.encode);
    }

    if (schema.decode) {
      console.log('decode function:', schema.decode);
    }

    // Check Schema class
    if (schema.Schema) {
      console.log('Schema class:', schema.Schema);
      console.log('Schema prototype:', Object.getOwnPropertyNames(schema.Schema.prototype));
    }
  });

  it('should test basic schema creation and encoding with v1.x API', () => {
    const { Schema, type } = require('@colyseus/schema');

    class TestSchema extends Schema {
      @type('string') name: string = 'test';
      @type('number') value: number = 42;
    }

    const instance = new TestSchema();
    console.log('Instance created:', instance);
    console.log('Instance name:', instance.name);
    console.log('Instance value:', instance.value);

    // Try to encode using the instance's encode method if available
    if (typeof instance.encode === 'function') {
      console.log('Instance has encode method');
      try {
        const encoded = instance.encode();
        console.log('Encoded successfully using instance.encode():', encoded.length, 'bytes');
      } catch (error) {
        console.log('Error with instance.encode():', error.message);
      }
    }

    // Try static Schema.encode if available
    const schemaModule = require('@colyseus/schema');
    if (schemaModule.encode) {
      try {
        const encoded = schemaModule.encode(instance);
        console.log('Encoded successfully using static encode():', encoded.length, 'bytes');
      } catch (error) {
        console.log('Error with static encode():', error.message);
      }
    }
  });
});
