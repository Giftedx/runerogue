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

// Version info
export const SHARED_VERSION = "1.0.0";
