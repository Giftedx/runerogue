import { EventEmitter } from "events";
import type { CombatEvent } from "./types";

/**
 * Enum of all game event types handled by the event bus.
 */
export enum GameEventType {
  Combat = "combat",
  // Add more event types as needed
}

/**
 * Union type for all event payloads handled by the event bus.
 */
export type GameEventPayload = CombatEvent; // Extend as needed

/**
 * Strongly-typed event emitter for game events.
 * Ensures type safety and robust error handling for all event publishing and consumption.
 */
export class GameEventEmitter extends EventEmitter {
  private static instance: GameEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(50); // Prevent memory leak warnings in large games
  }

  /**
   * Get the singleton instance of the GameEventEmitter.
   */
  public static getInstance(): GameEventEmitter {
    if (typeof GameEventEmitter.instance === "undefined") {
      GameEventEmitter.instance = new GameEventEmitter();
    }
    return GameEventEmitter.instance;
  }

  /**
   * Emit a game event with robust error handling.
   * @param type The event type
   * @param payload The event payload
   */
  public emitGameEvent(
    type: GameEventType,
    payload: GameEventPayload
  ): boolean {
    try {
      return this.emit(type, payload);
    } catch (error) {
      // Log and swallow errors to prevent crashing the game loop
      // Replace with production logger as needed
      console.error(`[GameEventEmitter] Error emitting event:`, error);
      return false;
    }
  }

  /**
   * Subscribe to a game event with type safety.
   * @param type The event type
   * @param listener The event handler
   */
  public onGameEvent(
    type: GameEventType,
    listener: (payload: GameEventPayload) => void
  ): void {
    this.on(type, (payload: GameEventPayload) => {
      try {
        listener(payload);
      } catch (error) {
        // Log and swallow errors to prevent crashing the game loop
        console.error(`[GameEventEmitter] Error in event listener:`, error);
      }
    });
  }
}

// Export a singleton instance for use throughout the server
export const gameEventEmitter = GameEventEmitter.getInstance();
