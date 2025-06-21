import { defineComponent, Types } from "bitecs";

/**
 * Represents the basic combat and movement stats of an entity.
 */
export const Stats = defineComponent({
  speed: Types.f32, // Movement speed in pixels per second
  damage: Types.f32, // Base damage
  attackSpeed: Types.f32, // Attacks per second
});

export default Stats;
