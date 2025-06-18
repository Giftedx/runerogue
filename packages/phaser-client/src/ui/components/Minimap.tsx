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

  return (
    <div className="p-2 bg-gray-800 rounded aspect-square relative">
      <h3 className="text-lg font-bold mb-2">Minimap</h3>
      {/* Placeholder for map background */}
      <div className="absolute inset-4 bg-gray-600">
        {Object.values(state.players).map((p) => (
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
