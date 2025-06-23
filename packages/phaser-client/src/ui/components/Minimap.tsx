/**
 * @file Minimap component for the game UI.
 * @author Your Name
 */

import React from "react";
import { useGameRoom } from "@/providers/GameRoomProvider";
import { PlayerMarker } from "./PlayerMarker";

/**
 * @function Minimap
 * @description A component that displays a minimap of the game world.
 * @returns {JSX.Element} The minimap component.
 */
export const Minimap: React.FC = () => {
  const { state, currentPlayer } = useGameRoom();

  // Handle null state gracefully
  if (!state || !state.players) {
    return (
      <div className="relative p-2 bg-gray-800 rounded aspect-square">
        <h3 className="mb-2 text-lg font-bold">Minimap</h3>
        <div className="absolute flex items-center justify-center bg-gray-600 inset-4">
          <span className="text-sm text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-2 bg-gray-800 rounded aspect-square">
      <h3 className="mb-2 text-lg font-bold">Minimap</h3>
      {/* Placeholder for map background */}
      <div className="absolute bg-gray-600 inset-4">
        {Array.from(state.players.values()).map((p) => (
          <PlayerMarker
            key={p.id}
            player={p}
            isCurrentPlayer={p.id === currentPlayer?.id}
          />
        ))}
      </div>
    </div>
  );
};
