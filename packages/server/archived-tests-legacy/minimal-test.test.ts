/**
 * Minimal test to isolate FinalSchemas.ts issues
 */
import 'reflect-metadata';

describe('Minimal Schema Test', () => {
  it('should import FinalSchemas without errors', () => {
    expect(() => {
      // Just try to import the module
      require('../game/FinalSchemas');
    }).not.toThrow();
  });

  it('should create a basic schema without errors', () => {
    // Import after reflect-metadata is loaded
    const { Skill } = require('../game/FinalSchemas');

    expect(() => {
      const skill = new Skill();
      skill.level = 50;
      skill.experience = 10000;
    }).not.toThrow();
  });
});
