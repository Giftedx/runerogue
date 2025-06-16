/**
 * @file Basic test file for shared package
 * @description Ensures the package can be tested and imported properly
 */

import type { Vector2 } from "../types/game";

describe("Shared Package", () => {
  it("should be able to import shared types", () => {
    // Test that we can use the type (TypeScript compilation check)
    const position: Vector2 = { x: 10, y: 20 };
    expect(position.x).toBe(10);
    expect(position.y).toBe(20);
  });

  it("should pass basic test to verify Jest is working", () => {
    expect(true).toBe(true);
  });
});
