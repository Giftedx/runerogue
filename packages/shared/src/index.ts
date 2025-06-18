/**
 * Shared Utilities Package - Main Entry Point
 * Common types, constants, and utilities for RuneRogue
 *
 * @package @runerogue/shared
 */

// Re-export all types for easy importing
export * from "./types/game";
export * from "./types/osrs";

// Re-export all schemas for client/server use
export * from "./schemas/GameRoomState";

// Export Result and GameError types for strict error handling
export * from "./result";

// Version info
export const SHARED_VERSION = "1.0.0";
