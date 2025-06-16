// Export all ECS systems
export { MovementSystem, setMovementTarget, stopMovement, isMoving } from './MovementSystem';
export { CombatSystem, startCombat, endCombat } from './CombatSystem';
export {
  PrayerSystem,
  activatePlayerPrayer,
  deactivatePlayerPrayer,
  deactivateAllPrayers,
  getActivePrayers,
  canActivatePrayer,
} from './PrayerSystem';
export {
  SkillSystem,
  SkillType,
  getLevelForXP,
  getXPForLevel,
  getXPToNextLevel,
  addSkillXP,
  getTotalLevel,
  getTotalXP,
  getCombatLevel,
  hasSkillRequirement,
} from './SkillSystem';
export { ResourceNodeSystem } from './ResourceNodeSystem';
export { WoodcuttingSystem, startWoodcutting, stopWoodcutting } from './WoodcuttingSystem';
export { MiningSystem, startMining, stopMining } from './MiningSystem';
export { FishingSystem, startFishing, stopFishing } from './FishingSystem';
export { CookingSystem, startCooking, stopCooking } from './CookingSystem';
export { FiremakingSystem, startFiremaking, stopFiremaking } from './FiremakingSystem';

// Phase 4 skill systems - only export non-excluded systems
export { SmithingSystem } from './SmithingSystem';
export { EquipmentSystem } from './EquipmentSystem';
export { ConsumableSystem } from './ConsumableSystem';
export { XPSystem, grantXP, calculateLevelFromXP, calculateCombatLevel } from './XPSystem';

// NOTE: The following systems are temporarily excluded from build:
// - MagicCombatSystem (advanced combat)
// - RangedCombatSystem (advanced combat)
// - AutoCombatSystem (advanced combat automation)
// All core gathering systems have been successfully re-enabled! ✅
