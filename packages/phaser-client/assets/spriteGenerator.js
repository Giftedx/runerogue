/**
 * Simple Sprite Generator for RuneRogue
 * Creates basic colored sprites for development/testing
 */

class SpriteGenerator {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Generate a simple character sprite
   */
  generatePlayerSprite(className, size = 32) {
    this.canvas.width = size;
    this.canvas.height = size;

    // Clear canvas
    this.ctx.fillStyle = 'transparent';
    this.ctx.fillRect(0, 0, size, size);

    // Body color based on class
    const colors = {
      warrior: '#4A90E2',
      mage: '#9B59B6',
      ranger: '#27AE60',
    };

    const bodyColor = colors[className] || '#4A90E2';

    // Draw simple character
    // Head
    this.ctx.fillStyle = '#F4D1AE';
    this.ctx.fillRect(size * 0.3, size * 0.1, size * 0.4, size * 0.3);

    // Body
    this.ctx.fillStyle = bodyColor;
    this.ctx.fillRect(size * 0.25, size * 0.35, size * 0.5, size * 0.4);

    // Arms
    this.ctx.fillRect(size * 0.1, size * 0.4, size * 0.2, size * 0.25);
    this.ctx.fillRect(size * 0.7, size * 0.4, size * 0.2, size * 0.25);

    // Legs
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(size * 0.3, size * 0.7, size * 0.15, size * 0.25);
    this.ctx.fillRect(size * 0.55, size * 0.7, size * 0.15, size * 0.25);

    return this.canvas.toDataURL();
  }

  /**
   * Generate a simple enemy sprite
   */
  generateEnemySprite(enemyType, size = 32) {
    this.canvas.width = size;
    this.canvas.height = size;

    // Clear canvas
    this.ctx.fillStyle = 'transparent';
    this.ctx.fillRect(0, 0, size, size);

    const colors = {
      goblin: '#8FBC8F',
      skeleton: '#F5F5DC',
      orc: '#556B2F',
    };

    const bodyColor = colors[enemyType] || '#8FBC8F';

    // Draw simple enemy
    // Head
    this.ctx.fillStyle = bodyColor;
    this.ctx.fillRect(size * 0.3, size * 0.1, size * 0.4, size * 0.3);

    // Body
    this.ctx.fillRect(size * 0.25, size * 0.35, size * 0.5, size * 0.4);

    // Arms
    this.ctx.fillRect(size * 0.1, size * 0.4, size * 0.2, size * 0.25);
    this.ctx.fillRect(size * 0.7, size * 0.4, size * 0.2, size * 0.25);

    // Legs
    this.ctx.fillRect(size * 0.3, size * 0.7, size * 0.15, size * 0.25);
    this.ctx.fillRect(size * 0.55, size * 0.7, size * 0.15, size * 0.25);

    // Eyes (red for enemies)
    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(size * 0.35, size * 0.2, size * 0.08, size * 0.08);
    this.ctx.fillRect(size * 0.57, size * 0.2, size * 0.08, size * 0.08);

    return this.canvas.toDataURL();
  }

  /**
   * Generate UI elements
   */
  generateUISprite(type, width = 32, height = 32) {
    this.canvas.width = width;
    this.canvas.height = height;

    this.ctx.fillStyle = 'transparent';
    this.ctx.fillRect(0, 0, width, height);

    switch (type) {
      case 'healthBarBg':
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, 0, width, height);
        break;

      case 'healthBarFill':
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(0, 0, width, height);
        break;

      case 'button':
        this.ctx.fillStyle = '#4A4A4A';
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.strokeStyle = '#888888';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, width, height);
        break;
    }

    return this.canvas.toDataURL();
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpriteGenerator;
} else {
  window.SpriteGenerator = SpriteGenerator;
}
