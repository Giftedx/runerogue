/**
 * @deprecated LEGACY SCHEMA - This is a basic schema for testing and debugging.
 * It is not used in the main game and is pending removal.
 * Please use the schemas from '@runerogue/shared' instead.
 */

import { Schema, type } from '@colyseus/schema';

/**
 * Basic Vector2 Schema - isolated to avoid conflicts
 */
export class Vector2Schema extends Schema {
  @type('number') x: number = 0;
  @type('number') y: number = 0;
}

/**
 * Basic Health Schema - isolated to avoid conflicts
 */
export class HealthSchema extends Schema {
  @type('number') current: number = 10;
  @type('number') max: number = 10;
}
