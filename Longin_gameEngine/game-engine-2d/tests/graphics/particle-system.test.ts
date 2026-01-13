import { TransformComponent } from '../../src/core/components';
import { Entity } from '../../src/ecs/entity';
import { ParticleEmitterComponent } from '../../src/graphics/components';
import { ParticleSystem } from '../../src/graphics/particle-system';
import { Renderer } from '../../src/graphics/renderer';

jest.mock('../../src/graphics/renderer');

describe('ParticleSystem', () => {
  let particleSystem: ParticleSystem;
  let mockRenderer: jest.Mocked<Renderer>;
  let entity: Entity;

  beforeEach(() => {
    mockRenderer = new Renderer({
      type: 'canvas',
      width: 800,
      height: 600,
    } as any) as jest.Mocked<Renderer>;
    particleSystem = new ParticleSystem(mockRenderer);

    entity = new Entity();
    entity.addComponent(new TransformComponent(100, 100));
    entity.addComponent(
      new ParticleEmitterComponent({
        maxParticles: 10,
        emissionRate: 10,
        lifetime: 1,
        lifetimeVariance: 0,
        speed: 100,
        speedVariance: 0,
        startColor: 'red',
        endColor: 'blue',
        startSize: 5,
        endSize: 0,
      }),
    );
  });

  test('should emit particles', () => {
    // Update 0.1s -> should emit 1 particle (rate 10)
    particleSystem.update([entity], 0.1);

    const emitter = entity.getComponent<ParticleEmitterComponent>('ParticleEmitter')!;
    expect(emitter.particles.length).toBeGreaterThanOrEqual(1);
  });

  test('should update particles', () => {
    particleSystem.update([entity], 0.1);
    const emitter = entity.getComponent<ParticleEmitterComponent>('ParticleEmitter')!;
    const p = emitter.particles[0];
    const initialX = p.x;
    const initialY = p.y;

    particleSystem.update([entity], 0.1);

    expect(p.x).not.toBe(initialX); // Should have moved
    expect(p.life).toBeLessThan(1);
  });

  test('should remove dead particles', () => {
    particleSystem.update([entity], 0.1); // Spawn
    const emitter = entity.getComponent<ParticleEmitterComponent>('ParticleEmitter')!;
    expect(emitter.particles.length).toBe(1);

    particleSystem.update([entity], 1.1); // Wait for death (lifetime 1)

    expect(emitter.particles.length).toBe(0); // Should be removed (or new ones spawned, but first one dead)
    // Actually new ones spawn continuously.
    // But let's check if ANY particles are removed.
    // We can force emission to stop.
    emitter.active = false;
    // Clear particles manually or reset
    emitter.particles = [
      {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0.1,
        maxLife: 1,
        color: 'red',
        size: 5,
        rotation: 0,
      },
    ];

    particleSystem.update([entity], 0.2);
    expect(emitter.particles.length).toBe(0);
  });

  test('should render particles', () => {
    particleSystem.update([entity], 0.1); // Spawn
    particleSystem.render([entity]);
    expect(mockRenderer.renderRect).toHaveBeenCalled();
  });
});
