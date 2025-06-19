import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Game as PhaserGame } from "phaser";
import { BootScene } from "./game/scenes/BootScene";
import "./styles/main.css";

/**
 * Main entry point for the RuneRogue client application.
 *
 * This file is responsible for two main tasks:
 * 1. Rendering the main React application component (`App`) into the DOM.
 * 2. Initializing and configuring the Phaser 3 game instance.
 */

// Ensure the root element exists in index.html
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Fatal: Root element with id 'root' not found in the DOM.");
}

// Render the React application
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * Phaser Game Configuration.
 *
 * This configuration object defines the core settings for the Phaser game instance,
 * including rendering type, dimensions, physics, and the initial scene.
 *
 * @see https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // Automatically choose between WebGL or Canvas
  width: 1280,
  height: 720,
  parent: "game-container", // This should be a div inside the React app
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: process.env.NODE_ENV === "development",
    },
  },
  scene: [BootScene], // The initial scene to load
  backgroundColor: "#000000",
};

// Initialize the Phaser Game instance
const game = new PhaserGame(config);

export default game;
