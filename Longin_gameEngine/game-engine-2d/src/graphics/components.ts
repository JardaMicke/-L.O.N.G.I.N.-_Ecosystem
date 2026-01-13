import { Component } from '../ecs/component';

/**
 * Component for rendering a sprite (image).
 */
export class SpriteComponent extends Component {
  public readonly name = 'Sprite';
  
  /** Texture ID (key in ResourceManager) */
  public textureId: string;
  
  /** Width to render in world units */
  public width: number;
  
  /** Height to render in world units */
  public height: number;
  
  /** Source X coordinate on the texture (for spritesheets) */
  public srcX: number = 0;
  
  /** Source Y coordinate on the texture */
  public srcY: number = 0;
  
  /** Source width on the texture */
  public srcWidth: number = 0;
  
  /** Source height on the texture */
  public srcHeight: number = 0;
  
  /** Rendering layer index (higher renders on top) */
  public layer: number = 0;
  
  /** Whether the sprite is visible */
  public visible: boolean = true;

  /**
   * Creates a new SpriteComponent.
   * @param {string} textureId - Texture ID.
   * @param {number} width - Render width.
   * @param {number} height - Render height.
   * @param {number} [layer=0] - Render layer.
   */
  constructor(textureId: string, width: number, height: number, layer: number = 0) {
    super();
    this.textureId = textureId;
    this.width = width;
    this.height = height;
    this.layer = layer;
  }
}

/**
 * Component for handling sprite animations.
 */
export class AnimationComponent extends Component {
  public readonly name = 'Animation';
  
  /** Name of the currently playing animation */
  public currentAnim: string = 'idle';
  
  /** Current timer for frame switching */
  public timer: number = 0;
  
  /** Current frame index in the animation sequence */
  public frameIndex: number = 0;
  
  /** Map of animation data by name */
  public animations: Map<string, AnimationData> = new Map();
  
  /** Whether the animation is currently playing */
  public playing: boolean = true;

  constructor() {
    super();
  }

  /**
   * Adds a new animation definition.
   * @param {string} name - Animation name.
   * @param {number[]} frames - Array of frame indices (or x-positions).
   * @param {number} speed - Time per frame in seconds.
   * @param {boolean} [loop=true] - Whether to loop the animation.
   */
  public addAnimation(name: string, frames: number[], speed: number, loop: boolean = true): void {
    this.animations.set(name, { frames, speed, loop });
  }
}

/**
 * Data defining a single animation sequence.
 */
export interface AnimationData {
  /** Indices of frames or x-positions */
  frames: number[]; 
  /** Time per frame in seconds */
  speed: number; 
  /** Whether the animation loops */
  loop: boolean;
}

/**
 * Configuration for a particle emitter.
 */
export interface ParticleConfig {
  /** Maximum number of active particles */
  maxParticles: number;
  /** Particles emitted per second */
  emissionRate: number;
  /** Particle lifetime in seconds */
  lifetime: number; 
  /** Variance in lifetime */
  lifetimeVariance: number;
  /** Particle speed */
  speed: number;
  /** Variance in speed */
  speedVariance: number;
  /** Start color (hex or rgba) */
  startColor: string;
  /** End color (hex or rgba) - currently unused in simple renderer */
  endColor: string;
  /** Start size */
  startSize: number;
  /** End size - currently unused */
  endSize: number;
  /** Texture ID for textured particles */
  textureId?: string;
}

/**
 * Component that emits particles.
 */
export class ParticleEmitterComponent extends Component {
  public readonly name = 'ParticleEmitter';
  
  /** Emitter configuration */
  public config: ParticleConfig;
  
  /** Whether the emitter is active */
  public active: boolean = true;
  
  /** List of active particles */
  public particles: Particle[] = [];
  
  /** Timer for emission */
  public emissionTimer: number = 0;

  /**
   * Creates a new ParticleEmitterComponent.
   * @param {ParticleConfig} config - Emitter configuration.
   */
  constructor(config: ParticleConfig) {
    super();
    this.config = config;
  }
}

/**
 * Interface representing a single particle instance.
 */
export interface Particle {
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** X velocity */
  vx: number;
  /** Y velocity */
  vy: number;
  /** Remaining life in seconds */
  life: number;
  /** Total life duration */
  maxLife: number;
  /** Particle color */
  color: string;
  /** Particle size */
  size: number;
  /** Rotation in radians */
  rotation: number;
}

/**
 * Component for a point light source.
 */
export class LightComponent extends Component {
  public readonly name = 'Light';
  
  /** Light radius */
  public radius: number;
  
  /** Light color (hex or rgba) */
  public color: string; 
  
  /** Light intensity (0-1) - currently used via alpha in color or logic */
  public intensity: number;

  /**
   * Creates a new LightComponent.
   * @param {number} radius - Light radius.
   * @param {string} color - Light color.
   * @param {number} [intensity=1.0] - Light intensity.
   */
  constructor(radius: number, color: string, intensity: number = 1.0) {
    super();
    this.radius = radius;
    this.color = color;
    this.intensity = intensity;
  }
}
