/**
 * Debug test to investigate ArraySchema registration in TypeRegistry
 */

import { ArraySchema, getIdentifier, getType } from '@colyseus/schema';

describe('ArraySchema Registration Debug', () => {
  it('should verify ArraySchema is properly registered', () => {
    console.log('\n=== ArraySchema Registration Debug ===');

    // Check if ArraySchema constructor exists
    console.log('ArraySchema constructor:', ArraySchema);
    console.log('ArraySchema name:', ArraySchema.name);

    // Check if getIdentifier and getType functions exist
    console.log('getIdentifier function:', typeof getIdentifier);
    console.log('getType function:', typeof getType);

    // Try to get the identifier for ArraySchema
    let identifier;
    try {
      identifier = getIdentifier(ArraySchema);
      console.log('ArraySchema identifier:', identifier);
    } catch (error) {
      console.error('Error getting ArraySchema identifier:', error);
    }

    // Try to get the type by identifier
    if (identifier) {
      try {
        const type = getType(identifier);
        console.log('Retrieved type for identifier:', type);
      } catch (error) {
        console.error('Error getting type by identifier:', error);
      }
    }

    // Try to get type by "array" identifier (what should be registered)
    try {
      const arrayType = getType('array');
      console.log('Type for "array" identifier:', arrayType);
      console.log('Constructor matches:', arrayType?.constructor === ArraySchema);
    } catch (error) {
      console.error('Error getting array type:', error);
    }

    // Create an instance to see if it works
    try {
      const arrayInstance = new ArraySchema<string>();
      console.log('ArraySchema instance created:', arrayInstance);
      console.log('ArraySchema instance constructor:', arrayInstance.constructor);
      console.log('Instance identifier:', getIdentifier(arrayInstance.constructor));
    } catch (error) {
      console.error('Error creating ArraySchema instance:', error);
    }
  });

  it('should test ArraySchema with actual data', () => {
    console.log('\n=== ArraySchema Data Test ===');

    try {
      const stringArray = new ArraySchema<string>();
      stringArray.push('test1', 'test2', 'test3');

      console.log('String array length:', stringArray.length);
      console.log('String array items:', Array.from(stringArray));
      console.log('String array constructor identifier:', getIdentifier(stringArray.constructor));

      // Test number array
      const numberArray = new ArraySchema<number>();
      numberArray.push(1, 2, 3);

      console.log('Number array length:', numberArray.length);
      console.log('Number array items:', Array.from(numberArray));
      console.log('Number array constructor identifier:', getIdentifier(numberArray.constructor));
    } catch (error) {
      console.error('Error in ArraySchema data test:', error);
    }
  });
});
