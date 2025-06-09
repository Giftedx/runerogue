/**
 * Simple encoder test to isolate the issue
 */

describe('Simple Encoder Test', () => {
  it('should show what happens when we try to create an Encoder', () => {
    const { Schema, type, Encoder } = require('@colyseus/schema');

    class TestSchema extends Schema {
      // empty schema
    }

    const instance = new TestSchema();
    console.log('Instance created:', !!instance);
    console.log('Instance constructor:', !!instance.constructor);
    console.log('Constructor name:', instance.constructor?.name);

    try {
      console.log('About to create Encoder...');
      const encoder = new Encoder(instance);
      console.log('Encoder created successfully:', !!encoder);
    } catch (error) {
      console.log('Error creating encoder:', error.message);
      console.log('Error stack:', error.stack);
    }
  });
});
