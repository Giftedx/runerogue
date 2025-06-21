import { defineComponent, Types } from "bitecs";

/**
 * Represents the health of an entity.
 */
export const Health = defineComponent({
  current: Types.f32,
  max: Types.f32,
});

export default Health;
