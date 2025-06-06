/**
 * Common interface for game renderers
 * This ensures compatibility between different renderer implementations
 */

import { GameState } from './GameState';

export interface IGameRenderer {
  /**
   * Main render method called each frame
   * @param gameState - Current game state
   * @param deltaTime - Time elapsed since last frame in seconds
   */
  render(gameState: GameState, deltaTime: number): void;

  /**
   * Show a damage number above an entity
   * @param entityId - ID of the entity to show damage for
   * @param value - Damage value (positive for damage, negative for healing)
   */
  showDamageNumber(entityId: string, value: number): void;

  /**
   * Show a skill level up popup
   * @param skill - Name of the skill
   * @param level - New level achieved
   * @param x - X position
   * @param y - Y position
   */
  showSkillPopup(skill: string, level: number, x: number, y: number): void;
}
