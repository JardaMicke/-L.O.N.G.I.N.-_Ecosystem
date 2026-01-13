import { AudioSystem } from '../../src/audio/audio-system';
import { AudioManager } from '../../src/audio/audio-manager';
import { Entity } from '../../src/ecs/entity';
import { AudioSourceComponent, AudioListenerComponent } from '../../src/audio/components';
import { TransformComponent } from '../../src/core/components';
import { ConfigManager } from '../../src/core/config-manager';
import { EventSystem } from '../../src/core/event-system';

// Mocks
jest.mock('../../src/audio/audio-manager');
jest.mock('../../src/core/config-manager');
jest.mock('../../src/core/event-system');

describe('AudioSystem', () => {
  let audioSystem: AudioSystem;
  let mockAudioManager: any;
  let mockConfigManager: any;
  let mockEventSystem: any;
  let entities: Entity[];
  let listenerEntity: Entity;
  let sourceEntity: Entity;
  let mockSound: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup ConfigManager mock
    mockConfigManager = {
      getConfig: jest.fn().mockReturnValue({
        audio: {
          masterVolume: 1.0,
          sfxVolume: 1.0,
          musicVolume: 1.0,
          muted: false
        }
      }),
      getInstance: jest.fn().mockReturnThis(),
    };
    (ConfigManager as any).getInstance = jest.fn().mockReturnValue(mockConfigManager);

    // Setup EventSystem mock
    mockEventSystem = {
      on: jest.fn(),
      emit: jest.fn(),
      getInstance: jest.fn().mockReturnThis(),
    };
    (EventSystem as any).getInstance = jest.fn().mockReturnValue(mockEventSystem);

    // Setup AudioManager mock
    mockSound = {
      volume: jest.fn(),
      stereo: jest.fn(),
      loop: jest.fn(),
    };

    mockAudioManager = {
      getSfxVolume: jest.fn().mockReturnValue(1.0),
      playSfx: jest.fn().mockReturnValue(123),
      getSound: jest.fn().mockReturnValue(mockSound),
      getInstance: jest.fn().mockReturnThis(),
    };
    (AudioManager as any).getInstance = jest.fn().mockReturnValue(mockAudioManager);

    // Create system
    audioSystem = new AudioSystem();

    // Setup Entities
    listenerEntity = new Entity('1');
    listenerEntity.addComponent(new AudioListenerComponent());
    listenerEntity.addComponent(new TransformComponent(0, 0));

    sourceEntity = new Entity('2');
    sourceEntity.addComponent(new AudioSourceComponent('test-sound', 100, 1.0, true)); // range 100, vol 1.0, loop true
    sourceEntity.addComponent(new TransformComponent(0, 0));

    entities = [listenerEntity, sourceEntity];
  });

  it('should process audio source when listener is present', () => {
    // Source and listener are at (0,0) -> distance 0 -> volume 1.0
    audioSystem.update(entities, 0.016);

    // Should play sound because loop is true and not playing
    expect(mockAudioManager.playSfx).toHaveBeenCalledWith('test-sound', 1.0);
    const sourceComp = sourceEntity.getComponent<AudioSourceComponent>('AudioSource')!;
    expect(sourceComp.isPlaying).toBe(true);
    expect(sourceComp.playId).toBe(123);
  });

  it('should attenuate volume based on distance', () => {
    // Move source to (50, 0). Range is 100.
    // Distance 50. Volume should be (1 - 50/100) = 0.5
    const transform = sourceEntity.getComponent<TransformComponent>('Transform')!;
    transform.x = 50;
    transform.y = 0;

    audioSystem.update(entities, 0.016);

    expect(mockAudioManager.playSfx).toHaveBeenCalledWith('test-sound', 0.5);
  });

  it('should pan stereo based on position', () => {
    // Move source to (25, 0). Range is 100. Half range is 50.
    // dx = 25. Pan = 25 / 50 = 0.5 (Right)
    const transform = sourceEntity.getComponent<TransformComponent>('Transform')!;
    transform.x = 25;
    transform.y = 0;

    audioSystem.update(entities, 0.016);

    // First frame starts playing
    expect(mockSound.stereo).toHaveBeenCalledWith(0.5, 123);
  });

  it('should update volume and pan for already playing sound', () => {
    // First frame to start playing
    audioSystem.update(entities, 0.016);
    
    // Check initial state
    const sourceComp = sourceEntity.getComponent<AudioSourceComponent>('AudioSource')!;
    expect(sourceComp.isPlaying).toBe(true);
    
    // Move source
    const transform = sourceEntity.getComponent<TransformComponent>('Transform')!;
    transform.x = 50; // vol 0.5, pan 1.0 (50/50)
    
    // Second frame update
    audioSystem.update(entities, 0.016);
    
    expect(mockSound.volume).toHaveBeenCalledWith(0.5, 123);
    expect(mockSound.stereo).toHaveBeenCalledWith(1.0, 123);
  });

  it('should respect global SFX volume', () => {
    mockAudioManager.getSfxVolume.mockReturnValue(0.5); // Global volume 0.5
    
    // Start playing
    audioSystem.update(entities, 0.016);
    
    // Move source to get local volume 0.5 (dist 50/100)
    const transform = sourceEntity.getComponent<TransformComponent>('Transform')!;
    transform.x = 50;
    
    // Update
    audioSystem.update(entities, 0.016);
    
    // Total volume = local(0.5) * global(0.5) = 0.25
    expect(mockSound.volume).toHaveBeenCalledWith(0.25, 123);
  });

  it('should not play if out of range', () => {
    const transform = sourceEntity.getComponent<TransformComponent>('Transform')!;
    transform.x = 200; // Range is 100
    
    audioSystem.update(entities, 0.016);
    
    expect(mockAudioManager.playSfx).not.toHaveBeenCalled();
  });
});
