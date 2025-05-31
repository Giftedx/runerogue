// Define the MainGameScene
class MainGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainGameScene' });
        this.player = null;
        this.cursors = null; // To hold keyboard input listeners
        this.playerSpeed = 200; // Pixels per second
    }

    preload() {
        this.cameras.main.setBackgroundColor('#24252A');
        console.log('MainGameScene: preload');
    }

    create() {
        console.log('MainGameScene: create');

        const playerWidth = 32;
        const playerHeight = 48;
        const playerColor = 0x00ff00;

        this.player = this.physics.add.sprite(this.cameras.main.width / 2, this.cameras.main.height / 2, null);
        let graphics = this.add.graphics();
        graphics.fillStyle(playerColor, 1);
        graphics.fillRect(-playerWidth / 2, -playerHeight / 2, playerWidth, playerHeight);
        graphics.generateTexture('playerPlaceholder', playerWidth, playerHeight);
        graphics.destroy();

        this.player.setTexture('playerPlaceholder');
        this.player.setOrigin(0.5, 0.5);
        this.player.setCollideWorldBounds(true); // Keep player within game boundaries

        this.add.text(400, 50, 'Use WASD to Move', { fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5);

        // Setup keyboard input for WASD
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        console.log('MainGameScene: create finished, player and cursors initialized');
    }

    update() {
        if (!this.player || !this.cursors) {
            // console.log('Player or cursors not initialized yet in update');
            return; // Do nothing if player or cursors aren't set up
        }

        this.player.setVelocity(0); // Reset velocity each frame

        let moveUp = this.cursors.up.isDown;
        let moveDown = this.cursors.down.isDown;
        let moveLeft = this.cursors.left.isDown;
        let moveRight = this.cursors.right.isDown;

        let velocityX = 0;
        let velocityY = 0;

        if (moveLeft) {
            velocityX = -this.playerSpeed;
        } else if (moveRight) {
            velocityX = this.playerSpeed;
        }

        if (moveUp) {
            velocityY = -this.playerSpeed;
        } else if (moveDown) {
            velocityY = this.playerSpeed;
        }

        this.player.setVelocityX(velocityX);
        this.player.setVelocityY(velocityY);

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            this.player.body.velocity.normalize().scale(this.playerSpeed);
        }
    }
}

// Basic Phaser Game Configuration (remains the same)
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // Set to true for physics debugging if needed
        }
    },
    scene: [MainGameScene]
};

// Initialize the Phaser Game (remains the same)
const game = new Phaser.Game(config);
