/**
 * @file Health bar component for the game UI.
 * @author Your Name
 */

import React from "react";
import { useGameStore } from "@/stores/gameStore";

/**
 * @function HealthBar
 * @description A component that displays the player's health as a progress bar.
 * @returns {JSX.Element} The health bar component.
 */
export const HealthBar: React.FC = () => {
  const { health, maxHealth } = useGameStore();

  const healthPercentage = (health / maxHealth) * 100;

  return (
    <div className="w-full bg-gray-700 rounded-full h-4 relative">
      <div
        className="bg-red-500 h-4 rounded-full"
        style={{ width: `${healthPercentage}%` }}
      ></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-white font-bold">
          {health} / {maxHealth}
        </span>
      </div>
    </div>
  );
};
