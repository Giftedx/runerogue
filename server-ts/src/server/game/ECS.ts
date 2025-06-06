/**
 * ECS (Entity Component System) Foundation for RuneRogue
 *
 * This provides a high-performance ECS architecture using bitECS
 * to replace the current Colyseus schema-based system with a more
 * flexible and performant component-based architecture.
 */

import {
  addComponent,
  addEntity,
  Component,
  createWorld,
  defineComponent,
  defineQuery,
  enterQuery,
  exitQuery,
  getAllEntities,
  hasComponent,
  IWorld,
  removeEntity,
  Types,
} from 'bitecs';

// Core Components
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
});

export const Health = defineComponent({
  current: Types.ui16,
  maximum: Types.ui16,
  lastDamage: Types.ui16,
  lastDamageTime: Types.ui32,
});

export const Combat = defineComponent({
  attackLevel: Types.ui8,
  strengthLevel: Types.ui8,
  defenceLevel: Types.ui8,
  hitpointsLevel: Types.ui8,
  rangedLevel: Types.ui8,
  magicLevel: Types.ui8,
  prayerLevel: Types.ui8,
  combatLevel: Types.ui8,
  inCombat: Types.ui8, // 0 = false, 1 = true
  lastAttackTime: Types.ui32,
  attackStyle: Types.ui8, // 0 = accurate, 1 = aggressive, 2 = defensive, 3 = controlled
  specialAttackEnergy: Types.ui8,
});

export const Prayer = defineComponent({
  currentPoints: Types.ui16,
  maximumPoints: Types.ui16,
  drainRate: Types.f32,
  lastDrainTime: Types.ui32,
  activePrayers: Types.ui32, // Bitfield for active prayers
});

export const Movement = defineComponent({
  speed: Types.f32,
  direction: Types.ui8, // 0 = north, 1 = east, 2 = south, 3 = west
  isMoving: Types.ui8,
  targetX: Types.f32,
  targetY: Types.f32,
  pathfindingEnabled: Types.ui8,
});

export const Equipment = defineComponent({
  helmet: Types.ui16,
  cape: Types.ui16,
  amulet: Types.ui16,
  weapon: Types.ui16,
  body: Types.ui16,
  shield: Types.ui16,
  legs: Types.ui16,
  gloves: Types.ui16,
  boots: Types.ui16,
  ring: Types.ui16,
  ammo: Types.ui16,
});

export const Inventory = defineComponent({
  size: Types.ui8,
  itemCount: Types.ui8,
});

// Separate component for inventory items (using array)
export const InventoryItems = defineComponent({
  items: [Types.ui16, 28], // OSRS inventory size
  quantities: [Types.ui16, 28],
});

export const Player = defineComponent({
  sessionId: Types.ui32,
  username: Types.ui32, // String ID reference
  experience: [Types.ui32, 23], // 23 skills in OSRS
  questPoints: Types.ui16,
  totalLevel: Types.ui16,
  isOnline: Types.ui8,
});

export const NPC = defineComponent({
  npcId: Types.ui16,
  spawnX: Types.f32,
  spawnY: Types.f32,
  aggroRange: Types.ui8,
  respawnTime: Types.ui32,
  isDead: Types.ui8,
  maxWanderDistance: Types.ui8,
});

export const Item = defineComponent({
  itemId: Types.ui16,
  quantity: Types.ui16,
  spawnTime: Types.ui32,
  despawnTime: Types.ui32,
  isLoot: Types.ui8,
});

export const Visual = defineComponent({
  spriteId: Types.ui16,
  animationState: Types.ui8,
  animationFrame: Types.ui8,
  animationSpeed: Types.f32,
  opacity: Types.f32,
  scale: Types.f32,
  rotation: Types.f32,
});

export const Audio = defineComponent({
  soundId: Types.ui16,
  volume: Types.f32,
  pitch: Types.f32,
  isLooping: Types.ui8,
  spatialAudio: Types.ui8,
});

export const Resource = defineComponent({
  resourceType: Types.ui8, // 0 = tree, 1 = rock, 2 = fish, etc.
  currentAmount: Types.ui16,
  maximumAmount: Types.ui16,
  respawnRate: Types.ui32,
  harvestSkill: Types.ui8, // Required skill to harvest
  harvestLevel: Types.ui8, // Required level
  lastHarvestTime: Types.ui32,
});

