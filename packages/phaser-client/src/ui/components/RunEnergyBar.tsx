/**
 * @file Run energy bar component for the game UI.
 * @author Your Name
 */

import React from "react";
import { useGameStore } from "@/stores/gameStore";

/**
 * @function RunEnergyBar
 * @description A component that displays the player's run energy as a progress bar.
 * @returns {JSX.Element} The run energy bar component.
 */
export const RunEnergyBar: React.FC = () => {
  const { runEnergy } = useGameStore();

  const energyPercentage = runEnergy; // Assuming runEnergy is 0-100

  return (
    <div className="w-full bg-gray-700 rounded-full h-4 relative">
      <div
        className="bg-yellow-500 h-4 rounded-full"
        style={{ width: `${energyPercentage}%` }}
      ></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-white font-bold">{runEnergy} / 100</span>
      </div>
    </div>
  );
};
