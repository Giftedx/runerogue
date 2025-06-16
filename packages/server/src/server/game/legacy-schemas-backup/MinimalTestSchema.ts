/**
 * Minimal test schema to isolate the export issue
 */

import { Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

export class MinimalTestItem extends Schema {
  @type('string') public itemId: string = '';
  @type('string') public name: string = '';
  @type('number') public quantity: number = 1;
}

export class MinimalTestPlayer extends Schema {
  @type('string') public id: string = '';
  @type('string') public username: string = '';
  @type('number') public x: number = 0;
  @type('number') public y: number = 0;
  @type('number') public health: number = 100;
}

// Factory function to test creation
export function createTestPlayer(id: string, username: string): MinimalTestPlayer {
  const player = new MinimalTestPlayer();
  player.id = id;
  player.username = username;
  return player;
}

export function createTestItem(itemId: string, name: string): MinimalTestItem {
  const item = new MinimalTestItem();
  item.itemId = itemId;
  item.name = name;
  return item;
}
