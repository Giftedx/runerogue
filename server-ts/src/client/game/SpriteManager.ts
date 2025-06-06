import { AssetLoader } from './AssetLoader';
import { CONFIG } from '../config';

// Interface for sprite frame
interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Interface for sprite animation
interface SpriteAnimation {
  frames: SpriteFrame[];
  frameDuration: number; // Duration of each frame in milliseconds
}

// Interface for sprite definition
interface SpriteDefinition {
  animations: Record<string, SpriteAnimation>;
  directions?: string[]; // Optional directions for directional sprites
}

export class SpriteManager {
  private assetLoader: AssetLoader;
  private spriteDefinitions: Record<string, Record<string, SpriteDefinition>> = {};
  private animationTimers: Record<string, number> = {};

  constructor(assetLoader: AssetLoader) {
    this.assetLoader = assetLoader;
    this.initializeSpriteDefinitions();
  }

  // Initialize sprite definitions for all game entities
  private initializeSpriteDefinitions(): void {
    // Player sprites
    this.spriteDefinitions.player = {
      idle: {
        animations: {
          down: {
            frames: [{ x: 0, y: 0, width: 32, height: 32 }],
            frameDuration: 1000,
          },
          up: {
            frames: [{ x: 0, y: 32, width: 32, height: 32 }],
            frameDuration: 1000,
          },
          left: {
            frames: [{ x: 0, y: 64, width: 32, height: 32 }],
            frameDuration: 1000,
          },
          right: {
            frames: [{ x: 0, y: 96, width: 32, height: 32 }],
            frameDuration: 1000,
          },
        },
        directions: ['down', 'up', 'left', 'right'],
      },
      walk: {
        animations: {
          down: {
            frames: [
              { x: 0, y: 0, width: 32, height: 32 },
              { x: 32, y: 0, width: 32, height: 32 },
              { x: 64, y: 0, width: 32, height: 32 },
              { x: 96, y: 0, width: 32, height: 32 },
            ],
            frameDuration: 150,
          },
          up: {
            frames: [
              { x: 0, y: 32, width: 32, height: 32 },
              { x: 32, y: 32, width: 32, height: 32 },
              { x: 64, y: 32, width: 32, height: 32 },
              { x: 96, y: 32, width: 32, height: 32 },
            ],
            frameDuration: 150,
          },
          left: {
            frames: [
              { x: 0, y: 64, width: 32, height: 32 },
              { x: 32, y: 64, width: 32, height: 32 },
              { x: 64, y: 64, width: 32, height: 32 },
              { x: 96, y: 64, width: 32, height: 32 },
            ],
            frameDuration: 150,
          },
          right: {
            frames: [
              { x: 0, y: 96, width: 32, height: 32 },
              { x: 32, y: 96, width: 32, height: 32 },
              { x: 64, y: 96, width: 32, height: 32 },
              { x: 96, y: 96, width: 32, height: 32 },
            ],
            frameDuration: 150,
          },
        },
        directions: ['down', 'up', 'left', 'right'],
      },
      attack: {
        animations: {
          down: {
            frames: [
              { x: 0, y: 128, width: 32, height: 32 },
              { x: 32, y: 128, width: 32, height: 32 },
              { x: 64, y: 128, width: 32, height: 32 },
            ],
            frameDuration: 100,
          },
          up: {
            frames: [
              { x: 0, y: 160, width: 32, height: 32 },
              { x: 32, y: 160, width: 32, height: 32 },
              { x: 64, y: 160, width: 32, height: 32 },
            ],
            frameDuration: 100,
          },
          left: {
            frames: [
              { x: 0, y: 192, width: 32, height: 32 },
              { x: 32, y: 192, width: 32, height: 32 },
              { x: 64, y: 192, width: 32, height: 32 },
            ],
            frameDuration: 100,
          },
          right: {
            frames: [
              { x: 0, y: 224, width: 32, height: 32 },
              { x: 32, y: 224, width: 32, height: 32 },
              { x: 64, y: 224, width: 32, height: 32 },
            ],
            frameDuration: 100,
          },
        },
        directions: ['down', 'up', 'left', 'right'],
      },
    };

    // NPC sprites - defining just goblin for example
    this.spriteDefinitions.npcs = {
      goblin_idle: {
        animations: {
          down: {
            frames: [{ x: 0, y: 0, width: 32, height: 32 }],
            frameDuration: 1000,
          },
          up: {
            frames: [{ x: 0, y: 32, width: 32, height: 32 }],
            frameDuration: 1000,
          },
          left: {
            frames: [{ x: 0, y: 64, width: 32, height: 32 }],
            frameDuration: 1000,
          },
          right: {
            frames: [{ x: 0, y: 96, width: 32, height: 32 }],
            frameDuration: 1000,
          },
        },
        directions: ['down', 'up', 'left', 'right'],
      },
      goblin_walk: {
        animations: {
          down: {
            frames: [
              { x: 0, y: 0, width: 32, height: 32 },
              { x: 32, y: 0, width: 32, height: 32 },
              { x: 64, y: 0, width: 32, height: 32 },
              { x: 96, y: 0, width: 32, height: 32 },
            ],
            frameDuration: 200,
          },
          up: {
            frames: [
              { x: 0, y: 32, width: 32, height: 32 },
              { x: 32, y: 32, width: 32, height: 32 },
              { x: 64, y: 32, width: 32, height: 32 },
              { x: 96, y: 32, width: 32, height: 32 },
            ],
            frameDuration: 200,
          },
          left: {
            frames: [
              { x: 0, y: 64, width: 32, height: 32 },
              { x: 32, y: 64, width: 32, height: 32 },
              { x: 64, y: 64, width: 32, height: 32 },
              { x: 96, y: 64, width: 32, height: 32 },
            ],
            frameDuration: 200,
          },
          right: {
            frames: [
              { x: 0, y: 96, width: 32, height: 32 },
              { x: 32, y: 96, width: 32, height: 32 },
              { x: 64, y: 96, width: 32, height: 32 },
              { x: 96, y: 96, width: 32, height: 32 },
            ],
            frameDuration: 200,
          },
        },
        directions: ['down', 'up', 'left', 'right'],
      },
      goblin_attack: {
        animations: {
          down: {
            frames: [
              { x: 0, y: 128, width: 32, height: 32 },
              { x: 32, y: 128, width: 32, height: 32 },
              { x: 64, y: 128, width: 32, height: 32 },
            ],
            frameDuration: 150,
          },
          up: {
            frames: [
              { x: 0, y: 160, width: 32, height: 32 },
              { x: 32, y: 160, width: 32, height: 32 },
              { x: 64, y: 160, width: 32, height: 32 },
            ],
            frameDuration: 150,
          },
          left: {
            frames: [
              { x: 0, y: 192, width: 32, height: 32 },
              { x: 32, y: 192, width: 32, height: 32 },
              { x: 64, y: 192, width: 32, height: 32 },
            ],
            frameDuration: 150,
          },
          right: {
            frames: [
              { x: 0, y: 224, width: 32, height: 32 },
              { x: 32, y: 224, width: 32, height: 32 },
              { x: 64, y: 224, width: 32, height: 32 },
            ],
            frameDuration: 150,
          },
        },
        directions: ['down', 'up', 'left', 'right'],
      },
      // Add more NPC types here
    };

    // Tile sprites
    this.spriteDefinitions.tiles = {
      floor: {
        animations: {
          default: {
            frames: [{ x: 0, y: 0, width: 32, height: 32 }],
            frameDuration: 1000,
          },
        },
      },
      wall: {
        animations: {
          default: {
            frames: [{ x: 32, y: 0, width: 32, height: 32 }],
            frameDuration: 1000,
          },
        },
      },
      exit: {
        animations: {
          default: {
            frames: [
              { x: 64, y: 0, width: 32, height: 32 },
              { x: 96, y: 0, width: 32, height: 32 },
              { x: 128, y: 0, width: 32, height: 32 },
              { x: 160, y: 0, width: 32, height: 32 },
            ],
            frameDuration: 250,
          },
        },
      },
    };

    // Resource sprites
    this.spriteDefinitions.resources = {
      tree: {
        animations: {
          default: {
            frames: [{ x: 0, y: 0, width: 32, height: 32 }],
            frameDuration: 1000,
          },
        },
      },
      oak_tree: {
        animations: {
          default: {
            frames: [{ x: 32, y: 0, width: 32, height: 32 }],
            frameDuration: 1000,
          },
        },
      },
      copper_rock: {
        animations: {
          default: {
            frames: [{ x: 64, y: 0, width: 32, height: 32 }],
            frameDuration: 1000,
          },
        },
      },
    };

    // Item sprites
    this.spriteDefinitions.items = {
      loot_pile: {
        animations: {
          default: {
            frames: [
              { x: 0, y: 0, width: 32, height: 32 },
              { x: 32, y: 0, width: 32, height: 32 },
              { x: 64, y: 0, width: 32, height: 32 },
              { x: 32, y: 0, width: 32, height: 32 },
            ],
            frameDuration: 250,
          },
        },
      },
      sword: {
        animations: {
          default: {
            frames: [{ x: 0, y: 32, width: 32, height: 32 }],
            frameDuration: 1000,
          },
        },
      },
      armor: {
        animations: {
          default: {
            frames: [{ x: 32, y: 32, width: 32, height: 32 }],
            frameDuration: 1000,
          },
        },
      },
      potion: {
        animations: {
          default: {
            frames: [{ x: 64, y: 32, width: 32, height: 32 }],
            frameDuration: 1000,
          },
        },
      },
    };

    // Effect sprites
    this.spriteDefinitions.effects = {
      sparkle: {
        animations: {
          default: {
            frames: [
              { x: 0, y: 0, width: 16, height: 16 },
              { x: 16, y: 0, width: 16, height: 16 },
              { x: 32, y: 0, width: 16, height: 16 },
              { x: 48, y: 0, width: 16, height: 16 },
            ],
            frameDuration: 150,
          },
        },
      },
      combat: {
        animations: {
          default: {
            frames: [
              { x: 0, y: 16, width: 16, height: 16 },
              { x: 16, y: 16, width: 16, height: 16 },
            ],
            frameDuration: 500,
          },
        },
      },
      hit: {
        animations: {
          default: {
            frames: [
              { x: 0, y: 32, width: 32, height: 32 },
              { x: 32, y: 32, width: 32, height: 32 },
              { x: 64, y: 32, width: 32, height: 32 },
              { x: 96, y: 32, width: 32, height: 32 },
            ],
            frameDuration: 100,
          },
        },
      },
    };
  }

