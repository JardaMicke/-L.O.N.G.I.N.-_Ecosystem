/**
 * Priority levels for AI tasks
 */
export enum TaskPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Types of tasks available in the system
 */
export enum TaskType {
  IDLE = 'IDLE',
  MOVE_TO = 'MOVE_TO',
  GATHER = 'GATHER',
  ATTACK = 'ATTACK',
  DEFEND = 'DEFEND',
  BUILD = 'BUILD',
  PATROL = 'PATROL',
  SCOUT = 'SCOUT'
}

/**
 * Status of a task
 */
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

/**
 * Global game events relevant to AI
 */
export enum AIEventType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_FAILED = 'TASK_FAILED',
  
  UNIT_IDLE = 'UNIT_IDLE',
  UNIT_DAMAGED = 'UNIT_DAMAGED',
  
  GLOBAL_THREAT_CHANGED = 'GLOBAL_THREAT_CHANGED',
  DAY_NIGHT_CHANGE = 'DAY_NIGHT_CHANGE',
  SEASON_CHANGE = 'SEASON_CHANGE'
}