export const Projectile = defineComponent({
  sourceEntity: Types.eid,
  targetEntity: Types.eid,
  startX: Types.f32,
  startY: Types.f32,
  endX: Types.f32,
  endY: Types.f32,
  speed: Types.f32,
  progress: Types.f32,
  damage: Types.ui16,
  projectileType: Types.ui8, // 0 = arrow, 1 = spell, etc.
});

export const Damage = defineComponent({
  amount: Types.ui16,
  damageType: Types.ui8, // 0 = melee, 1 = ranged, 2 = magic
  sourceEntity: Types.eid,
  timestamp: Types.ui32,
});

export const Effect = defineComponent({
  effectType: Types.ui8, // 0 = poison, 1 = buff, 2 = debuff, etc.
  duration: Types.ui32,
  startTime: Types.ui32,
  strength: Types.ui16,
  sourceEntity: Types.eid,
});

// Trade-specific components
export const Trade = defineComponent({
  tradeId: Types.ui32,
  proposer: Types.eid,
  accepter: Types.eid,
  status: Types.ui8, // 0 = proposed, 1 = active, 2 = completed, 3 = cancelled
  proposerAccepted: Types.ui8,
  accepterAccepted: Types.ui8,
});

export const TradeOffer = defineComponent({
  tradeEntity: Types.eid,
  offeringPlayer: Types.eid,
  items: [Types.ui16, 28], // Item IDs
  quantities: [Types.ui16, 28], // Quantities
  gold: Types.ui32,
});

// World and ECS Manager
export class ECSWorld {
  public world: IWorld;
  private stringTable: Map<string, number> = new Map();
  private reverseStringTable: Map<number, string> = new Map();
  private nextStringId = 1;

  constructor() {
    this.world = createWorld();
  }

  /**
   * Convert string to ID for component storage
   */
  public getStringId(str: string): number {
    if (this.stringTable.has(str)) {
      return this.stringTable.get(str)!;
    }

    const id = this.nextStringId++;
    this.stringTable.set(str, id);
    this.reverseStringTable.set(id, str);
    return id;
  }

  /**
   * Convert ID back to string
   */
  public getString(id: number): string {
    return this.reverseStringTable.get(id) || '';
  }

  /**
   * Create a new player entity
   */
  public createPlayer(sessionId: string, username: string, x: number, y: number): number {
    const entity = addEntity(this.world);

    // Add core components
    addComponent(this.world, Position, entity);
    addComponent(this.world, Health, entity);
    addComponent(this.world, Combat, entity);
    addComponent(this.world, Prayer, entity);
    addComponent(this.world, Movement, entity);
    addComponent(this.world, Equipment, entity);
    addComponent(this.world, Inventory, entity);
    addComponent(this.world, InventoryItems, entity);
    addComponent(this.world, Player, entity);
    addComponent(this.world, Visual, entity);

    // Initialize player data
    Position.x[entity] = x;
    Position.y[entity] = y;
    Position.z[entity] = 0;

    Health.current[entity] = 10; // Starting HP
    Health.maximum[entity] = 10;
    Health.lastDamage[entity] = 0;
    Health.lastDamageTime[entity] = 0;

    // Starting combat stats
    Combat.attackLevel[entity] = 1;
    Combat.strengthLevel[entity] = 1;
    Combat.defenceLevel[entity] = 1;
    Combat.hitpointsLevel[entity] = 10;
    Combat.rangedLevel[entity] = 1;
    Combat.magicLevel[entity] = 1;
    Combat.prayerLevel[entity] = 1;
    Combat.combatLevel[entity] = 3;
    Combat.inCombat[entity] = 0;
    Combat.lastAttackTime[entity] = 0;
    Combat.attackStyle[entity] = 0; // Accurate
    Combat.specialAttackEnergy[entity] = 100;

    Prayer.currentPoints[entity] = 1;
    Prayer.maximumPoints[entity] = 1;
    Prayer.drainRate[entity] = 0;
    Prayer.lastDrainTime[entity] = 0;
    Prayer.activePrayers[entity] = 0;

    Movement.speed[entity] = 1.0;
    Movement.direction[entity] = 2; // South
    Movement.isMoving[entity] = 0;
    Movement.targetX[entity] = x;
    Movement.targetY[entity] = y;
    Movement.pathfindingEnabled[entity] = 1;

    // Initialize inventory
    Inventory.size[entity] = 28;
    Inventory.itemCount[entity] = 0;

    // Initialize visual
    Visual.spriteId[entity] = this.getStringId('player');
    Visual.animationState[entity] = 0; // Idle
    Visual.animationFrame[entity] = 0;
    Visual.animationSpeed[entity] = 1.0;
    Visual.opacity[entity] = 1.0;
    Visual.scale[entity] = 1.0;
    Visual.rotation[entity] = 0;

    // Player-specific data
    Player.sessionId[entity] = this.getStringId(sessionId);
    Player.username[entity] = this.getStringId(username);
    Player.questPoints[entity] = 0;
    Player.totalLevel[entity] = 32; // Starting total level
    Player.isOnline[entity] = 1;

    return entity;
  }

