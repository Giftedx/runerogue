/**
 * EntitySchemas.ts - Working Colyseus schema definitions for RuneRogue
 *
 * This file provides the schema classes needed for multiplayer synchronization.
 * It uses simplified property names to avoid conflicts and focuses on core functionality.
 */

import { Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

/**
 * Item schema for inventory management
 */
export class InventoryItem extends Schema {
  @type('string') public itemId: string = '';
  @type('string') public name: string = '';
  @type('number') public quantity: number = 1;
  @type('number') public value: number = 0;
  @type('boolean') public stackable: boolean = false;
}
