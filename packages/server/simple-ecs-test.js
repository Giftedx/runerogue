/**
 * Simple JavaScript version of ECS Integration for testing
 * This avoids TypeScript compilation issues
 */

const { createWorld, hasComponent, removeComponent, addComponent } = require('bitecs');

// Mock ECS components for testing
const mockTransform = { x: {}, y: {}, z: {} };
const mockHealth = { current: {}, max: {} };
const mockSkills = {
  attack: {},
  defence: {},
  strength: {},
  hitpoints: {},
  ranged: {},
  magic: {},
  prayer: {},
};
const mockPlayer = {};

// Mock createPlayer function
function mockCreatePlayer(world, sessionId, x, y) {
  const eid = world.entityId++;
  return eid;
}

// Simple ECS Integration
class SimpleECSIntegration {
  constructor() {
    this.world = createWorld();
    this.entityMap = new Map();
    this.reverseEntityMap = new Map();
  }

  syncPlayerToECS(player) {
    console.log('🔄 Syncing player to ECS:', player.id);

    if (!player || !player.id) {
      throw new Error('Player must have an id property');
    }

    let entityId = this.entityMap.get(player.id);

    if (!entityId) {
      console.log('📝 Creating new ECS entity...');
      entityId = mockCreatePlayer(this.world, player.id, player.x || 0, player.y || 0);

      this.entityMap.set(player.id, entityId);
      this.reverseEntityMap.set(entityId, player.id);
      console.log('✅ Entity created with ID:', entityId);
    }

    // Mock component syncing
    console.log('🔄 Syncing position...');
    mockTransform.x[entityId] = player.x || 0;
    mockTransform.y[entityId] = player.y || 0;
    mockTransform.z[entityId] = 0;

    console.log('🔄 Syncing health...');
    mockHealth.current[entityId] = player.health || 100;
    mockHealth.max[entityId] = player.maxHealth || 100;

    console.log('🔄 Syncing skills...');
    if (player.skills) {
      mockSkills.attack[entityId] = player.skills.attack?.level || 1;
      mockSkills.defence[entityId] = player.skills.defence?.level || 1;
      mockSkills.strength[entityId] = player.skills.strength?.level || 1;
      mockSkills.hitpoints[entityId] = player.skills.hitpoints?.level || 10;
      mockSkills.ranged[entityId] = player.skills.ranged?.level || 1;
      mockSkills.magic[entityId] = player.skills.magic?.level || 1;
      mockSkills.prayer[entityId] = player.skills.prayer?.level || 1;
    }

    console.log('✅ Player synced successfully');
    return entityId;
  }

  update(deltaTime = 16.67) {
    console.log('🎮 Running ECS update loop...');
    // Mock system updates - just log
    console.log('  ⚔️ MovementSystem');
    console.log('  🗡️ CombatSystem');
    console.log('  🙏 PrayerSystem');
    console.log('  📈 SkillSystem');
    console.log('✅ ECS update completed');
  }

  getStats() {
    return {
      entityCount: this.entityMap.size,
      systemCount: 4,
      registeredComponents: ['Transform', 'Health', 'Skills', 'Player'],
    };
  }
}

module.exports = { SimpleECSIntegration };
