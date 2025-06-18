/**
 * @file Skills panel component for the game UI.
 * @author Your Name
 */

import React from "react";
import { useGameStore } from "@/stores/gameStore";

/**
 * @function SkillsPanel
 * @description A component that displays the player's skills.
 * @returns {JSX.Element} The skills panel component.
 */
export const SkillsPanel: React.FC = () => {
  const { skills } = useGameStore();

  return (
    <div className="p-2 bg-gray-800 rounded">
      <h3 className="text-lg font-bold mb-2">Skills</h3>
      <ul>
        {Object.entries(skills).map(([skill, data]) => (
          <li key={skill} className="flex justify-between capitalize">
            <span>{skill}</span>
            <span>{data.level}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
