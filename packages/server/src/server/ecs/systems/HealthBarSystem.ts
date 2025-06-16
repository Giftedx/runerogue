/**
 * HealthBarSystem - ECS system for managing health bar visual effects
 */

/**
 * Interface for health bar events that get broadcast to clients
 */
export interface HealthBarEvent {
  entityId: string;
  currentHealth: number;
  maxHealth: number;
  position: { x: number; y: number };
  visible: boolean;
  timestamp: number;
}

/**
 * HealthBarSystem - Manages health bar visual feedback
 */
export class HealthBarSystemClass {
  private healthBars: Map<string, HealthBarEvent> = new Map();
  private networkBroadcaster: ((type: string, data: Record<string, unknown>) => void) | null = null;

  constructor() {
    this.healthBars = new Map();
  }

  /**
   * Sets the network broadcaster function for sending health bar events to clients
   */
  setBroadcaster(broadcaster: (type: string, data: Record<string, unknown>) => void): void {
    this.networkBroadcaster = broadcaster;
  }

  /**
   * Update health bar for an entity
   */
  updateHealthBar(
    entityId: string,
    currentHealth: number,
    maxHealth: number,
    position: { x: number; y: number },
    visible: boolean = true
  ): void {
    const healthBarEvent: HealthBarEvent = {
      entityId,
      currentHealth,
      maxHealth,
      position,
      visible,
      timestamp: Date.now(),
    };

    this.healthBars.set(entityId, healthBarEvent);

    // Broadcast immediately for responsive feedback
    if (this.networkBroadcaster) {
      this.networkBroadcaster('healthBarUpdate', { healthBar: healthBarEvent });
    }
  }

  /**
   * Hide health bar for an entity
   */
  hideHealthBar(entityId: string): void {
    const existingHealthBar = this.healthBars.get(entityId);
    if (existingHealthBar) {
      existingHealthBar.visible = false;
      existingHealthBar.timestamp = Date.now();

      if (this.networkBroadcaster) {
        this.networkBroadcaster('healthBarUpdate', { healthBar: existingHealthBar });
      }
    }
  }

  /**
   * Remove health bar for an entity
   */
  removeHealthBar(entityId: string): void {
    this.healthBars.delete(entityId);

    if (this.networkBroadcaster) {
      this.networkBroadcaster('healthBarRemove', { entityId });
    }
  }

  /**
   * Get health bar for an entity
   */
  getHealthBar(entityId: string): HealthBarEvent | undefined {
    return this.healthBars.get(entityId);
  }

  /**
   * Get all health bars
   */
  getAllHealthBars(): HealthBarEvent[] {
    return Array.from(this.healthBars.values());
  }

  /**
   * Update the health bar system
   */
  update(): void {
    // Clean up old health bars (older than 30 seconds)
    const cutoffTime = Date.now() - 30000;

    for (const [entityId, healthBar] of this.healthBars.entries()) {
      if (healthBar.timestamp < cutoffTime) {
        this.healthBars.delete(entityId);
      }
    }
  }

  /**
   * Clear all health bars
   */
  clear(): void {
    this.healthBars.clear();
  }
}

// Global health bar system instance
let globalHealthBarSystem: HealthBarSystemClass | null = null;

/**
 * ECS System function for HealthBar management
 */
export function HealthBarSystem(_world: unknown): void {
  if (!globalHealthBarSystem) {
    globalHealthBarSystem = new HealthBarSystemClass();
  }

  // Update the health bar system
  globalHealthBarSystem.update();
}

/**
 * Set the broadcaster for health bar events
 */
export function setHealthEventBroadcaster(
  broadcaster: (type: string, data: Record<string, unknown>) => void
): void {
  if (!globalHealthBarSystem) {
    globalHealthBarSystem = new HealthBarSystemClass();
  }
  globalHealthBarSystem.setBroadcaster(broadcaster);
}

/**
 * Get the global health bar system instance
 */
export function getHealthBarSystem(): HealthBarSystemClass {
  if (!globalHealthBarSystem) {
    globalHealthBarSystem = new HealthBarSystemClass();
  }
  return globalHealthBarSystem;
}

/**
 * Set the broadcaster for health bar events
 */
export function setHealthBarBroadcaster(
  broadcaster: (type: string, data: Record<string, unknown>) => void
): void {
  if (!globalHealthBarSystem) {
    globalHealthBarSystem = new HealthBarSystemClass();
  }
  globalHealthBarSystem.setBroadcaster(broadcaster);
}

/**
 * Queue a health bar update event
 */
export function queueHealthBarUpdate(
  entityId: string,
  currentHealth: number,
  maxHealth: number,
  position: { x: number; y: number },
  visible: boolean = true
): void {
  if (!globalHealthBarSystem) {
    globalHealthBarSystem = new HealthBarSystemClass();
  }
  globalHealthBarSystem.updateHealthBar(entityId, currentHealth, maxHealth, position, visible);
}

/**
 * HealthBarSystemClass - Implementation class for health bar management
 */
class HealthBarSystemImpl {
  private healthBars: Map<string, HealthBarEvent> = new Map();
  private networkBroadcaster: ((type: string, data: Record<string, unknown>) => void) | null = null;

  constructor() {
    this.healthBars = new Map();
  }

  /**
   * Update health bar for an entity
   */
  updateHealthBar(
    entityId: string,
    currentHealth: number,
    maxHealth: number,
    position: { x: number; y: number },
    visible: boolean = true
  ): void {
    const healthBarEvent: HealthBarEvent = {
      entityId,
      currentHealth,
      maxHealth,
      position,
      visible,
      timestamp: Date.now(),
    };

    this.healthBars.set(entityId, healthBarEvent);

    // Broadcast immediately for responsive feedback
    if (this.networkBroadcaster) {
      this.networkBroadcaster('healthBarUpdate', { healthBar: healthBarEvent });
    }
  }

  /**
   * Hide health bar for an entity
   */
  hideHealthBar(entityId: string): void {
    const existingHealthBar = this.healthBars.get(entityId);
    if (existingHealthBar) {
      existingHealthBar.visible = false;
      existingHealthBar.timestamp = Date.now();

      if (this.networkBroadcaster) {
        this.networkBroadcaster('healthBarUpdate', { healthBar: existingHealthBar });
      }
    }
  }

  /**
   * Remove health bar for an entity
   */
  removeHealthBar(entityId: string): void {
    this.healthBars.delete(entityId);

    if (this.networkBroadcaster) {
      this.networkBroadcaster('healthBarRemove', { entityId });
    }
  }

  /**
   * Get health bar for an entity
   */
  getHealthBar(entityId: string): HealthBarEvent | undefined {
    return this.healthBars.get(entityId);
  }

  /**
   * Get all health bars
   */
  getAllHealthBars(): HealthBarEvent[] {
    return Array.from(this.healthBars.values());
  }

  /**
   * Update the health bar system
   */
  update(): void {
    // Clean up old health bars (older than 30 seconds)
    const cutoffTime = Date.now() - 30000;

    for (const [entityId, healthBar] of this.healthBars.entries()) {
      if (healthBar.timestamp < cutoffTime) {
        this.healthBars.delete(entityId);
      }
    }
  }

  /**
   * Clear all health bars
   */
  clear(): void {
    this.healthBars.clear();
  }
}
