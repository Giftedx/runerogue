import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: false }); // Not active by default
  }

  create() {
    console.log('UIScene create');
    // UI elements like HUD will be added here
    const healthText = this.add.text(10, 10, 'Health: 100', { fontSize: '16px', color: '#ffffff' });
  }
}
