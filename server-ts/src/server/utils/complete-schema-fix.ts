/**
 * Complete Schema Fix for RuneRogue
 * Fixes all Colyseus schema registration and serialization issues
 */

import 'reflect-metadata';

// Symbol.metadata polyfill
if (!Symbol.metadata) {
  (Symbol as any).metadata = Symbol('Symbol.metadata');
}

// Global schema registry
const SCHEMA_PROPERTIES = new Set<string>();

/**
 * Safe type decorator that prevents duplicate registrations
 */
export function safeType(typeOrOptions: any) {
  return function (target: any, propertyKey: string) {
    const className = target.constructor.name;
    const propertyId = `${className}.${propertyKey}`;

    if (SCHEMA_PROPERTIES.has(propertyId)) {
      return; // Skip duplicate registration
    }

    SCHEMA_PROPERTIES.add(propertyId);

    // Apply original @type decorator
    const { type } = require('@colyseus/schema');
    return type(typeOrOptions)(target, propertyKey);
  };
}

/**
 * Safe encoder creation
 */
export function createSafeEncoder(schemaInstance?: any) {
  const { Encoder } = require('@colyseus/schema');

  if (schemaInstance && !schemaInstance.constructor) {
    throw new Error('Schema instance missing constructor metadata');
  }

  return schemaInstance ? new Encoder(schemaInstance) : new Encoder();
}

/**
 * Clear registry for testing
 */
export function clearSchemaRegistry() {
  SCHEMA_PROPERTIES.clear();
}

export { SCHEMA_PROPERTIES };
