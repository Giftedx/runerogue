import React from "react";
import "./App.css";

/**
 * The main React component for the RuneRogue application.
 *
 * This component serves as the root of the React UI, rendering the game container
 * where the Phaser canvas will be mounted, along with any other UI elements
 * like HUDs, menus, or overlays.
 *
 * @returns {React.ReactElement} The rendered App component.
 */
const App: React.FC = () => {
  return (
    <div id="app-container" className="app-container">
      <div id="game-container" className="game-container" />
      {/* Future UI elements like HUD, menus, etc., will go here */}
    </div>
  );
};

export default App;
