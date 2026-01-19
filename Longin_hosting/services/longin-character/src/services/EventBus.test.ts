import { EventBus } from './EventBus';
import { Logger } from 'winston';

// Mock Logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
} as unknown as Logger;

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
    subscribe: jest.fn(),
    on: jest.fn()
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

  it('should publish message', async () => {
    await eventBus.publish('test.channel', { data: 'test' });
    // Since Redis is mocked, we verify logic flow
    expect(mockLogger.debug).toHaveBeenCalled();
  });
});
