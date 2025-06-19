import Phaser from "phaser";
import { BootScene } from "./scenes/Boot";
import { PreloadScene } from "./scenes/Preload";
import { MainMenuScene } from "./scenes/MainMenu";
import { GameScene } from "./scenes/Game";
import { UIScene } from "./scenes/UI";
import "./style.css"; // Default Vite CSS

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // AUTO will attempt WebGL, then Canvas
  width: 800,
  height: 600,
  parent: "app", // Matches the div id in index.html
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false, // Set to true for debugging physics bodies
    },
  },
  scene: [BootScene, PreloadScene, MainMenuScene, GameScene, UIScene],
  render: {
    pixelArt: true, // For OSRS style
    roundPixels: true, // For OSRS style
  },
};

const game = new Phaser.Game(config);

console.log("Phaser game initialized", game);
