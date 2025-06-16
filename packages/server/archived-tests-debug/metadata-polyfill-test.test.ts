/**
 * Test the metadata polyfill to see if it resolves the Colyseus schema issues
 */

import { Schema, type } from '@colyseus/schema';
import '../../utils/metadata-polyfill';

class TestSchema extends Schema {
  @type('string')
  name: string = '';

  @type('number')
  value: number = 0;
}

describe('Metadata Polyfill Test', () => {
  beforeEach(() => {
    console.log('Symbol.metadata type:', typeof Symbol.metadata);
  });

  it('should have Symbol.metadata defined', () => {
    expect(Symbol.metadata).toBeDefined();
  });

  it('should allow Encoder creation without errors', () => {
    expect(() => {
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder();
      console.log('Encoder created successfully:', !!encoder);
    }).not.toThrow();
  });

  it('should serialize schema objects without errors', () => {
    const instance = new TestSchema();
    instance.name = 'test';
    instance.value = 42;

    expect(() => {
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder();
      const encoded = encoder.encode(instance, {}, false);
      console.log('Encoded successfully:', encoded.length, 'bytes');
    }).not.toThrow();
  });
});
