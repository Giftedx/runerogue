/**
 * Investigation of actual Colyseus schema exports and TypeRegistry structure
 */

import { ArraySchema, MapSchema, Schema } from '@colyseus/schema';

describe('Colyseus API Investigation', () => {
  it('should check what functions are actually exported from @colyseus/schema', () => {
    const colyseusSchema = require('@colyseus/schema');
    console.log('🔍 Available exports from @colyseus/schema:');
    console.log(Object.keys(colyseusSchema));

    // Check if any registration-related functions exist
    const registrationFunctions = Object.keys(colyseusSchema).filter(
      key =>
        key.toLowerCase().includes('register') ||
        key.toLowerCase().includes('type') ||
        key.toLowerCase().includes('id')
    );
    console.log('📋 Registration-related functions:', registrationFunctions);
  });

  it('should investigate TypeRegistry structure', () => {
    try {
      // Try to access TypeRegistry through different paths
      const schema = require('@colyseus/schema');

      // Check if TypeRegistry is exported
      if (schema.TypeRegistry) {
        console.log('✅ TypeRegistry is directly exported');
        console.log('TypeRegistry:', schema.TypeRegistry);
      } else {
        console.log('❌ TypeRegistry not directly exported');
      }

      // Try internal paths
      try {
        const TypeRegistry = require('@colyseus/schema/build/cjs/types/TypeRegistry');
        if (TypeRegistry) {
          console.log('✅ Found TypeRegistry via internal path');
          console.log('TypeRegistry keys:', Object.keys(TypeRegistry));

          // Check if it has the registration we need
          if (TypeRegistry.TypeRegistry) {
            console.log('Current TypeRegistry entries:', Object.keys(TypeRegistry.TypeRegistry));
          }
        }
      } catch (e) {
        console.log('❌ Could not access TypeRegistry via internal path:', e.message);
      }
    } catch (error) {
      console.log('❌ Error investigating TypeRegistry:', error);
    }
  });

  it('should check ArraySchema and MapSchema static properties', () => {
    console.log('🔍 ArraySchema static properties:');
    console.log(Object.getOwnPropertyNames(ArraySchema));
    console.log('🔍 ArraySchema prototype properties:');
    console.log(Object.getOwnPropertyNames(ArraySchema.prototype));

    console.log('🔍 MapSchema static properties:');
    console.log(Object.getOwnPropertyNames(MapSchema));

    // Check if they have any internal registration methods
    const arrayMethods = Object.getOwnPropertyNames(ArraySchema).filter(
      prop => typeof (ArraySchema as unknown as Record<string, unknown>)[prop] === 'function'
    );
    console.log('ArraySchema static methods:', arrayMethods);

    // Check their constructor names
    console.log('ArraySchema constructor name:', ArraySchema.name);
    console.log('MapSchema constructor name:', MapSchema.name);
  });

  it('should try to find the actual way to register types', () => {
    try {
      // Create an instance to see what methods are available
      const arrayInstance = new ArraySchema<string>();
      const schemaInstance = new Schema();

      console.log('🔍 Schema instance methods:');
      const schemaMethods = Object.getOwnPropertyNames(
        Object.getPrototypeOf(schemaInstance)
      ).filter(
        prop => typeof (schemaInstance as unknown as Record<string, unknown>)[prop] === 'function'
      );
      console.log(schemaMethods);

      // Check if there are any global registration functions
      const globalThis = global as unknown as Record<string, unknown>;
      const potentialRegFunctions = Object.keys(globalThis).filter(
        key => key.toLowerCase().includes('register') || key.toLowerCase().includes('colyseus')
      );
      console.log('🌐 Potential global registration functions:', potentialRegFunctions);
    } catch (error) {
      console.log('❌ Error checking registration methods:', error);
    }
  });
});
