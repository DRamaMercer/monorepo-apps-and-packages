import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TaskQueueSystem,
  initializeTaskQueue,
  getTaskQueueSystem,
  TaskType,
  TaskPriority,
  TaskStatus,
  TaskData,
} from './taskQueue';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { createLogger } from '@monorepo/core';

// Mock dependencies
vi.mock('@monorepo/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@monorepo/core')>()),
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

vi.mock('../utils/environment', () => ({
  getOptionalEnv: vi.fn().mockReturnValue('redis://localhost:6379'), // Default mock for REDIS_URL
}));

// Mock ioredis
const mockRedisQuit = vi.fn();
const mockRedisDuplicate = vi.fn(() => mockRedisInstance); // Return the same instance for duplicate
const mockRedisInstance = {
  quit: mockRedisQuit,
  duplicate: mockRedisDuplicate,
  // Add any other methods ioredis client might use if needed by BullMQ internals directly
};
vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => mockRedisInstance),
}));

// Mock bullmq
const mockQueueAdd = vi.fn();
const mockQueueGetJob = vi.fn();
const mockQueueClose = vi.fn();
const mockWorkerOn = vi.fn();
const mockWorkerClose = vi.fn();

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: mockQueueAdd,
    getJob: mockQueueGetJob,
    close: mockQueueClose,
  })),
  Worker: vi.fn().mockImplementation(() => ({
    on: mockWorkerOn,
    close: mockWorkerClose,
  })),
  // Job class might be needed for type hints or if its static methods are used
  Job: vi.fn(),
}));