  // Draw a static sprite
  public drawSprite(
    spriteType: string,
    spriteName: string,
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D
  ): void {
    const spriteSheet = this.assetLoader.getImage(`${spriteType}`);
    if (!spriteSheet) return;

    const spriteDefinition = this.spriteDefinitions[spriteType]?.[spriteName];
    if (!spriteDefinition) return;

    // Get the first frame of the default animation
    const animation =
      spriteDefinition.animations.default || Object.values(spriteDefinition.animations)[0];
    const frame = animation.frames[0];

    // Draw the sprite
    ctx.drawImage(
      spriteSheet,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      x,
      y,
      frame.width,
      frame.height
    );
  }

  // Draw an animated sprite
  public drawAnimatedSprite(
    spriteType: string,
    spriteName: string,
    direction: string = 'down',
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D
  ): void {
    const spriteSheet = this.assetLoader.getImage(`${spriteType}`);
    if (!spriteSheet) return;

    const spriteDefinition = this.spriteDefinitions[spriteType]?.[spriteName];
    if (!spriteDefinition) return;

    // Get the animation for the specified direction or default
    let animation: SpriteAnimation;
    if (spriteDefinition.directions && spriteDefinition.directions.includes(direction)) {
      animation = spriteDefinition.animations[direction];
    } else {
      animation =
        spriteDefinition.animations.default || Object.values(spriteDefinition.animations)[0];
    }

    // Calculate current frame based on time
    const animationKey = `${spriteType}_${spriteName}_${direction}`;
    const currentTime = performance.now();
    if (!this.animationTimers[animationKey]) {
      this.animationTimers[animationKey] = currentTime;
    }

    const elapsedTime = currentTime - this.animationTimers[animationKey];
    const totalDuration = animation.frameDuration * animation.frames.length;
    const normalizedTime = elapsedTime % totalDuration;
    const frameIndex = Math.floor(normalizedTime / animation.frameDuration);

    // Get the current frame
    const frame = animation.frames[frameIndex];

    // Draw the sprite
    ctx.drawImage(
      spriteSheet,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      x,
      y,
      frame.width,
      frame.height
    );
  }
}
