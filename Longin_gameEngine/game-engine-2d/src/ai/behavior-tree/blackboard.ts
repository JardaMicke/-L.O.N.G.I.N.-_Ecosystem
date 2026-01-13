/**
 * Shared data storage for the Behavior Tree.
 * Allows nodes to share information (variables) with each other.
 */
export class Blackboard {
  private data: Map<string, any> = new Map();

  /**
   * Sets a value in the blackboard.
   * 
   * @param {string} key - The key to store the value under.
   * @param {any} value - The value to store.
   */
  set(key: string, value: any): void {
    this.data.set(key, value);
  }

  /**
   * Retrieves a value from the blackboard.
   * 
   * @template T - The expected type of the value.
   * @param {string} key - The key to retrieve.
   * @returns {T} The value stored under the key.
   */
  get<T>(key: string): T {
    return this.data.get(key);
  }

  /**
   * Checks if a key exists in the blackboard.
   * 
   * @param {string} key - The key to check.
   * @returns {boolean} True if the key exists, false otherwise.
   */
  has(key: string): boolean {
    return this.data.has(key);
  }

  /**
   * Removes a value from the blackboard.
   * 
   * @param {string} key - The key to remove.
   */
  remove(key: string): void {
    this.data.delete(key);
  }
}
