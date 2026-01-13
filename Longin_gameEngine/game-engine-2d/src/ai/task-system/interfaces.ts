import { TaskPriority, TaskType, TaskStatus } from '../ai-enums';
import { Entity } from '../../ecs/entity';

/**
 * Definition of a Task in the system
 */
export interface Task {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  assigneeId?: string; // Entity ID
  targetId?: string;   // Entity ID (optional target)
  targetPosition?: { x: number, y: number }; // Optional position
  status: TaskStatus;
  
  // Requirements
  requiredCapabilities?: string[];
  timeLimit?: number; // milliseconds
  creationTime: number;
  
  // Custom data payload
  data?: any;
}

/**
 * Interface for the Task Allocator
 */
export interface ITaskAllocator {
  assignTask(task: Task, candidates: Entity[]): boolean;
  evaluateSuitability(task: Task, candidate: Entity): number; // 0-1 score
}
