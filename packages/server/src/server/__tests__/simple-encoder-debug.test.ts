/**
 * Simple encoder debug test to isolate serialization issues
 */

import { Encoder, Schema, type } from '@colyseus/schema';

class MinimalTestSchema extends Schema {
  @type('string') testProperty: string = 'test';
}

describe('Simple Encoder Debug', () => {
  it('should create and serialize minimal schema without errors', () => {
    expect(() => {
      const testSchema = new MinimalTestSchema();
      testSchema.testProperty = 'hello';

      // Encoder needs the schema as a state parameter
      const encoder = new Encoder(testSchema);

      // Try basic serialization
      const encoded = encoder.encode(testSchema, {}, false);
      expect(encoded).toBeDefined();
      expect(encoded.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it('should verify Schema class is properly constructed', () => {
    const testSchema = new MinimalTestSchema();
    expect(testSchema).toBeInstanceOf(Schema);
    expect(testSchema.testProperty).toBe('test');

    // Check if the schema has the required metadata
    expect((testSchema as any).constructor).toBeDefined();
    expect((testSchema as any).constructor.name).toBe('MinimalTestSchema');
  });
});
