/**
 * @file Basic test file for shared package
 * @description Ensures the package can be tested and imported properly
 */
describe("Shared Package", () => {
    it("should be able to import the main module", async () => {
        const shared = await import("../index");
        expect(shared).toBeDefined();
    });
    it("should pass basic test to verify Jest is working", () => {
        expect(true).toBe(true);
    });
});
export {};
//# sourceMappingURL=basic.test.js.map