import { Component } from '../../ecs/component';
import { Task } from './interfaces';

/**
 * Component that holds the current tasks for an entity.
 * Manages the current task, the task queue, and the entity's capabilities.
 */
export class TaskComponent extends Component {
  public readonly name: string = 'TaskComponent';
  
  /** The currently active task, or null if idle. */
  public currentTask: Task | null = null;
  
  /** Queue of pending tasks, sorted by priority. */
  public taskQueue: Task[] = [];
  
  /** List of capabilities this entity possesses (e.g., 'can_gather', 'can_fight'). */
  public capabilities: string[] = [];
  
  /** Efficiency multiplier for performing tasks (default 1.0). */
  public efficiency: number = 1.0;

  /**
   * Assigns a new task to the entity.
   * If no task is currently active, it becomes the current task.
   * Otherwise, it is added to the queue and sorted by priority.
   * 
   * @param {Task} task - The task to assign.
   */
  public assignTask(task: Task): void {
    if (!this.currentTask) {
      this.currentTask = task;
    } else {
      this.taskQueue.push(task);
      this.taskQueue.sort((a, b) => b.priority - a.priority);
    }
  }

  /**
   * Clears the current task and removes it from the component.
   * This is typically called when a task is completed or aborted.
   */
  public clearCurrentTask(): void {
    this.currentTask = null;
  }

  /**
   * Checks if the entity has a specific capability.
   * 
   * @param {string} capability - The capability to check for.
   * @returns {boolean} True if the entity has the capability, false otherwise.
   */
  public hasCapability(capability: string): boolean {
    return this.capabilities.includes(capability);
  }
}
