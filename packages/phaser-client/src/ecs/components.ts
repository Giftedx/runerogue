/**
 * @file Defines the core components for the Entity-Component-System (ECS) architecture.
 * @see {@link https://github.com/NateTheGreatt/bitECS} for library documentation.
 */
import { defineComponent, Types } from "bitecs";

/**
 * Represents the position of an entity in the game world.
 * @property {number} x - The x-coordinate.
 * @property {number} y - The y-coordinate.
 */
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

/**
 * Represents the velocity of an entity.
 * @property {number} x - The velocity component on the x-axis.
 * @property {number} y - The velocity component on the y-axis.
 */
export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

/**
 * @description Component to store health values.
 * @property {Types.ui16} current - The current health value.
 * @property {Types.ui16} max - The maximum health value.
 */
export const Health = defineComponent({
  current: Types.ui16,
  max: Types.ui16,
});

/**
 * @description Component for OSRS-style combat stats.
 * @property {Types.ui8} attack - The attack level.
 * @property {Types.ui8} strength - The strength level.
 * @property {Types.ui8} defence - The defence level.
 * @property {Types.ui8} ranged - The ranged level.
 * @property {Types.ui8} magic - The magic level.
 */
export const Stats = defineComponent({
  attack: Types.ui8,
  strength: Types.ui8,
  defence: Types.ui8,
  ranged: Types.ui8,
  magic: Types.ui8,
});

/**
 * @description Component to assign a target entity for combat.
 * @property {Types.eid} eid - The entity ID of the target.
 */
export const Target = defineComponent({
  eid: Types.eid,
});

/**
 * @description Component to signal a melee attack.
 * @property {Types.ui32} swingTimer - Countdown timer for the next swing.
 * @property {Types.ui32} swingRate - Time between swings in milliseconds (e.g., 2400 for 4 ticks).
 */
export const MeleeAttack = defineComponent({
  swingTimer: Types.ui32,
  swingRate: Types.ui32,
});

/**
 * A tag component to identify an entity as being controlled by a player.
 * Does not hold any data.
 */
export const Player = defineComponent();

/**
 * A tag component to identify an entity as an enemy.
 */
export const Enemy = defineComponent();

/**
 * Stores the server-side session ID for an entity, linking it
 * to the Colyseus room state.
 *
 * It's stored as a string, but since bitecs doesn't have a native string type,
 * we'll manage the mapping externally. For now, this component will be a tag.
 * In the future, we might store a string reference ID if needed.
 */
export const ServerId = defineComponent({
  id: Types.ui32, // Placeholder for now, will map to a string ID.
});

export default {
  Position,
  Velocity,
  Health,
  Stats,
  Target,
  MeleeAttack,
  Player,
  Enemy,
  ServerId,
};
