/**
 * @file colyseus.ts
 * @description Provides a singleton service to hold the Colyseus room instance.
 * This allows Phaser scenes to access the room object that is managed by the React context.
 * @author Your Name
 */

import { Room } from "colyseus.js";
import type { GameRoomState } from "@runerogue/shared";

/**
 * @class ColyseusService
 * @description A simple singleton to bridge the React and Phaser worlds.
 */
class ColyseusService {
  public room: Room<GameRoomState> | null = null;
}

export const colyseusService = new ColyseusService();
