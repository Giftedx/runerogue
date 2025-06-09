// Test just the imports
import 'reflect-metadata';
console.log('reflect-metadata loaded');

import { Schema, type } from '@colyseus/schema';
console.log('Colyseus imports loaded');

export class SimpleTest extends Schema {
  @type('string') public name: string = 'test';
}

console.log('SimpleTest class defined');
