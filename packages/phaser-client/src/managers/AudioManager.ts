/**
 * @file AudioManager.ts
 * @description Manages loading and playing all sound effects and music for the game.
 * @author Your Name
 */

import Phaser from "phaser";

/**
 * @class AudioManager
 * @classdesc A centralized manager for all audio in the game. It handles loading,
 * playing, and managing sound effects and music tracks.
 */
export class AudioManager {
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();

  /**
   * Creates an instance of AudioManager.
   * @param {Phaser.Scene} scene - The Phaser scene that this manager will be attached to.
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Preloads all necessary audio assets. This should be called in the scene's preload method.
   */
  public preload(): void {
    // Example sound loading - replace with actual asset paths
    this.scene.load.audio("attack-swoosh", "assets/audio/attack_swoosh.wav");
    this.scene.load.audio("hit-splat", "assets/audio/hit_splat.wav");
    this.scene.load.audio("player-death", "assets/audio/player_death.wav");
    this.scene.load.audio("enemy-death", "assets/audio/enemy_death.wav");
  }

  /**
   * Creates and adds the sounds to the manager after preloading.
   * This should be called in the scene's create method.
   */
  public create(): void {
    this.addSound("attack-swoosh");
    this.addSound("hit-splat");
    this.addSound("player-death");
    this.addSound("enemy-death");
  }

  /**
   * Adds a sound to the manager.
   * @param {string} key - The key of the sound to add.
   * @param {Phaser.Types.Sound.SoundConfig} [config] - Optional configuration for the sound.
   */
  public addSound(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
    if (!this.sounds.has(key)) {
      const sound = this.scene.sound.add(key, config);
      this.sounds.set(key, sound);
    }
  }

  /**
   * Plays a sound effect.
   * @param {string} key - The key of the sound to play.
   * @param {Phaser.Types.Sound.SoundConfig} [config] - Optional configuration to override the default.
   */
  public play(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
    const sound = this.sounds.get(key);
    if (sound) {
      sound.play(config);
    } else {
      console.warn(`Sound with key '${key}' not found.`);
    }
  }
}
