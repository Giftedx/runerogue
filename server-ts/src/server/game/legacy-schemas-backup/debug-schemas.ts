/**
 * Debug script to test EntitySchemas compilation and exports
 */

// First, let's try importing the reflect-metadata
import 'reflect-metadata';

// Import Colyseus schema components
import { Schema, type } from '@colyseus/schema';

// Try to create a simple schema class
class SimpleTestSchema extends Schema {
  @type('string') public name: string = '';
  @type('number') public value: number = 0;
}

// Test creating an instance
try {
  const instance = new SimpleTestSchema();
  instance.name = 'test';
  instance.value = 42;
  console.log('✅ Simple schema works:', { name: instance.name, value: instance.value });
} catch (error) {
  console.error('❌ Simple schema failed:', error);
}

// Now try importing from EntitySchemas
try {
  const entitySchemas = require('./EntitySchemas.ts');
  console.log('EntitySchemas exports:', Object.keys(entitySchemas));
  console.log('Player class:', entitySchemas.Player);
  console.log('Type of Player:', typeof entitySchemas.Player);

  if (entitySchemas.Player) {
    try {
      const player = new entitySchemas.Player();
      console.log('✅ Player instance created:', player);
    } catch (playerError) {
      console.error('❌ Player instantiation failed:', playerError);
    }
  }
} catch (importError) {
  console.error('❌ EntitySchemas import failed:', importError);
}

// Check if decorators are working
console.log('Reflect metadata support:', typeof Reflect?.getMetadata);
