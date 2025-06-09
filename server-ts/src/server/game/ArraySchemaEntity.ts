/**
 * ArraySchema entity registration for Colyseus v0.16.x.
 * This fixes: "Class 'ArraySchema' is not registered on TypeRegistry"
 */

import { ArraySchema } from '@colyseus/schema';
import '../utils/early-metadata-init';

// Import the entity decorator from Colyseus
import { entity } from '@colyseus/schema';

// Register ArraySchema as an entity
try {
  // Apply the entity decorator to ArraySchema
  entity()(ArraySchema);
  console.log('✅ ArraySchema registered as entity');
} catch (error) {
  console.warn('⚠️ Failed to register ArraySchema as entity:', error);
}

export { ArraySchema };
