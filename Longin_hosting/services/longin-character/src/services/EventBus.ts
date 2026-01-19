import { Redis } from 'ioredis';
import { Logger } from 'winston';

export class EventBus {
  private publisher: Redis;
  private subscriber: Redis;
  private logger: Logger;

  constructor(redisUrl: string, logger: Logger) {
    this.logger = logger;
    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);

    this.subscriber.on('message', (channel, message) => {
      this.handleMessage(channel, message);
    });
  }

  public async publish(channel: string, message: any): Promise<void> {
    try {
      const payload = JSON.stringify({
        timestamp: new Date().toISOString(),
        data: message
      });
      await this.publisher.publish(channel, payload);
      this.logger.debug(`Published to ${channel}:`, message);
    } catch (error) {
      this.logger.error(`Failed to publish to ${channel}:`, error);
    }
  }

  public async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.logger.info(`Subscribed to ${channel}`);
      // Store callback logic here if needed for specific channel routing
    } catch (error) {
      this.logger.error(`Failed to subscribe to ${channel}:`, error);
    }
  }

  private handleMessage(channel: string, message: string): void {
    try {
      const parsed = JSON.parse(message);
      this.logger.debug(`Received from ${channel}:`, parsed);
      // Dispatch to registered callbacks
    } catch (error) {
      this.logger.error('Error parsing message:', error);
    }
  }
}
