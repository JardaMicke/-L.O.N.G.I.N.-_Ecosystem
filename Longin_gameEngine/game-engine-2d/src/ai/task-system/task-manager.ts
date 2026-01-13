import { System } from '../../ecs/system';
import { Entity } from '../../ecs/entity';
import { TaskComponent } from './task-component';
import { Task, ITaskAllocator } from './interfaces';
import { TaskPriority, AIEventType, TaskStatus } from '../ai-enums';
import { EventSystem } from '../../core/event-system';
import { Logger } from '../../utils/logger';

/**
 * System responsible for managing the lifecycle of tasks and assigning them to agents.
 */
export class TaskManager extends System implements ITaskAllocator {
  private pendingTasks: Task[] = [];
  private activeTasks: Map<string, Task> = new Map(); // TaskId -> Task
  
  constructor() {
    super();
    this.requiredComponents = ['TaskComponent'];
    
    // Subscribe to task creation events
    EventSystem.getInstance().on(AIEventType.TASK_CREATED, (task: Task) => {
      this.addTask(task);
    });
  }

  public update(entities: Entity[], deltaTime: number): void {
    // 1. Assign pending tasks
    this.assignPendingTasks(entities);

    // 2. Monitor active tasks
    this.monitorTasks(entities, deltaTime);
  }

  /**
   * Adds a new task to the pool
   */
  public addTask(task: Task): void {
    task.status = TaskStatus.PENDING;
    task.creationTime = Date.now();
    this.pendingTasks.push(task);
    // Sort by priority (High priority first)
    this.pendingTasks.sort((a, b) => b.priority - a.priority);
    Logger.info(`TaskManager: Added task ${task.id} (${task.type})`);
  }

  /**
   * Attempt to assign pending tasks to available entities
   */
  private assignPendingTasks(entities: Entity[]): void {
    if (this.pendingTasks.length === 0) return;

    // Filter available agents
    const availableAgents = entities.filter(e => {
      const taskComp = e.getComponent<TaskComponent>('TaskComponent'); // Assuming getComponent exists and works this way
      return taskComp && !taskComp.currentTask;
    });

    if (availableAgents.length === 0) return;

    // Iterate through tasks and try to find an agent
    // Using a reverse loop to allow removal
    for (let i = this.pendingTasks.length - 1; i >= 0; i--) {
      const task = this.pendingTasks[i];
      let bestAgent: Entity | null = null;
      let bestScore = -1;

      for (const agent of availableAgents) {
        const score = this.evaluateSuitability(task, agent);
        if (score > bestScore && score > 0) {
          bestScore = score;
          bestAgent = agent;
        }
      }

      if (bestAgent) {
        if (this.assignTask(task, [bestAgent])) { // passing array to match interface, but using logic here
           this.pendingTasks.splice(i, 1);
           // Remove agent from available list for this frame
           const index = availableAgents.indexOf(bestAgent);
           if (index > -1) availableAgents.splice(index, 1);
        }
      }
    }
  }

  /**
   * Interface implementation for assignment
   */
  public assignTask(task: Task, candidates: Entity[]): boolean {
    if (candidates.length === 0) return false;
    
    // In this simple implementation, we assume candidates[0] is the chosen one
    const agent = candidates[0];
    const taskComp = agent.getComponent<TaskComponent>('TaskComponent');
    
    if (taskComp) {
      task.assigneeId = agent.id;
      task.status = TaskStatus.IN_PROGRESS;
      taskComp.assignTask(task);
      this.activeTasks.set(task.id, task);
      
      EventSystem.getInstance().emit(AIEventType.TASK_ASSIGNED, { taskId: task.id, agentId: agent.id });
      return true;
    }
    return false;
  }

  /**
   * Heuristic to determine how good an agent is for a task
   */
  public evaluateSuitability(task: Task, candidate: Entity): number {
    const taskComp = candidate.getComponent<TaskComponent>('TaskComponent');
    if (!taskComp) return 0;

    // Check required capabilities
    if (task.requiredCapabilities) {
      for (const cap of task.requiredCapabilities) {
        if (!taskComp.hasCapability(cap)) return 0;
      }
    }

    // Distance calculation could go here if we had positions
    // For now, return base efficiency
    return taskComp.efficiency;
  }

  private monitorTasks(entities: Entity[], deltaTime: number): void {
    const now = Date.now();
    
    for (const entity of entities) {
      const taskComp = entity.getComponent<TaskComponent>('TaskComponent');
      if (!taskComp || !taskComp.currentTask) continue;

      const task = taskComp.currentTask;

      // Check time limit
      if (task.timeLimit && (now - task.creationTime > task.timeLimit)) {
        this.failTask(task, 'Time limit exceeded');
        taskComp.clearCurrentTask();
      }
      
      // Additional monitoring logic can go here
    }
  }

  private failTask(task: Task, reason: string): void {
    task.status = TaskStatus.FAILED;
    this.activeTasks.delete(task.id);
    EventSystem.getInstance().emit(AIEventType.TASK_FAILED, { taskId: task.id, reason });
    Logger.warn(`Task ${task.id} failed: ${reason}`);
    
    // Logic to re-add to pending if it's retryable could go here
  }
}
