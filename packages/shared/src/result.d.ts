/**
 * Result and GameError types for strict error handling (OSRS-authentic)
 * @see https://github.com/aggis/runerogue
 */
/**
 * Result<T, E> - Discriminated union for success/failure results
 * @template T - Success type
 * @template E - Error type (default: GameError)
 */
export type Result<T, E = GameError> = {
    success: true;
    value: T;
} | {
    success: false;
    error: E;
};
/**
 * GameError - Standardized error type for game logic
 */
export type GameError = {
    type: "INVALID_INPUT";
    message: string;
} | {
    type: "CALCULATION_ERROR";
    message: string;
} | {
    type: "NETWORK_ERROR";
    message: string;
} | {
    type: string;
    message: string;
};
//# sourceMappingURL=result.d.ts.map