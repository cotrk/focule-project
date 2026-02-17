/**
 * Enhanced CPU throttling utility with priority-based task scheduling
 * Optimizes performance for video processing workflows
 */

import { EventEmitter } from 'events';

interface Task {
  id: string;
  operation: () => Promise<unknown>;
  priority: 'high' | 'medium' | 'low';
  timeout?: number;
  retries?: number;
  onProgress?: (progress: number) => void;
}

interface TaskQueue {
  high: Task[];
  medium: Task[];
  low: Task[];
}

interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeTasks: number;
  queuedTasks: number;
  averageExecutionTime: number;
}

export class EnhancedCPUThrottler extends EventEmitter {
  private queue: TaskQueue = { high: [], medium: [], low: [] };
  private activeTasks = new Map<string, Task>();
  private maxConcurrentTasks = 2;
  private maxCpuUsage = 70; // Maximum CPU usage percentage
  private metrics: PerformanceMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    activeTasks: 0,
    queuedTasks: 0,
    averageExecutionTime: 0
  };
  private executionTimes: number[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.startMonitoring();
    this.startProcessing();
  }

  /**
   * Execute a task with CPU throttling and priority scheduling
   */
  async execute<T>(task: Task): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask: Task = {
        ...task,
        operation: async () => {
          const startTime = Date.now();
          try {
            const result = await task.operation();
            const executionTime = Date.now() - startTime;
            this.recordExecutionTime(executionTime);
            this.emit('taskCompleted', task.id, executionTime);
            return result;
          } catch (error) {
            this.emit('taskFailed', task.id, error);
            throw error;
          }
        }
      };

      // Add to appropriate priority queue
      this.queue[task.priority].push(wrappedTask);
      this.updateMetrics();
      
      // Set up timeout if specified
      if (task.timeout) {
        setTimeout(() => {
          if (this.activeTasks.has(task.id)) {
            this.activeTasks.delete(task.id);
            reject(new Error(`Task ${task.id} timed out after ${task.timeout}ms`));
          }
        }, task.timeout);
      }

      // Listen for completion
      this.once(`taskCompleted:${task.id}`, (result: T) => {
        resolve(result);
      });

      this.once(`taskFailed:${task.id}`, (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateSystemMetrics();
      this.adjustThrottling();
    }, 1000);
  }

  /**
   * Start task processing loop
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 100);
  }

  /**
   * Process tasks from queue based on priority and system resources
   */
  private async processQueue(): Promise<void> {
    // Check if we can start new tasks
    if (this.activeTasks.size >= this.maxConcurrentTasks) {
      return;
    }

    // Check CPU usage
    if (this.metrics.cpuUsage > this.maxCpuUsage) {
      return;
    }

    // Get next task by priority
    const nextTask = this.getNextTask();
    if (!nextTask) {
      return;
    }

    // Start task execution
    this.activeTasks.set(nextTask.id, nextTask);
    this.updateMetrics();

    try {
      const result = await nextTask.operation();
      this.emit(`taskCompleted:${nextTask.id}`, result);
    } catch (error) {
      this.emit(`taskFailed:${nextTask.id}`, error);
    } finally {
      this.activeTasks.delete(nextTask.id);
      this.updateMetrics();
    }
  }

  /**
   * Get next task from queue by priority
   */
  private getNextTask(): Task | undefined {
    if (this.queue.high.length > 0) {
      return this.queue.high.shift();
    }
    if (this.queue.medium.length > 0) {
      return this.queue.medium.shift();
    }
    if (this.queue.low.length > 0) {
      return this.queue.low.shift();
    }
    return undefined;
  }

  /**
   * Update system performance metrics
   */
  private updateSystemMetrics(): void {
    const memoryUsage = process.memoryUsage();
    this.metrics.memoryUsage = memoryUsage.rss / 1024 / 1024; // MB
    
    // Calculate queued tasks
    this.metrics.queuedTasks = 
      this.queue.high.length + 
      this.queue.medium.length + 
      this.queue.low.length;
    
    // CPU usage would be calculated from system metrics
    // For now, we'll estimate based on active tasks
    this.metrics.cpuUsage = Math.min(this.activeTasks.size * 35, 100);
    
    this.emit('metricsUpdated', this.metrics);
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    this.metrics.activeTasks = this.activeTasks.size;
    this.metrics.queuedTasks = 
      this.queue.high.length + 
      this.queue.medium.length + 
      this.queue.low.length;
    
    if (this.executionTimes.length > 0) {
      this.metrics.averageExecutionTime = 
        this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length;
    }
  }

  /**
   * Record task execution time
   */
  private recordExecutionTime(time: number): void {
    this.executionTimes.push(time);
    // Keep only last 50 execution times
    if (this.executionTimes.length > 50) {
      this.executionTimes.shift();
    }
  }

  /**
   * Adjust throttling based on system performance
   */
  private adjustThrottling(): void {
    // Reduce concurrent tasks if CPU usage is high
    if (this.metrics.cpuUsage > 80) {
      this.maxConcurrentTasks = 1;
    } else if (this.metrics.cpuUsage > 60) {
      this.maxConcurrentTasks = 2;
    } else {
      this.maxConcurrentTasks = 3;
    }

    // Reduce CPU threshold if memory usage is high
    if (this.metrics.memoryUsage > 300) { // 300MB
      this.maxCpuUsage = 50;
    } else {
      this.maxCpuUsage = 70;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): TaskQueue {
    return {
      high: [...this.queue.high],
      medium: [...this.queue.medium],
      low: [...this.queue.low]
    };
  }

  /**
   * Clear all queues
   */
  clearQueues(): void {
    this.queue = { high: [], medium: [], low: [] };
    this.updateMetrics();
  }

  /**
   * Shutdown throttler
   */
  shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    this.clearQueues();
    this.activeTasks.clear();
  }
}

// Global instance
export const enhancedCPUThrottler = new EnhancedCPUThrottler();
