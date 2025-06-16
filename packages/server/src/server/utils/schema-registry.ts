/**
 * Global Schema Registry for Safe Colyseus Schema Management
 *
 * This module provides a process-level singleton to prevent duplicate
 * Colyseus schema registration across Jest test runs and module imports.
 */

import { Schema, type } from '@colyseus/schema';

// Global registry to track registered schema classes
const GLOBAL_SCHEMA_REGISTRY = new Set<string>();

// Cache for schema constructors to avoid re-registration
const SCHEMA_CONSTRUCTOR_CACHE = new Map<string, typeof Schema>();

/**
 * Checks if a schema class has already been registered
 */
export function isSchemaRegistered(className: string): boolean {
  return GLOBAL_SCHEMA_REGISTRY.has(className);
}

/**
 * Marks a schema class as registered
 */
export function markSchemaRegistered(className: string): void {
  GLOBAL_SCHEMA_REGISTRY.add(className);
}

/**
 * Gets a cached schema constructor or returns undefined
 */
export function getCachedSchemaConstructor(className: string): typeof Schema | undefined {
  return SCHEMA_CONSTRUCTOR_CACHE.get(className);
}

/**
 * Caches a schema constructor
 */
export function cacheSchemaConstructor(className: string, constructor: typeof Schema): void {
  SCHEMA_CONSTRUCTOR_CACHE.set(className, constructor);
}

/**
 * Safe decorator that prevents duplicate registration
 */
export function safeType(typeDefinition: any) {
  return function (target: any, propertyKey: string) {
    const className = target.constructor.name;
    const propertyIdentifier = `${className}.${propertyKey}`;

    // Check if this property has already been registered
    if (!GLOBAL_SCHEMA_REGISTRY.has(propertyIdentifier)) {
      // Mark as registered before applying decorator
      GLOBAL_SCHEMA_REGISTRY.add(propertyIdentifier);
      // Apply the original @type decorator
      return type(typeDefinition)(target, propertyKey);
    }
    // Skip registration if already done
    return;
  };
}

/**
 * Schema factory that ensures safe creation of schema classes
 */
export function createSafeSchemaClass<T extends Schema>(
  className: string,
  baseClass: typeof Schema,
  definitionFn: () => typeof Schema
): typeof Schema {
  // Check if we already have a cached constructor
  const cached = getCachedSchemaConstructor(className);
  if (cached) {
    return cached;
  }

  // Check if the schema class has been registered
  if (isSchemaRegistered(className)) {
    // Return the base class if already registered to avoid duplicate registration
    const existing = class extends baseClass {};
    Object.defineProperty(existing, 'name', { value: className });
    cacheSchemaConstructor(className, existing);
    return existing;
  }

  // Mark as registered and create new class
  markSchemaRegistered(className);
  const schemaClass = definitionFn();
  cacheSchemaConstructor(className, schemaClass);
  return schemaClass;
}

/**
 * Resets the global registry (useful for testing)
 */
export function resetSchemaRegistry(): void {
  GLOBAL_SCHEMA_REGISTRY.clear();
  SCHEMA_CONSTRUCTOR_CACHE.clear();
}

/**
 * Gets registry stats for debugging
 */
export function getRegistryStats(): { registered: string[]; cached: string[] } {
  return {
    registered: Array.from(GLOBAL_SCHEMA_REGISTRY),
    cached: Array.from(SCHEMA_CONSTRUCTOR_CACHE.keys()),
  };
}
