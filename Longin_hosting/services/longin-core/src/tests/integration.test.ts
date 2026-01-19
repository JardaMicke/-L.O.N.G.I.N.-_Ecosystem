import { createClient } from 'redis';

describe('Integration Test: Event Bus', () => {
  let publisher: any;
  let subscriber: any;
  const CHANNEL = 'test.integration';

  beforeAll(async () => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    publisher = createClient({ url: redisUrl });
    subscriber = createClient({ url: redisUrl });
    await publisher.connect();
    await subscriber.connect();
  });

  afterAll(async () => {
    await publisher.quit();
    await subscriber.quit();
  });

  it('should send and receive messages via Redis', (done) => {
    subscriber.subscribe(CHANNEL, (message: string) => {
      try {
        const parsed = JSON.parse(message);
        expect(parsed.data).toBe('Hello Integration');
        done();
      } catch (error) {
        done(error);
      }
    });

    // Wait a bit for subscription to activate
    setTimeout(async () => {
      await publisher.publish(CHANNEL, JSON.stringify({ data: 'Hello Integration' }));
    }, 100);
  });
});
