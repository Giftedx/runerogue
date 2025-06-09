/**
 * Debug test to check what's actually being exported from EntitySchemas
 */

describe('EntitySchemas Import Debug', () => {
  it('should show what is actually exported', () => {
    const exported = require('../../game/EntitySchemas');
    console.log('EntitySchemas exports:', Object.keys(exported));
    console.log('Player type:', typeof exported.Player);
    console.log('Player constructor:', exported.Player);
    console.log('GameState type:', typeof exported.GameState);
    console.log('InventoryItem type:', typeof exported.InventoryItem);

    // Try to access them via destructuring
    const { Player, GameState, InventoryItem } = exported;
    console.log('Destructured Player:', Player);
    console.log('Destructured GameState:', GameState);
    console.log('Destructured InventoryItem:', InventoryItem);

    // Try creating instances
    if (typeof Player === 'function') {
      try {
        const player = new Player();
        console.log('Player instance created successfully:', player);
      } catch (error) {
        console.error('Error creating Player:', error);
      }
    } else {
      console.error('Player is not a function, it is:', typeof Player);
    }
  });
});
