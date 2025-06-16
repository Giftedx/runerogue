/**
 * Minimal EntitySchemas test - just one class to see if the issue is with specific classes
 */

import { Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

/**
 * Test with just one simple class
 */
export class Player extends Schema {
  @type('string') public id: string = '';
  @type('string') public username: string = '';
  @type('number') public x: number = 0;
  @type('number') public y: number = 0;
}

console.log('Minimal EntitySchemas loaded successfully');
