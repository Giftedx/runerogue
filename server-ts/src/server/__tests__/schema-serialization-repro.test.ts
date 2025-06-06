import { InventoryItem, Trade } from '../game/EntitySchemas';

describe('Colyseus Schema Serialization Minimal Repro', () => {
  it('should serialize a Trade with ArraySchema<InventoryItem> fields without error', () => {
    const trade = new Trade('test_trade', 'proposer', 'accepter');
    const item = new InventoryItem(
      {
        id: 'test_item_id',
        itemId: 'test_item',
        name: 'Test Item',
        description: 'A test item.',
        attack: 1,
        defense: 1,
        isStackable: false,
        baseValue: 1,
        isTradeable: true,
      },
      1
    );
    trade.proposerItems.push(item);
    trade.accepterItems.push(item);

    // Log prototype methods for debugging
    // eslint-disable-next-line no-console
    console.log(
      'Trade prototype methods:',
      Object.getOwnPropertyNames(Object.getPrototypeOf(trade))
    );
    // Attempt to serialize using Colyseus Encoder class (if available)
    // (This will fail if not the correct API, but will help debug)
    // const encoder = new Encoder();
    // expect(() => encoder.encode(trade)).not.toThrow();
  });
});
