import { Encoder, Schema } from '@colyseus/schema';
import 'reflect-metadata';

describe('Schema Encoder Investigation', () => {
  it('should investigate Encoder requirements', () => {
    console.log('Encoder constructor:', Encoder);
    console.log('Encoder prototype:', Object.getOwnPropertyNames(Encoder.prototype));

    try {
      const encoder = new Encoder();
      console.log('Encoder created successfully:', encoder);
    } catch (error) {
      console.log('Encoder creation error:', error);
    }
  });

  it('should test minimal schema without encoding', () => {
    // Simple test without encoding to verify basic functionality
    class MinimalSchema extends Schema {}
    const schema = new MinimalSchema();

    console.log('Schema created:', {
      constructor: schema.constructor.name,
      hasMetadata: schema['Symbol(Symbol.metadata)'] !== undefined,
      hasColyseus$: schema['$colyseus'] !== undefined,
    });

    expect(schema).toBeInstanceOf(Schema);
  });
});
