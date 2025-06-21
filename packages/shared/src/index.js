"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHARED_VERSION = void 0;
require("reflect-metadata");
/**
 * Shared Utilities Package - Main Entry Point
 * Common types, constants, and utilities for RuneRogue
 *
 * @package @runerogue/shared
 */
// Re-export all types for easy importing
__exportStar(require("./types/game"), exports);
__exportStar(require("./types/osrs"), exports);
// Re-export all schemas for client/server use
__exportStar(require("./schemas/GameRoomState"), exports);
// Export Result and GameError types for strict error handling
__exportStar(require("./result"), exports);
// Export constants
__exportStar(require("./constants"), exports);
// Version info
exports.SHARED_VERSION = "1.0.0";
//# sourceMappingURL=index.js.map