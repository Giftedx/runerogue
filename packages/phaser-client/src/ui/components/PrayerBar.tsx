/**
 * @file Prayer bar component for the game UI.
 * @author Your Name
 */

import React from "react";
import { useGameStore } from "@/stores/gameStore";

/**
 * @function PrayerBar
 * @description A component that displays the player's prayer points as a progress bar.
 * @returns {JSX.Element} The prayer bar component.
 */
export const PrayerBar: React.FC = () => {
  const { prayer, maxPrayer } = useGameStore();

  const prayerPercentage = (prayer / maxPrayer) * 100;

  return (
    <div className="w-full bg-gray-700 rounded-full h-4 relative">
      <div
        className="bg-blue-500 h-4 rounded-full"
        style={{ width: `${prayerPercentage}%` }}
      ></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-white font-bold">
          {prayer} / {maxPrayer}
        </span>
      </div>
    </div>
  );
};
