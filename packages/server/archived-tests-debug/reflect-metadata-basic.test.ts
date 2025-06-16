import 'reflect-metadata';

/**
 * Test to verify reflect-metadata is working in Jest environment
 */

// Simple decorator that adds metadata
function testDecorator(value: string) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata('test:value', value, target, propertyKey);
  };
}

class TestClass {
  @testDecorator('hello')
  testProperty: string = 'default';
}

describe('Reflect Metadata Basic Test', () => {
  it('should have reflect-metadata working', () => {
    const instance = new TestClass();

    // Test if Reflect is available
    expect(typeof Reflect).toBe('object');
    expect(typeof Reflect.defineMetadata).toBe('function');
    expect(typeof Reflect.getMetadata).toBe('function');

    // Test if our custom metadata is available
    const metadata = Reflect.getMetadata('test:value', instance, 'testProperty');
    console.log('Custom metadata:', metadata);
    expect(metadata).toBe('hello');
  });

  it('should have Symbol.metadata available', () => {
    // Check if Symbol.metadata exists
    console.log('Symbol.metadata:', Symbol.metadata);
    console.log('Type of Symbol.metadata:', typeof Symbol.metadata);

    // This is what Colyseus might be looking for
    expect(Symbol.metadata).toBeDefined();
  });

  it('should show what metadata exists on TestClass', () => {
    const instance = new TestClass();
    const prototype = Object.getPrototypeOf(instance);

    console.log('All symbols on prototype:', Object.getOwnPropertySymbols(prototype));
    console.log('All metadata keys:', Reflect.getMetadataKeys(prototype, 'testProperty'));

    // Check for any Symbol.metadata related metadata
    const metadataSymbol = Symbol.for('Symbol.metadata') || (Symbol as any).metadata;
    if (metadataSymbol) {
      const symbolMetadata = Reflect.getMetadata(metadataSymbol, prototype, 'testProperty');
      console.log('Symbol.metadata content:', symbolMetadata);
    }
  });
});
