/**
 * Simple Service Container for Dependency Injection.
 * Implements Singleton pattern to provide global access to services.
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance of the container.
   */
  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Register a service instance.
   * @param name Unique name/identifier for the service
   * @param service The service instance
   */
  public register<T>(name: string, service: T): void {
    if (this.services.has(name)) {
      console.warn(`Service ${name} is being overwritten in ServiceContainer.`);
    }
    this.services.set(name, service);
  }

  /**
   * Retrieve a service instance.
   * @param name Unique name/identifier of the service
   */
  public get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service not found: ${name}`);
    }
    return service as T;
  }

  /**
   * Check if a service is registered.
   */
  public has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Clear all services (useful for testing).
   */
  public reset(): void {
    this.services.clear();
  }
}
