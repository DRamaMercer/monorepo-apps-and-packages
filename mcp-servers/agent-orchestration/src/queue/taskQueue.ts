import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { getOptionalEnv } from '../utils/environment';

// Task types supported by the orchestration layer
export enum TaskType {
  CONTENT_GENERATION = 'content_generation',
  CONTEXT_VALIDATION = 'context_validation',
  ASSET_MANAGEMENT = 'asset_management',
  ANALYTICS_PROCESSING = 'analytics_processing',
  WORKFLOW_EXECUTION = 'workflow_execution',
  AGENT_COMMUNICATION = 'agent_communication'
}

// Priority levels for tasks
export enum TaskPriority {
  LOW = 1,
  MEDIUM = 5,
  HIGH = 10,
  CRITICAL = 20
}

// Task status values
export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled'
}

// Interface for task data
export interface TaskData {
  type: TaskType;
  payload: Record<string, any>;
  brandContext?: string;
  timeout?: number;
  dependsOn?: string[];
}

// Interface for task result
export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Task Queue System class
export class TaskQueueSystem {
  private redisClient: Redis;
  private queue: Queue;
  private workers: Map<string, Worker> = new Map();
  private processorMap: Map<TaskType, (job: Job) => Promise<any>> = new Map();

  constructor() {
    const redisUrl = getOptionalEnv('REDIS_URL', 'redis://localhost:6379');
    
    this.redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3
    });
    
    this.queue = new Queue('agent-orchestration', {
      connection: this.redisClient,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: 100, // Keep the last 100 completed jobs
        removeOnFail: 200 // Keep the last 200 failed jobs
      }
    });
    
    logger.info('Task Queue System created');
  }

  /**
   * Register a task processor function for a specific task type
   */
  public registerProcessor(
    taskType: TaskType,
    processor: (job: Job) => Promise<any>,
    concurrency = 1
  ): void {
    this.processorMap.set(taskType, processor);
    
    // Create a worker for this task type
    const worker = new Worker(
      'agent-orchestration',
      async (job) => {
        if (job.data.type === taskType) {
          logger.info(`Processing job ${job.id} of type ${taskType}`);
          return processor(job);
        }
        throw new Error(`Worker for ${taskType} received job of type ${job.data.type}`);
      },
      {
        connection: this.redisClient.duplicate(),
        concurrency,
        lockDuration: 30000, // 30 seconds
      }
    );
    
    // Handle worker events
    worker.on('completed', (job) => {
      logger.info(`Job ${job.id} of type ${taskType} completed successfully`);
    });
    
    worker.on('failed', (job, error) => {
      logger.error(`Job ${job?.id} of type ${taskType} failed:`, error);
    });
    
    this.workers.set(taskType, worker);
    logger.info(`Registered processor for task type: ${taskType}`);
  }

  /**
   * Add a task to the queue
   */
  public async addTask(
    taskData: TaskData,
    priority: TaskPriority = TaskPriority.MEDIUM,
    delay: number = 0
  ): Promise<string> {
    const job = await this.queue.add(taskData.type, taskData, {
      priority,
      delay,
      timeout: taskData.timeout || 60000, // Default timeout of 60 seconds
      jobId: `${taskData.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    });
    
    logger.info(`Added job ${job.id} of type ${taskData.type} to queue`);
    return job.id as string;
  }

  /**
   * Get the status of a task
   */
  public async getTaskStatus(jobId: string): Promise<TaskStatus | null> {
    const job = await this.queue.getJob(jobId);
    
    if (!job) {
      return null;
    }
    
    const state = await job.getState();
    
    switch (state) {
      case 'waiting':
      case 'delayed':
        return TaskStatus.PENDING;
      case 'active':
        return TaskStatus.PROCESSING;
      case 'completed':
        return TaskStatus.COMPLETED;
      case 'failed':
        return TaskStatus.FAILED;
      case 'retrying':
        return TaskStatus.RETRYING;
      default:
        return null;
    }
  }

  /**
   * Get the result of a completed task
   */
  public async getTaskResult(jobId: string): Promise<TaskResult | null> {
    const job = await this.queue.getJob(jobId);
    
    if (!job) {
      return null;
    }
    
    // Check if job is completed
    const state = await job.getState();
    if (state !== 'completed') {
      return {
        success: false,
        error: `Job is not completed. Current state: ${state}`
      };
    }
    
    return {
      success: true,
      data: job.returnvalue
    };
  }

  /**
   * Cancel a pending task
   */
  public async cancelTask(jobId: string): Promise<boolean> {
    const job = await this.queue.getJob(jobId);
    
    if (!job) {
      return false;
    }
    
    const state = await job.getState();
    
    if (state === 'waiting' || state === 'delayed') {
      await job.remove();
      logger.info(`Cancelled job ${jobId}`);
      return true;
    }
    
    logger.warn(`Cannot cancel job ${jobId} in state ${state}`);
    return false;
  }

  /**
   * Graceful shutdown of the task queue system
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Task Queue System...');
    
    // Close all workers
    for (const [type, worker] of this.workers.entries()) {
      logger.info(`Closing worker for ${type}...`);
      await worker.close();
    }
    
    // Close the queue
    await this.queue.close();
    
    // Close Redis connection
    await this.redisClient.quit();
    
    logger.info('Task Queue System shut down successfully');
  }
}

// Singleton instance
let taskQueueSystem: TaskQueueSystem | null = null;

/**
 * Initialize the task queue system
 */
export async function initializeTaskQueue(): Promise<TaskQueueSystem> {
  if (!taskQueueSystem) {
    taskQueueSystem = new TaskQueueSystem();
    
    // Register default processors here if needed
    // Example:
    // taskQueueSystem.registerProcessor(
    //   TaskType.CONTENT_GENERATION,
    //   async (job) => {
    //     // Process content generation task
    //     return { result: 'Content generated' };
    //   },
    //   2 // Concurrency
    // );
  }
  
  return taskQueueSystem;
}

/**
 * Get the task queue system instance
 */
export function getTaskQueueSystem(): TaskQueueSystem {
  if (!taskQueueSystem) {
    throw new Error('Task Queue System not initialized. Call initializeTaskQueue() first.');
  }
  
  return taskQueueSystem;
}