  /**
   * Create a new NPC entity
   */
  public createNPC(npcId: number, x: number, y: number): number {
    const entity = addEntity(this.world);

    addComponent(this.world, Position, entity);
    addComponent(this.world, Health, entity);
    addComponent(this.world, Combat, entity);
    addComponent(this.world, Movement, entity);
    addComponent(this.world, NPC, entity);
    addComponent(this.world, Visual, entity);

    // Initialize position
    Position.x[entity] = x;
    Position.y[entity] = y;
    Position.z[entity] = 0;

    // NPC-specific data
    NPC.npcId[entity] = npcId;
    NPC.spawnX[entity] = x;
    NPC.spawnY[entity] = y;
    NPC.aggroRange[entity] = 3;
    NPC.respawnTime[entity] = 30000; // 30 seconds
    NPC.isDead[entity] = 0;
    NPC.maxWanderDistance[entity] = 5;

    return entity;
  }

  /**
   * Create an item entity
   */
  public createItem(
    itemId: number,
    quantity: number,
    x: number,
    y: number,
    isLoot: boolean = false
  ): number {
    const entity = addEntity(this.world);

    addComponent(this.world, Position, entity);
    addComponent(this.world, Item, entity);
    addComponent(this.world, Visual, entity);

    Position.x[entity] = x;
    Position.y[entity] = y;
    Position.z[entity] = 0;

    Item.itemId[entity] = itemId;
    Item.quantity[entity] = quantity;
    Item.spawnTime[entity] = Date.now();
    Item.despawnTime[entity] = Date.now() + (isLoot ? 300000 : 60000); // 5 min for loot, 1 min for regular
    Item.isLoot[entity] = isLoot ? 1 : 0;

    Visual.spriteId[entity] = this.getStringId(`item_${itemId}`);
    Visual.animationState[entity] = 0;
    Visual.opacity[entity] = 1.0;
    Visual.scale[entity] = 1.0;

    return entity;
  }

  /**
   * Create a projectile entity
   */
  public createProjectile(
    sourceEntity: number,
    targetEntity: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    damage: number,
    projectileType: number = 0
  ): number {
    const entity = addEntity(this.world);

    addComponent(this.world, Position, entity);
    addComponent(this.world, Projectile, entity);
    addComponent(this.world, Visual, entity);

    Position.x[entity] = startX;
    Position.y[entity] = startY;
    Position.z[entity] = 0;

    Projectile.sourceEntity[entity] = sourceEntity;
    Projectile.targetEntity[entity] = targetEntity;
    Projectile.startX[entity] = startX;
    Projectile.startY[entity] = startY;
    Projectile.endX[entity] = endX;
    Projectile.endY[entity] = endY;
    Projectile.speed[entity] = 5.0;
    Projectile.progress[entity] = 0;
    Projectile.damage[entity] = damage;
    Projectile.projectileType[entity] = projectileType;

    return entity;
  }

  /**
   * Remove an entity and all its components
   */
  public removeEntity(entity: number): void {
    removeEntity(this.world, entity);
  }

