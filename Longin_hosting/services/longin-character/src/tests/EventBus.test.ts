import { EventBus } from '../services/EventBus';
import { Logger } from 'winston';

// Mock Logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
    subscribe: jest.fn(),
    on: jest.fn(),
  }));
});

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus('redis://localhost:6379', mockLogger);
  });

  it('should be defined', () => {
    expect(eventBus).toBeDefined();
  });

  it('should attempt to publish a message', async () => {
    await eventBus.publish('test.channel', { data: 'test' });
    // Since we mocked Redis, we just ensure no error is thrown
    // and ideally check if logger.debug was called if we could inspect the mock implementation detail
    // But for basic unit test, verifying instantiation and method call is a good start.
    expect(mockLogger.debug).toHaveBeenCalled();
  });
});
