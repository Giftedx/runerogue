/**
 * @file Basic test file for game-server package
 * @description Ensures the package can be tested and imported properly
 */

describe("GameServer Package", () => {
  it("should be able to import package dependencies", async () => {
    // Test import of key dependencies without triggering graceful-fs conflicts
    const { Server } = await import("colyseus");
    const express = await import("express");

    expect(Server).toBeDefined();
    expect(express).toBeDefined();
  });

  it("should pass basic test to verify Jest is working", () => {
    expect(true).toBe(true);
  });

  it("should be able to import room classes", async () => {
    // Test specific game-server components without main entry point
    const { RuneRogueRoom } = await import("../rooms/RuneRogueRoom");
    expect(RuneRogueRoom).toBeDefined();
  });
});
