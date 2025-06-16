/**
 * Comprehensive metadata polyfill for Colyseus v0.16.x compatibility
 * This ensures that Symbol.metadata and related metadata systems work correctly
 */

// Ensure Symbol.metadata exists
if (typeof Symbol.metadata === 'undefined') {
  (Symbol as any).metadata = Symbol('Symbol.metadata');
}

// Store metadata on constructors to support Colyseus schema
const metadataStore = new WeakMap();

// Polyfill for metadata reflection if not available
if (typeof (global as any).Reflect === 'undefined') {
  (global as any).Reflect = {};
}

if (!Reflect.defineMetadata) {
  Reflect.defineMetadata = function (
    metadataKey: any,
    metadataValue: any,
    target: any,
    propertyKey?: string | symbol
  ) {
    const metadata = metadataStore.get(target) || {};
    if (propertyKey !== undefined) {
      if (!metadata[propertyKey]) metadata[propertyKey] = {};
      metadata[propertyKey][metadataKey] = metadataValue;
    } else {
      metadata[metadataKey] = metadataValue;
    }
    metadataStore.set(target, metadata);
  };
}

if (!Reflect.getMetadata) {
  Reflect.getMetadata = function (metadataKey: any, target: any, propertyKey?: string | symbol) {
    const metadata = metadataStore.get(target) || {};
    if (propertyKey !== undefined) {
      return metadata[propertyKey] && metadata[propertyKey][metadataKey];
    }
    return metadata[metadataKey];
  };
}

if (!Reflect.getOwnMetadata) {
  Reflect.getOwnMetadata = function (metadataKey: any, target: any, propertyKey?: string | symbol) {
    return Reflect.getMetadata(metadataKey, target, propertyKey);
  };
}

if (!Reflect.hasMetadata) {
  Reflect.hasMetadata = function (metadataKey: any, target: any, propertyKey?: string | symbol) {
    return Reflect.getMetadata(metadataKey, target, propertyKey) !== undefined;
  };
}

if (!Reflect.hasOwnMetadata) {
  Reflect.hasOwnMetadata = function (metadataKey: any, target: any, propertyKey?: string | symbol) {
    return Reflect.hasMetadata(metadataKey, target, propertyKey);
  };
}

if (!Reflect.getMetadataKeys) {
  Reflect.getMetadataKeys = function (target: any, propertyKey?: string | symbol) {
    const metadata = metadataStore.get(target) || {};
    if (propertyKey !== undefined) {
      const propMetadata = metadata[propertyKey] || {};
      return Object.keys(propMetadata);
    }
    return Object.keys(metadata);
  };
}

if (!Reflect.getOwnMetadataKeys) {
  Reflect.getOwnMetadataKeys = function (target: any, propertyKey?: string | symbol) {
    return Reflect.getMetadataKeys(target, propertyKey);
  };
}

// Ensure constructors have the metadata symbol
const originalDefineProperty = Object.defineProperty;
Object.defineProperty = function (target: any, key: PropertyKey, descriptor: PropertyDescriptor) {
  // Ensure metadata symbol exists on constructors
  if (typeof target === 'function' && !target.hasOwnProperty(Symbol.metadata)) {
    target[Symbol.metadata] = {};
  }
  return originalDefineProperty.call(this, target, key, descriptor);
};

// Export to global scope to ensure availability
(globalThis as any).Symbol = Symbol;
(globalThis as any).Reflect = Reflect;

console.log('✅ Comprehensive metadata polyfill loaded');
