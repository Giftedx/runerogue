import { CONFIG } from '../config';

export class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private music: HTMLAudioElement | null = null;
  private isMusicEnabled: boolean = true;
  private isSoundEnabled: boolean = true;
  private volume: number = 0.5;
  
  constructor() {
    this.initializeAudio();
  }
  
  // Initialize audio elements
  private initializeAudio(): void {
    // Create sound effects
    this.createSound('attack', CONFIG.ASSETS.AUDIO.SFX.ATTACK);
    this.createSound('hit', CONFIG.ASSETS.AUDIO.SFX.HIT);
    this.createSound('miss', CONFIG.ASSETS.AUDIO.SFX.MISS);
    this.createSound('collect', CONFIG.ASSETS.AUDIO.SFX.COLLECT);
    this.createSound('levelUp', CONFIG.ASSETS.AUDIO.SFX.LEVEL_UP);
    this.createSound('death', CONFIG.ASSETS.AUDIO.SFX.DEATH);
    
    // Create background music
    this.music = new Audio(CONFIG.ASSETS.AUDIO.MUSIC);
    this.music.loop = true;
    this.music.volume = this.volume * 0.5; // Music slightly quieter than SFX
    
    // Load user preferences from localStorage
    this.loadPreferences();
  }
  
  // Create a sound effect
  private createSound(key: string, path: string): void {
    const sound = new Audio(path);
    sound.volume = this.volume;
    this.sounds.set(key, sound);
  }
  
  // Load audio preferences from localStorage
  private loadPreferences(): void {
    const musicEnabled = localStorage.getItem('musicEnabled');
    const soundEnabled = localStorage.getItem('soundEnabled');
    const volume = localStorage.getItem('volume');
    
    if (musicEnabled !== null) {
      this.isMusicEnabled = musicEnabled === 'true';
    }
    
    if (soundEnabled !== null) {
      this.isSoundEnabled = soundEnabled === 'true';
    }
    
    if (volume !== null) {
      this.volume = parseFloat(volume);
      this.updateVolume();
    }
  }
  
  // Save audio preferences to localStorage
  private savePreferences(): void {
    localStorage.setItem('musicEnabled', this.isMusicEnabled.toString());
    localStorage.setItem('soundEnabled', this.isSoundEnabled.toString());
    localStorage.setItem('volume', this.volume.toString());
  }
  
  // Play a sound effect
  public playSound(key: string): void {
    if (!this.isSoundEnabled) return;
    
    const sound = this.sounds.get(key);
    if (sound) {
      // Create a clone to allow overlapping sounds
      const soundClone = sound.cloneNode() as HTMLAudioElement;
      soundClone.volume = this.volume;
      soundClone.play().catch(error => {
        console.error(`Error playing sound ${key}:`, error);
      });
    }
  }
  
  // Play attack sound
  public playAttackSound(): void {
    this.playSound('attack');
  }
  
  // Play hit sound
  public playHitSound(): void {
    this.playSound('hit');
  }
  
  // Play miss sound
  public playMissSound(): void {
    this.playSound('miss');
  }
  
  // Play collect sound
  public playCollectSound(): void {
    this.playSound('collect');
  }
  
  // Play level up sound
  public playLevelUpSound(): void {
    this.playSound('levelUp');
  }
  
  // Play death sound
  public playDeathSound(): void {
    this.playSound('death');
  }
  
  // Start playing background music
  public playMusic(): void {
    if (!this.isMusicEnabled || !this.music) return;
    
    this.music.play().catch(error => {
      console.error('Error playing music:', error);
    });
  }
  
  // Stop background music
  public stopMusic(): void {
    if (!this.music) return;
    
    this.music.pause();
    this.music.currentTime = 0;
  }
  
  // Pause background music
  public pauseMusic(): void {
    if (!this.music) return;
    
    this.music.pause();
  }
  
  // Resume background music
  public resumeMusic(): void {
    if (!this.isMusicEnabled || !this.music) return;
    
    this.music.play().catch(error => {
      console.error('Error resuming music:', error);
    });
  }
  
  // Toggle music on/off
  public toggleMusic(): boolean {
    this.isMusicEnabled = !this.isMusicEnabled;
    
    if (this.isMusicEnabled) {
      this.playMusic();
    } else {
      this.pauseMusic();
    }
    
    this.savePreferences();
    return this.isMusicEnabled;
  }
  
  // Toggle sound effects on/off
  public toggleSound(): boolean {
    this.isSoundEnabled = !this.isSoundEnabled;
    this.savePreferences();
    return this.isSoundEnabled;
  }
  
  // Set volume for all audio
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.updateVolume();
    this.savePreferences();
  }
  
  // Update volume for all audio elements
  private updateVolume(): void {
    // Update sound effects volume
    for (const sound of this.sounds.values()) {
      sound.volume = this.volume;
    }
    
    // Update music volume (slightly lower than SFX)
    if (this.music) {
      this.music.volume = this.volume * 0.5;
    }
  }
  
  // Mute all audio
  public mute(): void {
    const wasMusicEnabled = this.isMusicEnabled;
    const wasSoundEnabled = this.isSoundEnabled;
    
    this.isMusicEnabled = false;
    this.isSoundEnabled = false;
    
    if (wasMusicEnabled) {
      this.pauseMusic();
    }
    
    this.savePreferences();
  }
  
  // Unmute all audio
  public unmute(): void {
    this.isMusicEnabled = true;
    this.isSoundEnabled = true;
    
    this.playMusic();
    this.savePreferences();
  }
  
  // Preload all audio assets
  public preloadAudio(): Promise<void[]> {
    const preloadPromises: Promise<void>[] = [];
    
    // Preload sound effects
    for (const sound of this.sounds.values()) {
      const promise = new Promise<void>((resolve) => {
        sound.addEventListener('canplaythrough', () => resolve(), { once: true });
        sound.load();
      });
      preloadPromises.push(promise);
    }
    
    // Preload music
    if (this.music) {
      const musicPromise = new Promise<void>((resolve) => {
        this.music!.addEventListener('canplaythrough', () => resolve(), { once: true });
        this.music!.load();
      });
      preloadPromises.push(musicPromise);
    }
    
    return Promise.all(preloadPromises);
  }
  
  // Create placeholder audio for development
  public createPlaceholderAudio(): void {
    // Create empty audio elements for development
    this.sounds.set('attack', new Audio());
    this.sounds.set('hit', new Audio());
    this.sounds.set('miss', new Audio());
    this.sounds.set('collect', new Audio());
    this.sounds.set('levelUp', new Audio());
    this.sounds.set('death', new Audio());
    
    this.music = new Audio();
    this.music.loop = true;
    
    console.log('Placeholder audio created');
  }
}