describe('TaskQueueSystem', () => {
  let taskQueue: TaskQueueSystem;

  beforeEach(async () => { // Make it async
    vi.clearAllMocks();
    // Resetting the singleton for taskQueueSystem
    vi.resetModules(); // This will allow re-importing and re-initializing the singleton
    // Re-import after reset to get fresh module state
    const { initializeTaskQueue: initQueue } = await import('./taskQueue');
    taskQueue = await initQueue(); // Initialize for each test to get a clean instance

    // Reset mock implementations for BullMQ Queue methods that return promises
    mockQueueAdd.mockReset();
    mockQueueGetJob.mockReset();
    mockQueueClose.mockReset();
    mockWorkerOn.mockReset();
    mockWorkerClose.mockReset();
  });

  describe('Constructor and Initialization', () => {
    it('should create Queue and Redis client with correct defaults', () => {
      expect(Redis).toHaveBeenCalledWith('redis://localhost:6379', { maxRetriesPerRequest: 3 });
      expect(Queue).toHaveBeenCalledWith('agent-orchestration', expect.any(Object));
    });
  });

  describe('addTask', () => {
    it('should add a task to the queue with correct parameters', async () => {
      const taskData: TaskData = { type: TaskType.CONTENT_GENERATION, payload: { prompt: 'test' } };
      const mockJobId = 'job-123';
      mockQueueAdd.mockResolvedValue({ id: mockJobId });

      const jobId = await taskQueue.addTask(taskData, TaskPriority.HIGH, 100);

      expect(jobId).toBe(mockJobId);
      expect(mockQueueAdd).toHaveBeenCalledWith(
        taskData.type,
        taskData,
        expect.objectContaining({
          priority: TaskPriority.HIGH,
          delay: 100,
          timeout: taskData.timeout || 60000,
          jobId: expect.stringContaining(taskData.type),
        })
      );
    });
  });

  describe('getTaskStatus', () => {
    it.each([
      ['waiting', TaskStatus.PENDING],
      ['delayed', TaskStatus.PENDING],
      ['active', TaskStatus.PROCESSING],
      ['completed', TaskStatus.COMPLETED],
      ['failed', TaskStatus.FAILED],
      ['retrying', TaskStatus.RETRYING], // Assuming 'retrying' maps to TaskStatus.RETRYING
    ])('should return correct TaskStatus for BullMQ state %s', async (bullState, expectedStatus) => {
      const mockJob = { getState: vi.fn().mockResolvedValue(bullState) };
      mockQueueGetJob.mockResolvedValue(mockJob);

      const status = await taskQueue.getTaskStatus('job-id');
      expect(status).toBe(expectedStatus);
    });

    it('should return null if job not found', async () => {
      mockQueueGetJob.mockResolvedValue(null);
      const status = await taskQueue.getTaskStatus('job-id');
      expect(status).toBeNull();
    });

    it('should return null for unknown BullMQ state', async () => {
      const mockJob = { getState: vi.fn().mockResolvedValue('unknown-state') };
      mockQueueGetJob.mockResolvedValue(mockJob);
      const status = await taskQueue.getTaskStatus('job-id');
      expect(status).toBeNull();
    });
  });

  describe('getTaskResult', () => {
    it('should return task result if job is completed', async () => {
      const mockJob = {
        getState: vi.fn().mockResolvedValue('completed'),
        returnvalue: { data: 'some result' }
      };
      mockQueueGetJob.mockResolvedValue(mockJob);

      const result = await taskQueue.getTaskResult('job-id');
      expect(result).toEqual({ success: true, data: { data: 'some result' } });
    });

    it('should return error if job is not completed', async () => {
      const mockJob = { getState: vi.fn().mockResolvedValue('active') };
      mockQueueGetJob.mockResolvedValue(mockJob);

      const result = await taskQueue.getTaskResult('job-id');
      expect(result).toEqual({ success: false, error: 'Job is not completed. Current state: active' });
    });

    it('should return null if job not found', async () => {
      mockQueueGetJob.mockResolvedValue(null);
      const result = await taskQueue.getTaskResult('job-id');
      expect(result).toBeNull();
    });
  });

  describe('cancelTask', () => {
    it('should cancel a task if it is in a cancellable state (waiting)', async () => {
      const mockJob = { getState: vi.fn().mockResolvedValue('waiting'), remove: vi.fn().mockResolvedValue(undefined) };
      mockQueueGetJob.mockResolvedValue(mockJob);

      const success = await taskQueue.cancelTask('job-id');
      expect(success).toBe(true);
      expect(mockJob.remove).toHaveBeenCalled();
    });

    it('should cancel a task if it is in a cancellable state (delayed)', async () => {
      const mockJob = { getState: vi.fn().mockResolvedValue('delayed'), remove: vi.fn().mockResolvedValue(undefined) };
      mockQueueGetJob.mockResolvedValue(mockJob);

      const success = await taskQueue.cancelTask('job-id');
      expect(success).toBe(true);
      expect(mockJob.remove).toHaveBeenCalled();
    });

    it('should not cancel if task is not in a cancellable state', async () => {
      const mockJob = { getState: vi.fn().mockResolvedValue('active'), remove: vi.fn() };
      mockQueueGetJob.mockResolvedValue(mockJob);

      const success = await taskQueue.cancelTask('job-id');
      expect(success).toBe(false);
      expect(mockJob.remove).not.toHaveBeenCalled();
    });

    it('should return false if job not found for cancellation', async () => {
      mockQueueGetJob.mockResolvedValue(null);
      const success = await taskQueue.cancelTask('job-id');
      expect(success).toBe(false);
    });
  });

  describe('registerProcessor', () => {
    it('should register a processor and create a worker', () => {
      const mockProcessor = vi.fn().mockResolvedValue({ result: 'processed' });
      taskQueue.registerProcessor(TaskType.CONTENT_GENERATION, mockProcessor, 2);

      expect(Worker).toHaveBeenCalledWith(
        'agent-orchestration',
        expect.any(Function), // The processor function wrapper
        expect.objectContaining({
          connection: mockRedisInstance, // Expecting the duplicated Redis instance
          concurrency: 2,
          lockDuration: 30000,
        })
      );
      expect(mockWorkerOn).toHaveBeenCalledWith('completed', expect.any(Function));
      expect(mockWorkerOn).toHaveBeenCalledWith('failed', expect.any(Function));
    });

    // Further tests could simulate job processing by the worker,
    // but that would require more intricate mocking of BullMQ's Worker internals or job lifecycle.
  });

  describe('shutdown', () => {
    it('should close workers, queue, and redis client', async () => {
      // Register a dummy processor to create a worker instance to be closed
      taskQueue.registerProcessor(TaskType.ANALYTICS_PROCESSING, vi.fn());

      await taskQueue.shutdown();

      expect(mockWorkerClose).toHaveBeenCalled();
      expect(mockQueueClose).toHaveBeenCalled();
      expect(mockRedisQuit).toHaveBeenCalled();
    });
  });

  describe('Singleton Logic (initializeTaskQueue, getTaskQueueSystem)', () => {
     beforeEach(() => {
        vi.resetModules(); // Reset modules to test singleton behavior
     });

    it('getTaskQueueSystem should throw if not initialized', async () => {
      const { getTaskQueueSystem: getQueue } = await import('./taskQueue');
      expect(() => getQueue()).toThrow('Task Queue System not initialized');
    });

    it('initializeTaskQueue should create and return an instance', async () => {
      const { initializeTaskQueue: initQueue, getTaskQueueSystem: getQueue, TaskQueueSystem: TQS } = await import('./taskQueue');
      const queue = await initQueue();
      expect(queue).toBeInstanceOf(TQS);
      expect(getQueue()).toBe(queue);
    });

     it('initializeTaskQueue should return existing instance if already initialized', async () => {
      const { initializeTaskQueue: initQueue } = await import('./taskQueue');
      const queue1 = await initQueue();
      const queue2 = await initQueue();
      expect(queue2).toBe(queue1);
    });
  });
});