  /**
   * Get all entities with specific components
   */
  public getAllEntities(): number[] {
    return getAllEntities(this.world);
  }

  /**
   * Check if entity has component
   */
  public hasComponent<T extends Component>(entity: number, component: T): boolean {
    return hasComponent(this.world, component, entity);
  }
}

// Singleton ECS world instance
export const ecsWorld = new ECSWorld();

// Common queries for systems
export const playerQuery = defineQuery([Player, Position, Health, Combat]);
export const npcQuery = defineQuery([NPC, Position, Health, Combat]);
export const itemQuery = defineQuery([Item, Position]);
export const projectileQuery = defineQuery([Projectile, Position]);
export const combatQuery = defineQuery([Combat, Health, Position]);
export const movementQuery = defineQuery([Movement, Position]);
export const visualQuery = defineQuery([Visual, Position]);

// Enter/Exit queries for detecting new/removed entities
export const playerEnterQuery = enterQuery(playerQuery);
export const playerExitQuery = exitQuery(playerQuery);
export const npcEnterQuery = enterQuery(npcQuery);
export const npcExitQuery = exitQuery(npcQuery);
export const itemEnterQuery = enterQuery(itemQuery);
export const itemExitQuery = exitQuery(itemQuery);

/**
 * Helper function to create a basic player with starter equipment
 */
export function createStarterPlayer(
  sessionId: string,
  username: string,
  x: number,
  y: number
): number {
  const entity = ecsWorld.createPlayer(sessionId, username, x, y);

  // Add starter equipment
  Equipment.weapon[entity] = ecsWorld.getStringId('bronze_sword');
  Equipment.shield[entity] = ecsWorld.getStringId('wooden_shield');

  // Add starter items to inventory
  const starterItems = [
    { id: 'bread', quantity: 5 },
    { id: 'bronze_sword', quantity: 1 },
    { id: 'wooden_shield', quantity: 1 },
  ];

  starterItems.forEach((item, index) => {
    if (index < 28) {
      // OSRS inventory limit
      InventoryItems.items[entity][index] = ecsWorld.getStringId(item.id);
      InventoryItems.quantities[entity][index] = item.quantity;
      Inventory.itemCount[entity]++;
    }
  });

  return entity;
}

/**
 * Helper function to apply damage to an entity
 */
export function applyDamage(
  entity: number,
  damage: number,
  sourceEntity: number,
  damageType: number = 0
): void {
  if (!hasComponent(ecsWorld.world, Health, entity)) {
    return;
  }

  const currentHealth = Health.current[entity];
  const newHealth = Math.max(0, currentHealth - damage);

  Health.current[entity] = newHealth;
  Health.lastDamage[entity] = damage;
  Health.lastDamageTime[entity] = Date.now();

  // Add damage component for tracking
  addComponent(ecsWorld.world, Damage, entity);
  Damage.amount[entity] = damage;
  Damage.damageType[entity] = damageType;
  Damage.sourceEntity[entity] = sourceEntity;
  Damage.timestamp[entity] = Date.now();

  // Set combat state
  if (hasComponent(ecsWorld.world, Combat, entity)) {
    Combat.inCombat[entity] = 1;
    Combat.lastAttackTime[entity] = Date.now();
  }
}

/**
 * Helper function to heal an entity
 */
export function healEntity(entity: number, healAmount: number): void {
  if (!hasComponent(ecsWorld.world, Health, entity)) {
    return;
  }

  const currentHealth = Health.current[entity];
  const maxHealth = Health.maximum[entity];
  const newHealth = Math.min(maxHealth, currentHealth + healAmount);

  Health.current[entity] = newHealth;
}

/**
 * Helper function to move an entity
 */
export function moveEntity(entity: number, x: number, y: number): void {
  if (!hasComponent(ecsWorld.world, Position, entity)) {
    return;
  }

  Position.x[entity] = x;
  Position.y[entity] = y;

  if (hasComponent(ecsWorld.world, Movement, entity)) {
    Movement.targetX[entity] = x;
    Movement.targetY[entity] = y;
    Movement.isMoving[entity] = 0; // Stop moving when we reach target
  }
}
