/**
 * Test Colyseus v0.16.x API compatibility
 */
import { Server as ColyseusServer } from '@colyseus/core';

// Test what API is available in v0.16.x
const server = new ColyseusServer({
  // Check if transport is a valid option
});

// Check available properties
console.log('Server properties:', Object.getOwnPropertyNames(server));
console.log('Server prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(server)));

// Test methods that should exist
console.log('define method exists:', typeof server.define);
console.log('listen method exists:', typeof server.listen);
console.log('shutdown method exists:', typeof server.shutdown);
console.log('presence property exists:', 'presence' in server);

export {};
