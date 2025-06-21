import { defineComponent, Types } from "bitecs";

/**
 * Component for the position of an entity.
 */
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

/**
 * Component for the velocity of an entity.
 */
export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
});
