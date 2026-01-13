import { System } from '../ecs/system';
import { Entity } from '../ecs/entity';
import { AudioSourceComponent, AudioListenerComponent } from './components';
import { TransformComponent } from '../core/components';
import { AudioManager } from './audio-manager';
import { EntityManager } from '../ecs/entity-manager';

/**
 * ECS System for handling spatial audio.
 * Updates volume and panning of AudioSourceComponents based on their position relative to the AudioListener.
 */
export class AudioSystem extends System {
  private audioManager: AudioManager;

  /**
   * Creates a new AudioSystem.
   */
  constructor() {
    super();
    this.audioManager = AudioManager.getInstance();
  }

  /**
   * Updates audio sources based on listener position.
   * 
   * @param {Entity[]} entities - All entities in the ECS.
   * @param {number} deltaTime - Time elapsed since last frame.
   */
  public update(entities: Entity[], deltaTime: number): void {
    const listeners = entities.filter(e => e.hasComponent('AudioListener') && e.hasComponent('Transform'));
    const sources = entities.filter(e => e.hasComponent('AudioSource') && e.hasComponent('Transform'));

    if (listeners.length === 0) return;

    // Assume first listener is the main one (e.g. camera or player)
    const listener = listeners[0];
    const listenerTransform = listener.getComponent<TransformComponent>('Transform')!;

    for (const sourceEntity of sources) {
      const audioSource = sourceEntity.getComponent<AudioSourceComponent>('AudioSource')!;
      const sourceTransform = sourceEntity.getComponent<TransformComponent>('Transform')!;

      this.processAudioSource(audioSource, sourceTransform, listenerTransform);
    }
  }

  /**
   * Calculates volume and pan for a single audio source.
   * 
   * @param {AudioSourceComponent} source - The audio source component.
   * @param {TransformComponent} sourceTransform - Position of the source.
   * @param {TransformComponent} listenerTransform - Position of the listener.
   */
  private processAudioSource(
    source: AudioSourceComponent,
    sourceTransform: TransformComponent,
    listenerTransform: TransformComponent
  ): void {
    const dx = sourceTransform.x - listenerTransform.x;
    const dy = sourceTransform.y - listenerTransform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Simple volume attenuation
    // If distance > range, volume = 0
    let volume = 0;
    if (distance < source.range) {
       volume = (1 - distance / source.range) * source.volume;
    }

    // Simple stereo panning
    // -1 (left) to 1 (right)
    // We assume range/2 is the point of max pan
    const pan = Math.max(-1, Math.min(1, dx / (source.range / 2)));

    if (!source.isPlaying) {
      if (source.loop && volume > 0) {
        const id = this.audioManager.playSfx(source.soundKey, volume);
        if (id !== null) {
          source.playId = id;
          source.isPlaying = true;
          
          const sound = this.audioManager.getSound(source.soundKey);
          if (sound) {
             sound.loop(true, id);
             sound.stereo(pan, id);
          }
        }
      }
    } else if (source.playId !== null) {
      const sound = this.audioManager.getSound(source.soundKey);
      if (sound) {
        sound.volume(volume * this.audioManager.getSfxVolume(), source.playId);
        sound.stereo(pan, source.playId);
        
        // Optional: Pause if out of range to save CPU?
        // For now, keep playing at volume 0
      }
    }
  }
}
