// Simple test to check if Jest is working
const sum = (a, b) => a + b;

describe("Minimal Test", () => {
  it("should add two numbers", () => {
    expect(sum(1, 2)).toBe(3);
  });
});
