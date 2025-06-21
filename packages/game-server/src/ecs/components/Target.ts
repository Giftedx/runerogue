/**
 * @file Defines the Target component for the ECS.
 */
import { defineComponent, Types } from "bitecs";

/**
 * @description Component to store the entity ID of a target.
 * Used by AI systems to track and pursue targets.
 * @property {number} eid - The entity ID of the target.
 */
export const Target = defineComponent({
  eid: Types.eid,
});
