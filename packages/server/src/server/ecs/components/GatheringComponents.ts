import { defineComponent, Types } from 'bitecs';

/**
 * Gathering Components for RuneRogue
 * OSRS-authentic gathering skill components following bitECS patterns
 */

/**
 * Component for entities that can be gathered (trees, rocks, fishing spots)
 */
export const ResourceNodeComponent = defineComponent({
  resourceType: Types.ui8, // Enum index for resource type (1=tree, 2=rock, 3=fishing_spot)
  resourceId: Types.ui16, // Specific resource ID (e.g., oak tree = 1001)
  requiredLevel: Types.ui8, // Minimum skill level required
  requiredTool: Types.ui16, // Tool item ID required (0 = none)
  xpReward: Types.ui16, // XP granted on successful gather (stored as int, divide by 10 for decimals)
  respawnTicks: Types.ui16, // Ticks until respawn after depletion
  currentRespawnTick: Types.ui16, // Current respawn countdown
  isDepleted: Types.ui8, // 0 = available, 1 = depleted
  depletionChance: Types.ui16, // Chance to deplete on gather (0-10000 for 0.0-1.0)
});

/**
 * Component for player skill levels and experience
 * Extends the existing SkillLevels and SkillXP components
 */
export const SkillDataComponent = defineComponent({
  // Skills up to level 50 implementation
  woodcuttingLevel: Types.ui8,
  woodcuttingXp: Types.ui32,
  miningLevel: Types.ui8,
  miningXp: Types.ui32,
  fishingLevel: Types.ui8,
  fishingXp: Types.ui32,
  cookingLevel: Types.ui8,
  cookingXp: Types.ui32,
  firemakingLevel: Types.ui8,
  firemakingXp: Types.ui32,
});

/**
 * Component for player gathering actions
 */
export const GatheringActionComponent = defineComponent({
  actionType: Types.ui8, // 0=none, 1=woodcutting, 2=mining, 3=fishing, 4=cooking, 5=firemaking
  targetEntity: Types.eid, // Entity being gathered from
  startTick: Types.ui32, // When action started
  nextActionTick: Types.ui32, // Next tick to process action
  toolItemId: Types.ui16, // Tool being used
  actionSubtype: Types.ui8, // For fishing methods, cooking spots, etc.
});

/**
 * Component for world objects like fires
 */
export const WorldObjectComponent = defineComponent({
  objectType: Types.ui8, // 0=fire, 1=ashes, 2=range
  createdTick: Types.ui32, // When object was created
  expirationTick: Types.ui32, // When object should be removed
  creatorEntity: Types.eid, // Entity that created this object
});

/**
 * Component for tracking inventory items (simplified for gathering)
 */
export const InventoryComponent = defineComponent({
  // This is a simplified version - real implementation would be more complex
  isFull: Types.ui8, // 0 = has space, 1 = full
  itemCount: Types.ui8, // Number of items in inventory (0-28)
});

/**
 * Component for damage numbers and visual feedback
 */
export const DamageNumberComponent = defineComponent({
  value: Types.ui16, // Damage/XP value to display
  type: Types.ui8, // 0=damage, 1=xp, 2=heal
  startTick: Types.ui32, // When the number started displaying
  duration: Types.ui16, // How long to display (in ticks)
});

/**
 * Component for tracking player actions for animation/feedback
 */
export const ActionFeedbackComponent = defineComponent({
  actionType: Types.ui8, // Same as GatheringActionComponent.actionType
  animationFrame: Types.ui8, // Current animation frame
  nextFrameTick: Types.ui32, // Next tick to advance animation
});
