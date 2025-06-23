import "reflect-metadata";

/**
 * Shared Utilities Package - Main Entry Point
 * Common types, constants, and utilities for RuneRogue
 *
 * @package @runerogue/shared
 */

// Force immediate import and initialization of schemas
import "./schemas";

// Re-export all types for easy importing
export * from "./types/common";
export * from "./types/game";
export * from "./types/osrs";
export * from "./types/entities";
export * from "./types/waves";

// Re-export all schemas for client/server use
export * from "./schemas";

// Export Result and GameError types for strict error handling
export * from "./result";

// Export constants
export * from "./constants";

// Version info
export const SHARED_VERSION = "1.0.0";
