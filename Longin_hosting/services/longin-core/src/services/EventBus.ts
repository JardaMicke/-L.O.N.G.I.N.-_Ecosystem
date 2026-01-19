import { createClient } from 'redis';
import { logger } from '../utils/logger';

export class EventBus {
  private static instance: EventBus;
  private publisher;
  private subscriber;

  private constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.publisher = createClient({ url: redisUrl });
    this.subscriber = createClient({ url: redisUrl });

    this.publisher.on('error', (err) => logger.error('Redis Publisher Error', err));
    this.subscriber.on('error', (err) => logger.error('Redis Subscriber Error', err));

    this.connect();
  }

  private async connect() {
    await this.publisher.connect();
    await this.subscriber.connect();
    logger.info('EventBus connected to Redis');
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public async publish(channel: string, message: any): Promise<void> {
    try {
      const payload = JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'longin-core',
        data: message
      });
      await this.publisher.publish(channel, payload);
      logger.debug(`Published to ${channel}:`, message);
    } catch (error) {
      logger.error(`Failed to publish to ${channel}:`, error);
    }
  }

  public async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel, (message) => {
        try {
          const parsed = JSON.parse(message);
          callback(parsed);
        } catch (err) {
          logger.error('Error parsing message', err);
        }
      });
      logger.info(`Subscribed to ${channel}`);
    } catch (error) {
      logger.error(`Failed to subscribe to ${channel}:`, error);
    }
  }
}
