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

      // Try basic serialization - use setState method
      encoder.setState(testSchema);
      const result = encoder.hasChanges();
      expect(result).toBeDefined();
    }).not.toThrow();
  });

  it('should verify Schema class is properly constructed', () => {
    const testSchema = new MinimalTestSchema();
    expect(testSchema).toBeInstanceOf(Schema);
    expect(testSchema.testProperty).toBe('test');

    // Check if the schema has the required metadata
    expect((testSchema as unknown as Record<string, unknown>).constructor).toBeDefined();
    expect((testSchema.constructor as Function).name).toBe('MinimalTestSchema');
  });
});
