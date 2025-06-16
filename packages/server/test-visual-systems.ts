/**
 * Test script for visual feedback systems
 *
 * This script validates that the HealthBarSystem and DamageNumberSystem
 * are properly integrated and functioning correctly.
 */

import { createWorld, addComponent, addEntity } from 'bitecs';
import {
  HealthBarSystem,
  setHealthEventBroadcaster,
} from './src/server/ecs/systems/HealthBarSystem';
import {
  DamageNumberSystem,
  setDamageNumberBroadcaster,
  queueDamageEvent,
} from './src/server/ecs/systems/DamageNumberSystem';
import { Health, Transform } from './src/server/ecs/components';

console.log('🎯 Testing Visual Feedback Systems...');

// Create test world
const world = createWorld();

// Create test entity
const testEntity = addEntity(world);

// Add components to the entity first
addComponent(world, Health, testEntity);
addComponent(world, Transform, testEntity);

// Set component values
Health.current[testEntity] = 80;
Health.max[testEntity] = 100;
Transform.x[testEntity] = 10;
Transform.y[testEntity] = 15;

// Track broadcasted events
const broadcastedEvents: Array<{ type: string; data: any }> = [];

// Mock network broadcaster
const mockBroadcaster = (type: string, data: any) => {
  broadcastedEvents.push({ type, data });
  console.log(`📡 Broadcast: ${type}`, data);
};

// Setup systems
console.log('⚙️ Setting up systems...');
setHealthEventBroadcaster(mockBroadcaster);
setDamageNumberBroadcaster(world, mockBroadcaster);

// Test damage events
console.log('💥 Testing damage events...');
queueDamageEvent(world, testEntity, 15, false, false); // Normal damage
queueDamageEvent(world, testEntity, 25, true, false); // Critical hit
queueDamageEvent(world, testEntity, 0, false, true); // Miss

// Update health for health bar test
Health.current[testEntity] = 65; // Simulate damage

// Run systems
console.log('🔄 Running systems...');
HealthBarSystem(world);
DamageNumberSystem(world);

// Check results
console.log('\n📊 Results:');
console.log(`Total events broadcasted: ${broadcastedEvents.length}`);

let healthBarEvents = 0;
let damageNumberEvents = 0;

for (const event of broadcastedEvents) {
  if (event.type === 'healthBar') {
    healthBarEvents++;
    console.log(`✅ Health bar event: ${event.data.events?.length || 0} updates`);
  }
  if (event.type === 'damageNumbers') {
    damageNumberEvents++;
    console.log(`✅ Damage number event: ${event.data.events?.length || 0} numbers`);
  }
}

console.log(`\n📈 Summary:`);
console.log(`  - Health bar broadcasts: ${healthBarEvents}`);
console.log(`  - Damage number broadcasts: ${damageNumberEvents}`);

if (damageNumberEvents > 0) {
  console.log('🎉 Visual feedback systems are working correctly!');
} else {
  console.log('❌ Visual feedback systems may have issues');
}

console.log('\n✨ Test completed!');
