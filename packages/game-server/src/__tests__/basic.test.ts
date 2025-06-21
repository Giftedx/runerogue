import { Server } from "colyseus";
import express from "express";
import { RuneRogueRoom } from "../rooms/RuneRogueRoom";

/**
 * @file Basic test file for game-server package
 * @description Ensures the package can be tested and imported properly
 */

describe("GameServer Package", () => {
  it("should be able to import package dependencies", () => {
    expect(Server).toBeDefined();
    expect(express).toBeDefined();
  });

  it("should pass basic test to verify Jest is working", () => {
    expect(true).toBe(true);
  });

  it("should be able to import room classes", () => {
    expect(RuneRogueRoom).toBeDefined();
  });
});
