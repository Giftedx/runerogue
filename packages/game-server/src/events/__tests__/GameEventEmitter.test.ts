// Jest provides describe, it, expect, beforeEach, jest globally
import { GameEventEmitter, GameEventType } from "../GameEventEmitter";
import type { CombatEvent } from "../types";

// Helper to create a valid CombatEvent payload
const createCombatPayload = (): CombatEvent => ({
  attacker: 1,
  defender: 2,
  damage: 12,
  hit: true,
  timestamp: Date.now(),
});

describe("GameEventEmitter", () => {
  let emitter: GameEventEmitter;

  beforeEach(() => {
    emitter = GameEventEmitter.getInstance();
    emitter.removeAllListeners();
  });

  it("should emit and receive a combat event", (done) => {
    const payload = createCombatPayload();
    emitter.onGameEvent(GameEventType.Combat, (event) => {
      expect(event).toEqual(payload);
      done();
    });
    emitter.emitGameEvent(GameEventType.Combat, payload);
  });

  it("should handle errors in event listeners gracefully", () => {
    const payload = createCombatPayload();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    emitter.onGameEvent(GameEventType.Combat, () => {
      throw new Error("Listener error");
    });
    expect(() =>
      emitter.emitGameEvent(GameEventType.Combat, payload)
    ).not.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[GameEventEmitter] Error in event listener:"),
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });

  it("should handle errors during emitGameEvent gracefully", () => {
    // Patch emit to throw
    const emitSpy = jest.spyOn(emitter, "emit").mockImplementation(() => {
      throw new Error("Emit error");
    });
    const payload = createCombatPayload();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = emitter.emitGameEvent(GameEventType.Combat, payload);
    expect(result).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[GameEventEmitter] Error emitting event:"),
      expect.any(Error)
    );
    emitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("should be a singleton", () => {
    const emitter2 = GameEventEmitter.getInstance();
    expect(emitter).toBe(emitter2);
  });

  it("should set max listeners to 50", () => {
    expect(emitter.getMaxListeners()).toBe(50);
  });
});
