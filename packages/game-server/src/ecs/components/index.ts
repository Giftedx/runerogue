/**
 * @file Component barrel file for convenient import.
 * @author RuneRogue Development Team
 */

export * from "./Combat";
export * from "./Enemy";
export * from "./Movement";
export * from "./Player";
export * from "./Target";

import { defineComponent, Types } from "bitecs";

export const Combat = defineComponent({
  attack: Types.ui8,
  strength: Types.ui8,
  defence: Types.ui8,
  attackSpeed: Types.ui16, // milliseconds between attacks
  lastAttackTime: Types.f32, // timestamp of last attack
});

// Add Enemy tag component
export const Enemy = defineComponent({}); // Tag component for enemy entities
