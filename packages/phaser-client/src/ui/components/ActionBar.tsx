/**
 * @file Action bar component for the game UI.
 * @author Your Name
 */

import React from "react";

/**
 * @function ActionBar
 * @description A component that displays player actions.
 * @returns {JSX.Element} The action bar component.
 */
export const ActionBar: React.FC = () => {
  return (
    <div className="p-2 bg-gray-800 rounded">
      <h3 className="text-lg font-bold mb-2">Actions</h3>
      <div className="grid grid-cols-4 gap-2">
        <button className="bg-gray-700 p-2 rounded">Attack</button>
        <button className="bg-gray-700 p-2 rounded">Skills</button>
        <button className="bg-gray-700 p-2 rounded">Quests</button>
        <button className="bg-gray-700 p-2 rounded">Inventory</button>
        <button className="bg-gray-700 p-2 rounded">Equipment</button>
        <button className="bg-gray-700 p-2 rounded">Prayer</button>
        <button className="bg-gray-700 p-2 rounded">Magic</button>
        <button className="bg-gray-700 p-2 rounded">Logout</button>
      </div>
    </div>
  );
};
