import React from "react";
import ReactDOM from "react-dom/client";
import Phaser from "phaser";
import App from "@/ui/App";
import { GameScene } from "@/scenes/GameScene";
import { DiscordActivityProvider } from "@/providers/DiscordActivityProvider";
import { GameRoomProvider } from "@/providers/GameRoomProvider";

import "@/index.css";

/**
 * Bootstraps the RuneRogue client:
 * - Mounts React App into #root
 * - Initializes Phaser game into #phaser-game
 */
function bootstrap(): void {
  // Render React UI with providers
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("React root element not found");
    return;
  }
  // Wrap App in DiscordActivityProvider
  ReactDOM.createRoot(rootElement).render(
    <DiscordActivityProvider>
      <GameRoomProvider>
        <App />
      </GameRoomProvider>
    </DiscordActivityProvider>
  );

  // Wait for React to render, then initialize Phaser
  setTimeout(() => {
    // Prepare Phaser configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: "phaser-container", // Use the container within the React app
      width: 800,
      height: 600,
      scene: [GameScene],
      physics: {
        default: "arcade",
        arcade: { debug: false },
      },
      backgroundColor: "#000000",
    };

    // Initialize Phaser game
    try {
      // eslint-disable-next-line no-new
      new Phaser.Game(config);
      console.log("Phaser game initialized successfully");
    } catch (error) {
      console.error("Phaser initialization error:", error);
    }
  }, 100); // Small delay to ensure React has rendered
}

bootstrap();
