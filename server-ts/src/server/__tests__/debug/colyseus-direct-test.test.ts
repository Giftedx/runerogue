/**
 * Direct Colyseus diagnostics test
 */

// Import polyfill first
import '../../utils/reflect-metadata-init';

describe('Colyseus Schema Direct Test', () => {
  it('should check Symbol.metadata availability', () => {
    console.log('🔍 Symbol.metadata exists:', !!Symbol.metadata);
    console.log('🔍 Symbol.metadata value:', Symbol.metadata);
    expect(Symbol.metadata).toBeDefined();
  });

  it('should import Colyseus Schema classes successfully', () => {
    const { Schema, type } = require('@colyseus/schema');
    expect(Schema).toBeDefined();
    expect(type).toBeDefined();
    console.log('🔍 Schema imported:', !!Schema);
    console.log('🔍 type decorator imported:', !!type);
  });

  it('should create a simple schema class', () => {
    const { Schema, type } = require('@colyseus/schema');

    class TestSchema extends Schema {
      @type('string') testField = 'test';
    }

    const instance = new TestSchema();
    expect(instance).toBeDefined();
    expect(instance.testField).toBe('test');
    console.log('🔍 Schema instance created successfully');
  });

  it('should check if Encoder can be created with a state', () => {
    const { Schema, type, Encoder } = require('@colyseus/schema');

    class TestState extends Schema {
      @type('string') message = 'hello';
    }

    const state = new TestState();
    expect(() => {
      const encoder = new Encoder(state);
      console.log('🔍 Encoder created with state:', !!encoder);
    }).not.toThrow();
  });
});
