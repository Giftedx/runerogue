/**
 * Test for the minimal schema
 */
import 'reflect-metadata';

describe('Minimal Fresh Schema Test', () => {
  it('should import MinimalFreshSchemas without errors', () => {
    expect(() => {
      require('../game/MinimalFreshSchemas');
    }).not.toThrow();
  });

  it('should create schemas without conflicts', () => {
    const { SkillBasic, SkillsBasic, PlayerBasic } = require('../game/MinimalFreshSchemas');

    expect(() => {
      const skill = new SkillBasic();
      skill.level = 50;
      skill.xp = 10000;

      const skills = new SkillsBasic();
      skills.attack.level = 60;
      skills.strength.level = 70;

      const player = new PlayerBasic();
      player.name = 'Test Player';
      player.skills = skills;
    }).not.toThrow();
  });
});
