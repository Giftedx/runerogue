/**
 * Debug test to verify ArraySchema and MapSchema registration in TypeRegistry
 */

// Import early fixes
import '../../utils/colyseus-definitive-fix';
import '../../utils/early-metadata-init';

import { ArraySchema, getIdentifier, MapSchema, registerType } from '@colyseus/schema';

describe('Colyseus Registration Debug', () => {
  it('should check if registerType and getIdentifier functions exist', () => {
    console.log('🔍 Checking Colyseus functions:');
    console.log('registerType exists:', typeof registerType);
    console.log('getIdentifier exists:', typeof getIdentifier);

    // Try to get identifiers for ArraySchema and MapSchema
    try {
      const arrayId = getIdentifier(ArraySchema);
      console.log('ArraySchema identifier:', arrayId);
    } catch (error) {
      console.log('Error getting ArraySchema identifier:', error);
    }

    try {
      const mapId = getIdentifier(MapSchema);
      console.log('MapSchema identifier:', mapId);
    } catch (error) {
      console.log('Error getting MapSchema identifier:', error);
    }
  });

  it('should attempt manual ArraySchema registration', () => {
    // Try different registration approaches
    console.log('🔧 Attempting manual ArraySchema registration:');

    try {
      // Approach 1: Use registerType if available
      if (typeof registerType === 'function') {
        registerType('ArraySchema', {
          constructor: ArraySchema,
        });
        console.log('✅ Registered ArraySchema via registerType');
      } else {
        console.log('❌ registerType function not available');
      }
    } catch (error) {
      console.log('❌ Error with registerType approach:', error);
    }

    // Check TypeRegistry directly if accessible
    try {
      // @ts-ignore - accessing internal Colyseus API
      const TypeRegistry = require('@colyseus/schema/build/cjs/types/TypeRegistry').TypeRegistry;
      if (TypeRegistry) {
        console.log('📋 Current TypeRegistry entries:');
        console.log(Object.keys(TypeRegistry));

        // Try to register directly
        TypeRegistry['ArraySchema'] = {
          constructor: ArraySchema,
        };
        console.log('✅ Manually registered ArraySchema in TypeRegistry');
      }
    } catch (error) {
      console.log('❌ Could not access TypeRegistry directly:', error);
    }
  });

  it('should create and test ArraySchema serialization', () => {
    console.log('🧪 Testing ArraySchema creation and serialization:');

    try {
      const testArray = new ArraySchema<string>();
      testArray.push('test1');
      testArray.push('test2');

      console.log('ArraySchema created successfully:', testArray.length);
      console.log('ArraySchema contents:', Array.from(testArray));

      // Try to get the class name that Colyseus sees
      console.log('ArraySchema constructor name:', testArray.constructor.name);
      console.log('ArraySchema prototype:', Object.getPrototypeOf(testArray).constructor.name);
    } catch (error) {
      console.log('❌ Error testing ArraySchema:', error);
    }
  });
});
