import { Profiler } from '../../src/debug/profiler';

describe('Profiler', () => {
  let profiler: Profiler;

  beforeEach(() => {
    profiler = Profiler.getInstance();
  });

  test('should measure frame time', () => {
    // Mock performance.now
    const originalNow = performance.now;

    let time = 1000;
    global.performance.now = jest.fn(() => time);

    profiler.startFrame();
    time = 1016; // 16ms elapsed
    profiler.endFrame();

    expect(profiler.frameTime).toBe(16);

    // Restore
    global.performance.now = originalNow;
  });

  test('should update FPS after 1 second', () => {
    const originalNow = performance.now;
    let time = 1000;
    global.performance.now = jest.fn(() => time);

    // Reset state (hacky for singleton)
    (profiler as any).frames = 0;
    (profiler as any).lastFpsUpdate = 1000;

    // Simulate 60 frames
    for (let i = 0; i < 60; i++) {
      profiler.startFrame();
      time += 16;
      profiler.endFrame();
    }

    // Time is now 1000 + 60*16 = 1960. Not yet 1 second (2000).
    // Trigger one more frame to pass 2000
    time = 2001;
    profiler.endFrame();

    // Should have updated FPS
    expect(profiler.fps).toBeGreaterThan(0);

    global.performance.now = originalNow;
  });
});
