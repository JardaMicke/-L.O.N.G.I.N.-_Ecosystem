import { Logger } from '../utils/logger';

export type EventCallback<T = any> = (data: T) => void;

/**
 * Type-safe Event System implementation for handling global and local events.
 * Implements the Singleton pattern.
 */
export class EventSystem {
  private static instance: EventSystem;
  private listeners: Map<string, EventCallback[]>;

  private constructor() {
    this.listeners = new Map();
  }

  /**
   * Retrieves the singleton instance of the EventSystem.
   * @returns {EventSystem} The singleton instance.
   */
  public static getInstance(): EventSystem {
    if (!EventSystem.instance) {
      EventSystem.instance = new EventSystem();
    }
    return EventSystem.instance;
  }

  /**
   * Subscribes a callback function to a specific event.
   *
   * @template T - The type of data expected by the callback.
   * @param {string} event - The name of the event to subscribe to.
   * @param {EventCallback<T>} callback - The function to be called when the event is emitted.
   * @example
   * eventSystem.on<number>('score-updated', (newScore) => {
   *   console.log('Score:', newScore);
   * });
   */
  public on<T>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    // Logger.debug(`EventSystem: Subscribed to ${event}`);
  }

  /**
   * Unsubscribes a callback function from a specific event.
   *
   * @template T
   * @param {string} event - The name of the event.
   * @param {EventCallback<T>} callback - The callback function to remove.
   */
  public off<T>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);

    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emits an event, triggering all subscribed callbacks.
   *
   * @template T
   * @param {string} event - The name of the event to emit.
   * @param {T} [data] - Optional data to pass to subscribers.
   * @example
   * eventSystem.emit('score-updated', 100);
   */
  public emit<T>(event: string, data?: T): void {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event)!;
    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        Logger.error(`EventSystem: Error in listener for ${event}`, error as Error);
      }
    });
  }

  /**
   * Clears all event listeners.
   * Useful for resetting the state between tests or game sessions.
   */
  public clear(): void {
    this.listeners.clear();
  }
}
