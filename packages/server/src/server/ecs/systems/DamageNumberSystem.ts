/**
 * DamageNumberSystem - ECS system for managing damage number visual effects
 */

/**
 * Interface for damage number events that get broadcast to clients
 */
export interface DamageNumberEvent {
  entityId: string;
  damage: number;
  damageType: 'damage' | 'heal' | 'miss' | 'critical';
  position: { x: number; y: number };
  timestamp: number;
}

/**
 * DamageNumberSystem - Manages damage number visual feedback
 */
export class DamageNumberSystemClass {
  private damageNumbers: Map<string, DamageNumberEvent[]> = new Map();
  private networkBroadcaster: ((type: string, data: Record<string, unknown>) => void) | null = null;

  constructor() {
    this.damageNumbers = new Map();
  }

  /**
   * Sets the network broadcaster function for sending damage number events to clients
   */
  setBroadcaster(broadcaster: (type: string, data: Record<string, unknown>) => void): void {
    this.networkBroadcaster = broadcaster;
  }

  /**
   * Queue a damage number event
   */
  queueDamageNumber(
    entityId: string,
    damage: number,
    damageType: 'damage' | 'heal' | 'miss' | 'critical',
    position: { x: number; y: number }
  ): void {
    const damageEvent: DamageNumberEvent = {
      entityId,
      damage,
      damageType,
      position,
      timestamp: Date.now(),
    };

    if (!this.damageNumbers.has(entityId)) {
      this.damageNumbers.set(entityId, []);
    }
    this.damageNumbers.get(entityId)!.push(damageEvent);

    // Broadcast immediately for responsive feedback
    if (this.networkBroadcaster) {
      this.networkBroadcaster('damageNumber', { damageNumber: damageEvent });
    }
  }

  /**
   * Update the damage number system
   */
  update(): void {
    // Clean up old damage numbers (older than 5 seconds)
    const cutoffTime = Date.now() - 5000;

    for (const [entityId, damageNumbers] of this.damageNumbers.entries()) {
      const filteredNumbers = damageNumbers.filter(dn => dn.timestamp >= cutoffTime);
      if (filteredNumbers.length === 0) {
        this.damageNumbers.delete(entityId);
      } else {
        this.damageNumbers.set(entityId, filteredNumbers);
      }
    }
  }

  /**
   * Clear all damage numbers
   */
  clear(): void {
    this.damageNumbers.clear();
  }
}

// Global damage number system instance
let globalDamageNumberSystem: DamageNumberSystemClass | null = null;

/**
 * ECS System function for DamageNumber management
 */
export function DamageNumberSystem(_world: unknown): void {
  if (!globalDamageNumberSystem) {
    globalDamageNumberSystem = new DamageNumberSystemClass();
  }

  // Update the damage number system
  globalDamageNumberSystem.update();
}

/**
 * Set the broadcaster for damage number events
 */
export function setDamageNumberBroadcaster(
  broadcaster: (type: string, data: Record<string, unknown>) => void
): void {
  if (!globalDamageNumberSystem) {
    globalDamageNumberSystem = new DamageNumberSystemClass();
  }
  globalDamageNumberSystem.setBroadcaster(broadcaster);
}

/**
 * Queue a damage event
 */
export function queueDamageEvent(
  entityId: string,
  damage: number,
  position: { x: number; y: number }
): void {
  if (!globalDamageNumberSystem) {
    globalDamageNumberSystem = new DamageNumberSystemClass();
  }
  globalDamageNumberSystem.queueDamageNumber(entityId, damage, 'damage', position);
}

/**
 * Queue a heal event
 */
export function queueHealEvent(
  entityId: string,
  heal: number,
  position: { x: number; y: number }
): void {
  if (!globalDamageNumberSystem) {
    globalDamageNumberSystem = new DamageNumberSystemClass();
  }
  globalDamageNumberSystem.queueDamageNumber(entityId, heal, 'heal', position);
}
