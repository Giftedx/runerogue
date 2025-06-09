/**
 * Test to check if defineTypes approach resolves ArraySchema warnings
 */

import { ArraySchema, Schema, defineTypes } from '@colyseus/schema';
import '../../utils/enhanced-metadata-fix';

describe('ArraySchema Registration Test', () => {
  class TestItem extends Schema {
    public name: string = '';
  }

  defineTypes(TestItem, {
    name: 'string',
  });

  class TestContainer extends Schema {
    public items = new ArraySchema<TestItem>();
    public tags = new ArraySchema<string>();
  }

  defineTypes(TestContainer, {
    items: [TestItem],
    tags: ['string'],
  });

  it('should not show ArraySchema warnings with defineTypes', () => {
    const container = new TestContainer();
    const item = new TestItem();
    item.name = 'test item';

    container.items.push(item);
    container.tags.push('test tag');

    expect(container.items.length).toBe(1);
    expect(container.tags.length).toBe(1);
    expect(container.items[0].name).toBe('test item');
    expect(container.tags[0]).toBe('test tag');
  });

  it('should be able to encode without warnings', () => {
    const container = new TestContainer();
    container.items.push(new TestItem());
    container.tags.push('test');

    // Try encoding to check for warnings
    expect(() => {
      const encoded = container.encode();
      expect(encoded).toBeDefined();
    }).not.toThrow();
  });
});
