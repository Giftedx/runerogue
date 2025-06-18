/**
 * @file Equipment panel component for the game UI.
 * @author Your Name
 */

import React from "react";
import { useGameStore } from "@/stores/gameStore";

/**
 * @function EquipmentPanel
 * @description A component that displays the player's equipped items.
 * @returns {JSX.Element} The equipment panel component.
 */
export const EquipmentPanel: React.FC = () => {
  const { equipment } = useGameStore();

  const slots = [
    "head",
    "cape",
    "amulet",
    "weapon",
    "body",
    "shield",
    "legs",
    "hands",
    "feet",
    "ring",
    "ammo",
  ];

  return (
    <div className="p-2 bg-gray-800 rounded">
      <h3 className="text-lg font-bold mb-2">Equipment</h3>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <div
            key={slot}
            className="bg-gray-700 p-2 rounded text-center capitalize"
          >
            {equipment[slot]?.name || slot}
          </div>
        ))}
      </div>
    </div>
  );
};
