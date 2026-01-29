/**
 * Process pool manager for optimizing external tool execution
 * Prevents resource exhaustion and improves performance
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

interface ProcessTask {
  id: string;
  command: string;
  args: string[];
  options: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timeout?: number;
}

interface PooledProcess {
  process: ChildProcess;
  busy: boolean;
  createdAt: number;
  lastUsed: number;
  taskCount: number;
}

export class ProcessPoolManager extends EventEmitter {
  private pools: Map<string, PooledProcess[]> = new Map();
  private maxPoolSize = 3;
  private maxProcessAge = 10 * 60 * 1000; // 10 minutes
  private maxIdleTime = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    super();
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleProcesses();
    }, 60000); // Check every minute
  }

  /**
   * Execute a command using the process pool
   */
  async execute(
    poolKey: string,
    command: string,
    args: string[],
    options: any = {},
    timeout: number = 300000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const task: ProcessTask = {
        id: Math.random().toString(36).substr(2, 9),
        command,
        args,
        options,
        resolve,
        reject,
        timeout
      };

      this.executeTask(poolKey, task);
    });
  }

  private async executeTask(poolKey: string, task: ProcessTask): Promise<void> {
    const process = await this.getOrCreateProcess(poolKey);
    
    if (process.busy) {
      // Wait for available process
      setTimeout(() => this.executeTask(poolKey, task), 100);
      return;
    }

    process.busy = true;
    process.lastUsed = Date.now();
    process.taskCount++;

    console.log(`[ProcessPool] Executing task ${task.id} with ${poolKey}`);

    // Set up timeout
    const timeoutHandle = setTimeout(() => {
      this.cleanupProcess(process);
      task.reject(new Error(`Process timeout after ${task.timeout}ms`));
    }, task.timeout);

    try {
      // Execute the task
      const result = await this.runTask(process.process, task);
      clearTimeout(timeoutHandle);
      process.busy = false;
      task.resolve(result);
    } catch (error) {
      clearTimeout(timeoutHandle);
      this.cleanupProcess(process);
      task.reject(error as Error);
    }
  }

  private async getOrCreateProcess(poolKey: string): Promise<PooledProcess> {
    let pool = this.pools.get(poolKey);
    
    if (!pool) {
      pool = [];
      this.pools.set(poolKey, pool);
    }

    // Find available process
    let availableProcess = pool.find(p => !p.busy);
    
    if (!availableProcess) {
      // Create new process if under limit
      if (pool.length < this.maxPoolSize) {
        availableProcess = await this.createProcess(poolKey);
        pool.push(availableProcess);
      } else {
        // Wait for available process
        await this.waitForAvailableProcess(poolKey);
        return this.getOrCreateProcess(poolKey);
      }
    }

    return availableProcess;
  }

  private async createProcess(poolKey: string): Promise<PooledProcess> {
    const [command, ...args] = poolKey.split(' ');
    
    const process = spawn(command, args, {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const pooledProcess: PooledProcess = {
      process,
      busy: false,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      taskCount: 0
    };

    process.on('error', (error) => {
      console.error(`[ProcessPool] Process error:`, error);
      this.cleanupProcess(pooledProcess);
    });

    process.on('exit', (code) => {
      if (code !== 0) {
        console.warn(`[ProcessPool] Process exited with code ${code}`);
        this.cleanupProcess(pooledProcess);
      }
    });

    console.log(`[ProcessPool] Created new process for ${poolKey}`);
    return pooledProcess;
  }

  private async runTask(process: ChildProcess, task: ProcessTask): Promise<any> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Send command to process
      if (process.stdin) {
        const commandLine = `${task.command} ${task.args.join(' ')}\n`;
        process.stdin.write(commandLine);
      }

      // For simple processes, we might need to spawn a new one
      // This is a simplified implementation
      const taskProcess = spawn(task.command, task.args, task.options);
      
      taskProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      taskProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      taskProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Process failed with code ${code}: ${stderr}`));
        }
      });

      taskProcess.on('error', reject);
    });
  }

  private async waitForAvailableProcess(poolKey: string): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const pool = this.pools.get(poolKey);
        if (pool && pool.some(p => !p.busy)) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  private cleanupProcess(process: PooledProcess): void {
    try {
      if (!process.process.killed) {
        process.process.kill();
      }
    } catch (error) {
      console.warn('[ProcessPool] Error killing process:', error);
    }

    // Remove from all pools
    for (const [poolKey, pool] of this.pools) {
      const index = pool.indexOf(process);
      if (index !== -1) {
        pool.splice(index, 1);
        if (pool.length === 0) {
          this.pools.delete(poolKey);
        }
      }
    }
  }

  private cleanupIdleProcesses(): void {
    const now = Date.now();
    
    for (const [poolKey, pool] of this.pools) {
      const processesToRemove: PooledProcess[] = [];
      
      for (const process of pool) {
        const age = now - process.createdAt;
        const idleTime = now - process.lastUsed;
        
        // Remove old processes or idle processes
        if (age > this.maxProcessAge || (!process.busy && idleTime > this.maxIdleTime)) {
          processesToRemove.push(process);
        }
      }
      
      for (const process of processesToRemove) {
        this.cleanupProcess(process);
      }
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): { [poolKey: string]: { total: number; busy: number; idle: number } } {
    const stats: { [poolKey: string]: { total: number; busy: number; idle: number } } = {};
    
    for (const [poolKey, pool] of this.pools) {
      const busy = pool.filter(p => p.busy).length;
      stats[poolKey] = {
        total: pool.length,
        busy,
        idle: pool.length - busy
      };
    }
    
    return stats;
  }

  /**
   * Shutdown all processes
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    for (const pool of this.pools.values()) {
      for (const process of pool) {
        this.cleanupProcess(process);
      }
    }
    
    this.pools.clear();
  }
}

// Global instance
export const processPool = new ProcessPoolManager();
