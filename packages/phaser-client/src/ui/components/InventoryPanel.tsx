/**
 * @file Inventory panel component for the game UI.
 * @author Your Name
 */

import React from "react";
import { useGameStore } from "@/stores/gameStore";

/**
 * @function InventoryPanel
 * @description A component that displays the player's inventory.
 * @returns {JSX.Element} The inventory panel component.
 */
export const InventoryPanel: React.FC = () => {
  const { inventory } = useGameStore();

  return (
    <div className="p-2 bg-gray-800 rounded">
      <h3 className="text-lg font-bold mb-2">Inventory</h3>
      <div className="grid grid-cols-4 gap-2">
        {inventory.map((item) => (
          <div key={item.id} className="bg-gray-700 p-2 rounded text-center">
            {item.name}
          </div>
        ))}
        {/* Fill empty slots */}
        {Array.from({ length: 28 - inventory.length }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-gray-700 p-2 rounded" />
        ))}
      </div>
    </div>
  );
};
