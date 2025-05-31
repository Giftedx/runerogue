import Phaser from 'phaser';
import { DiscordService } from '../services/DiscordService'; // Import the service

export class MainMenuScene extends Phaser.Scene {
  private discordService: DiscordService;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super('MainMenuScene');
    this.discordService = DiscordService.getInstance(); // Get the singleton instance
  }

  create() {
    console.log('MainMenuScene create');
    this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'logo');

    const startText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 100,
      'Click to Authenticate with Discord',
      { fontSize: '24px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
    );
    startText.setOrigin(0.5).setInteractive();

    this.statusText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 150,
      '', // Initially empty
      { fontSize: '18px', color: '#ffff00' }
    );
    this.statusText.setOrigin(0.5);

    startText.on('pointerdown', async () => {
      try {
        this.statusText.setText('Initializing Discord SDK...');
        await this.discordService.ready();
        this.statusText.setText('Discord SDK Ready. Authorizing...');

        const auth = await this.discordService.authorize();
        this.statusText.setText(`Authorized! Code: ${auth.code.substring(0,10)}...`);
        console.log('Authorization successful in MainMenuScene, code:', auth.code);

        // Next step: Send this code to your backend, then sign in with Firebase,
        // then authenticate Discord SDK instance, then proceed to GameScene.
        // For now, we'll just log it.
        // TODO: Implement backend call and Firebase auth.
        // this.scene.start('GameScene');
      } catch (error) {
        console.error('Discord authentication sequence failed:', error);
        this.statusText.setText('Discord Auth Failed. Check console.');
        // Handle specific errors if necessary, e.g., user closed modal
      }
    });
  }
}
