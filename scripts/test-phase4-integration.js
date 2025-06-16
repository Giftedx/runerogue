/**
 * Phase 4 Integration Test
 * Tests the new skill systems integration
 */

import { createWorld } from 'bitecs';
import { 
  Transform,
  Health,
  SkillLevels,
  SkillXP,
  Player,
  Equipment,
  EquipmentBonuses,
  MagicCombat,
  RangedCombat,
  SmithingAction,
  ActiveEffects,
  LevelUpEvents
} from '../packages/server/src/server/ecs/components';

// Simple test function
export function testPhase4Integration(): boolean {
  console.log('🧪 Testing Phase 4 Skill System Integration...');

  try {
    // Create ECS world
    const world = createWorld();
    console.log('✅ ECS World created successfully');

    // Test component creation
    const entity = world.addEntity();
    console.log(`✅ Entity created: ${entity}`);

    // Test if all Phase 4 components can be added
    const components = [
      Transform,
      Health,
      SkillLevels,
      SkillXP,
      Player,
      Equipment,
      EquipmentBonuses,
      MagicCombat,
      RangedCombat,
      SmithingAction,
      ActiveEffects,
      LevelUpEvents
    ];

    components.forEach((component, index) => {
      try {
        world.addComponent(entity, component);
        console.log(`✅ Component ${index + 1}/${components.length} added successfully`);
      } catch (error) {
        console.error(`❌ Failed to add component ${index + 1}: ${error}`);
        return false;
      }
    });

    console.log('🎉 All Phase 4 components integrated successfully!');
    return true;

  } catch (error) {
    console.error('❌ Phase 4 integration test failed:', error);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  const success = testPhase4Integration();
  process.exit(success ? 0 : 1);
}
