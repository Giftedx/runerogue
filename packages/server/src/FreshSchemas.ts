/**
 * Fresh schema test in new location
 */

import { Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

export class FreshInventoryItem extends Schema {
  @type('string') public itemId: string = '';
  @type('string') public name: string = '';
  @type('number') public quantity: number = 1;
}
