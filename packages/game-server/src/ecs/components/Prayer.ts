import { defineComponent, Types } from "bitecs";

/**
 * Prayer component for ECS entities.
 * Tracks current and max prayer points, active prayers, and drain timer.
 */
export const Prayer = defineComponent({
  current: Types.ui16, // Current prayer points
  max: Types.ui16, // Max prayer points
  drainTimer: Types.f32, // Timer for prayer drain (ms)
  activeMask: Types.ui32, // Bitmask for active prayers (up to 32 prayers)
});

export default Prayer;
