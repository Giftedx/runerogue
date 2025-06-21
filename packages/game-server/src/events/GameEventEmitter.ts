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
 * Extend this type as new event types are added.
 */
export type GameEventPayload = CombatEvent; // Extend as needed

/**
 * Strongly-typed event emitter for game events.
 * Ensures type safety and robust error handling for all event publishing and consumption.
 * Implements the singleton pattern to provide a single event bus instance.
 *
 * @remarks
 * - All event listeners are wrapped in try/catch to prevent unhandled exceptions from crashing the game loop.
 * - Use {@link onGameEvent} and {@link emitGameEvent} for all event handling to guarantee type safety.
 * - Extend {@link GameEventType} and {@link GameEventPayload} as new event types are introduced.
 */
export class GameEventEmitter extends EventEmitter {
  private static instance: GameEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(50); // Prevent memory leak warnings in large games
  }

  /**
   * Get the singleton instance of the GameEventEmitter.
   * @returns {GameEventEmitter} The singleton event emitter instance.
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
   * @returns {boolean} True if the event had listeners, false otherwise or if an error occurred.
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

/**
 * Singleton instance of the GameEventEmitter for use throughout the server.
 * Prefer importing this instance over creating new emitters.
 */
export const gameEventEmitter = GameEventEmitter.getInstance();
