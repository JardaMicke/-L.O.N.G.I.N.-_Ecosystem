import { TransformComponent } from '../core/components';
import { Entity } from '../ecs/entity';
import { System } from '../ecs/system';

import { Camera } from './camera';
import { ParticleEmitterComponent, Particle } from './components';
import { Renderer } from './renderer';

/**
 * System responsible for updating and rendering particle systems.
 */
export class ParticleSystem extends System {
  private renderer: Renderer;

  /**
   * Creates a new ParticleSystem.
   * 
   * @param {Renderer} renderer - The renderer to use for drawing particles.
   */
  constructor(renderer: Renderer) {
    super();
    this.renderer = renderer;
    this.requiredComponents = ['Transform', 'ParticleEmitter'];
  }

  /**
   * Updates particle emitters and their particles.
   * Handles emission of new particles based on rates and timers.
   * Updates position, velocity, and life of existing particles.
   * Removes dead particles.
   * 
   * @param {Entity[]} entities - List of entities with ParticleEmitter components.
   * @param {number} deltaTime - Time elapsed since last frame in seconds.
   * @returns {void}
   */
  public update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('Transform');
      const emitter = entity.getComponent<ParticleEmitterComponent>('ParticleEmitter');

      if (!transform || !emitter) continue;

      // Emit new particles only if active
      if (emitter.active) {
        emitter.emissionTimer += deltaTime;
        const emissionInterval = 1.0 / emitter.config.emissionRate;

        while (emitter.emissionTimer >= emissionInterval) {
          emitter.emissionTimer -= emissionInterval;
          if (emitter.particles.length < emitter.config.maxParticles) {
            this.spawnParticle(emitter, transform.x, transform.y);
          }
        }
      }

      // Update existing particles
      for (let i = emitter.particles.length - 1; i >= 0; i--) {
        const p = emitter.particles[i];
        p.life -= deltaTime;

        if (p.life <= 0) {
          emitter.particles.splice(i, 1);
          continue;
        }

        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;

        // Interpolate properties if needed (color, size)
        // For now just linear interpolation for size could be added
      }
    }
  }

  /**
   * Renders all particles.
   * 
   * @param {Entity[]} entities - List of entities.
   * @param {Camera} [camera] - Active camera.
   */
  public render(entities: Entity[], camera?: Camera): void {
    if (camera) {
      this.renderer.begin(camera);
    }

    for (const entity of entities) {
      const emitter = entity.getComponent<ParticleEmitterComponent>('ParticleEmitter');
      if (!emitter) continue;

      for (const p of emitter.particles) {
        // Simple rect rendering for now
        this.renderer.renderRect(p.x, p.y, p.size, p.size, p.color);
      }
    }

    if (camera) {
      this.renderer.end();
    }
  }

  // Helper to render from outside (Engine)
  // Deprecated in favor of standard render
  /**
   * Deprecated helper to render particles. Use render() instead.
   * @deprecated
   */
  public renderParticles(entities: Entity[], camera?: Camera): void {
    this.render(entities, camera);
  }

  /**
   * Spawns a new particle from an emitter at a specific position.
   * 
   * @param {ParticleEmitterComponent} emitter - The emitter component.
   * @param {number} x - Spawn X coordinate.
   * @param {number} y - Spawn Y coordinate.
   */
  private spawnParticle(emitter: ParticleEmitterComponent, x: number, y: number): void {
    const angle = Math.random() * Math.PI * 2;
    const speed =
      emitter.config.speed +
      (Math.random() * emitter.config.speedVariance * 2 - emitter.config.speedVariance);
    const life =
      emitter.config.lifetime +
      (Math.random() * emitter.config.lifetimeVariance * 2 - emitter.config.lifetimeVariance);

    const particle: Particle = {
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: life,
      maxLife: life,
      color: emitter.config.startColor,
      size: emitter.config.startSize,
      rotation: 0,
    };

    emitter.particles.push(particle);
  }
}
