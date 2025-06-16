/**
 * Debug schema metadata and registration
 */

import { Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

// Ensure Symbol.metadata exists
if (typeof Symbol.metadata === 'undefined') {
  (Symbol as any).metadata = Symbol('metadata');
}

describe('Schema Metadata Debug', () => {
  it('should verify Symbol.metadata polyfill works', () => {
    expect(typeof Symbol.metadata).toBe('symbol');
    console.log('Symbol.metadata:', Symbol.metadata);
  });

  it('should check if decorators apply metadata correctly', () => {
    class DebugSchema extends Schema {
      @type('string') name: string = '';
      @type('number') value: number = 0;
    }

    console.log('DebugSchema.name:', DebugSchema.name);
    console.log('DebugSchema constructor:', DebugSchema.constructor.name);
    console.log('DebugSchema[Symbol.metadata]:', DebugSchema[Symbol.metadata]);

    const metadata = DebugSchema[Symbol.metadata];
    if (metadata) {
      console.log('Metadata keys:', Object.keys(metadata));
      console.log('Metadata values:', Object.values(metadata));
      for (const [key, value] of Object.entries(metadata)) {
        console.log(`Field ${key}:`, value);
      }
    } else {
      console.log('⚠️ No metadata found on DebugSchema');
    }

    expect(metadata).toBeDefined();
    expect(Object.keys(metadata).length).toBeGreaterThan(0);
  });

  it('should check if reflect-metadata is working', () => {
    class TestForReflect extends Schema {
      @type('string') testField: string = '';
    }

    const designType = Reflect.getMetadata('design:type', TestForReflect.prototype, 'testField');
    console.log('Reflect design:type for testField:', designType);

    const customMeta = Reflect.getMetadata('custom', TestForReflect.prototype, 'testField');
    console.log('Custom metadata:', customMeta);
  });

  it('should check the @type decorator behavior', () => {
    // Manual decorator application to see what happens
    const decorator = type('string');

    class ManualSchema extends Schema {
      name: string = '';
    }

    console.log('Before decorator application:', ManualSchema[Symbol.metadata]);

    // Apply decorator manually
    try {
      decorator(ManualSchema.prototype, 'name');
      console.log('After decorator application:', ManualSchema[Symbol.metadata]);
    } catch (error) {
      console.log('Decorator application failed:', error.message);
    }

    const instance = new ManualSchema();
    console.log('Instance created:', instance.name);
  });
});
