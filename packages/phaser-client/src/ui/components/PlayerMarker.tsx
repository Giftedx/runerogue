/**
 * @file Player marker component for the minimap.
 * @author Your Name
 */

import React from "react";
import clsx from "clsx";
import type { Player } from "@/types";

interface PlayerMarkerProps {
  player: Player;
  isCurrentPlayer: boolean;
}

/**
 * @function PlayerMarker
 * @description A component that displays a player's position on the minimap.
 * @returns {JSX.Element} The player marker component.
 */
export const PlayerMarker: React.FC<PlayerMarkerProps> = ({
  player,
  isCurrentPlayer,
}) => {
  const markerClasses = clsx(
    "absolute w-2 h-2 rounded-full transition-all duration-300 player-marker-position",
    {
      "bg-yellow-400 ring-2 ring-white": isCurrentPlayer,
      "bg-red-500": !isCurrentPlayer,
    }
  );

  const markerStyle = {
    "--player-x-pos": `${(player.x / 1000) * 100}%`,
    "--player-y-pos": `${(player.y / 1000) * 100}%`,
  } as React.CSSProperties;

  return <div className={markerClasses} style={markerStyle} />;
};
