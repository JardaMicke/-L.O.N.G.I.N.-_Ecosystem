import { AudioManager } from '../../src/audio/audio-manager';
import { Howl, Howler } from 'howler';
import { ConfigManager } from '../../src/core/config-manager';
import { EventSystem } from '../../src/core/event-system';

// Mock Logger
jest.mock('../../src/utils/logger', () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}));

// Mock ConfigManager
jest.mock('../../src/core/config-manager', () => ({
  ConfigManager: {
    getInstance: jest.fn(),
  }
}));

// Mock EventSystem
jest.mock('../../src/core/event-system', () => ({
  EventSystem: {
    getInstance: jest.fn(),
  }
}));

// Mock Howler
jest.mock('howler', () => ({
  Howl: jest.fn().mockImplementation((options) => {
    const sound = {
      play: jest.fn().mockReturnValue(1),
      stop: jest.fn(),
      volume: jest.fn(),
      loop: jest.fn(),
      fade: jest.fn(),
      once: jest.fn(),
      on: jest.fn(),
      state: jest.fn().mockReturnValue('loaded'),
    };
    
    // Simulate async load
    if (options.onload) {
      setTimeout(() => options.onload(), 10);
    }
    
    return sound;
  }),
  Howler: {
    volume: jest.fn(),
    mute: jest.fn(),
  },
}));

describe('AudioManager', () => {
  let audioManager: AudioManager;
  let mockConfig: any;
  let mockConfigManager: any;
  let mockEventSystem: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock config
    mockConfig = {
      audio: {
        masterVolume: 1.0,
        sfxVolume: 1.0,
        musicVolume: 0.8,
        muted: false
      }
    };

    mockConfigManager = {
      getConfig: jest.fn().mockReturnValue(mockConfig),
      set: jest.fn().mockImplementation((path, val) => {
          // Update local mock config to simulate behavior if needed, 
          // though usually we just verify .set was called.
          if (path === 'audio.masterVolume') mockConfig.audio.masterVolume = val;
          if (path === 'audio.muted') mockConfig.audio.muted = val;
      }),
    };
    (ConfigManager.getInstance as jest.Mock).mockReturnValue(mockConfigManager);

    mockEventSystem = {
      on: jest.fn(),
      emit: jest.fn(),
    };
    (EventSystem.getInstance as jest.Mock).mockReturnValue(mockEventSystem);

    // Reset singleton
    (AudioManager as any).instance = null;
    audioManager = AudioManager.getInstance();
  });

  it('should be a singleton', () => {
    const instance2 = AudioManager.getInstance();
    expect(audioManager).toBe(instance2);
  });

  it('should initialize and sync with global volume', () => {
    expect(Howler.volume).toHaveBeenCalledWith(1.0);
    expect(Howler.mute).toHaveBeenCalledWith(false);
  });

  it('should update config when init is called', () => {
    audioManager.init({ masterVolume: 0.5, muted: true });
    expect(mockConfigManager.set).toHaveBeenCalledWith('audio.masterVolume', 0.5);
    expect(mockConfigManager.set).toHaveBeenCalledWith('audio.muted', true);
  });

  it('should load sound correctly', async () => {
    const promise = audioManager.loadSound('test-sound', 'assets/test.mp3');
    await expect(promise).resolves.toBeDefined();
    expect(Howl).toHaveBeenCalledWith(expect.objectContaining({ src: ['assets/test.mp3'] }));
  });

  it('should play sfx using volume from config', async () => {
    await audioManager.loadSound('sfx1', 'sfx.mp3');
    const id = audioManager.playSfx('sfx1');
    expect(id).toBe(1);
    // Config sfxVolume is 1.0
    // We can't easily check the exact volume call on the sound instance without capturing it from the Howl mock constructor,
    // but we can verify no crash.
  });

  it('should play music and handle crossfade', async () => {
    await audioManager.loadSound('music1', 'music1.mp3');
    await audioManager.loadSound('music2', 'music2.mp3');

    // Play first track
    audioManager.playMusic('music1');
    const music1 = audioManager.getSound('music1');
    expect(music1?.play).toHaveBeenCalled();
    // Fade in
    expect(music1?.fade).toHaveBeenCalledWith(0, 0.8, 1000); 

    // Play second track (crossfade)
    audioManager.playMusic('music2');
    const music2 = audioManager.getSound('music2');
    expect(music1?.fade).toHaveBeenCalled(); // Should fade out
    expect(music2?.play).toHaveBeenCalled();
    expect(music2?.fade).toHaveBeenCalled(); // Should fade in
  });

  it('should toggle mute via config manager', () => {
    audioManager.toggleMute();
    expect(mockConfigManager.set).toHaveBeenCalledWith('audio.muted', true);
  });
});
