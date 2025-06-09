import 'reflect-metadata';
import { InventoryItem } from '../server/game/EntitySchemas';

// Test if schema metadata is properly attached
const item = new InventoryItem();
console.log('Schema metadata test:', {
  constructor: item.constructor.name,
  metadataExists: typeof item.constructor[Symbol.for('Symbol.metadata')] !== 'undefined',
  prototype: Object.getPrototypeOf(item).constructor.name,
  schemaFields: Object.getOwnPropertyNames(item.constructor.prototype),
});
