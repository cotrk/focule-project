/**
 * Memory optimization utilities for long-running processes
 * Implements cleanup patterns and memory leak prevention
 */

import { performanceMonitor } from './performanceMonitor';

export class MemoryManager {
  private cleanupTasks = new Map<string, () => void>();
  private static instance: MemoryManager;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  registerCleanup(id: string, cleanupFn: () => void) {
    this.cleanupTasks.set(id, cleanupFn);
  }

  unregisterCleanup(id: string) {
    this.cleanupTasks.delete(id);
  }

  performCleanup() {
    console.warn('[Memory] Performing cleanup of registered tasks');
    for (const [id, cleanup] of this.cleanupTasks) {
      try {
        cleanup();
      } catch (error) {
        console.error(`[Memory] Cleanup failed for ${id}:`, error);
      }
    }
    this.cleanupTasks.clear();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  checkMemoryLeak(thresholdMB: number = 150): boolean {
    const usage = this.getMemoryUsage();
    const memoryMB = usage.rss / 1024 / 1024;
    return memoryMB > thresholdMB;
  }
}

export const memoryManager = MemoryManager.getInstance();

/**
 * Process cleanup wrapper for child processes
 */
export function withProcessCleanup<T>(
  processId: string,
  processPromise: Promise<T>,
  cleanupFn: () => void
): Promise<T> {
  performanceMonitor.registerProcess(processId);
  
  return processPromise
    .finally(() => {
      performanceMonitor.unregisterProcess(processId);
      try {
        cleanupFn();
      } catch (error) {
        console.error(`[Process] Cleanup failed for ${processId}:`, error);
      }
    });
}

/**
 * Memory-optimized file operations
 */
export class FileOperationManager {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async readFileWithCache(filePath: string): Promise<any> {
    const cached = this.cache.get(filePath);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const fs = await import('fs');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      this.cache.set(filePath, { data, timestamp: now });
      return data;
    } catch (error) {
      console.error(`[File] Failed to read ${filePath}:`, error);
      throw error;
    }
  }

  static async writeFileAtomic(filePath: string, data: any): Promise<void> {
    try {
      const fs = await import('fs');
      const tempPath = `${filePath}.tmp`;
      
      // Write to temp file first
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
      
      // Atomic rename
      fs.renameSync(tempPath, filePath);
      
      // Update cache
      this.cache.set(filePath, { data, timestamp: Date.now() });
    } catch (error) {
      console.error(`[File] Failed to write ${filePath}:`, error);
      throw error;
    }
  }

  static clearCache() {
    this.cache.clear();
  }

  static cleanupExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache) {
      if ((now - value.timestamp) > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * CPU throttling utility for intensive operations
 */
export class CPUThrottler {
  private static activeOperations = new Set<string>();
  private static readonly MAX_CONCURRENT_OPERATIONS = 2;

  static async throttle<T>(
    operationId: string,
    operation: () => Promise<T>,
    options: {
      priority?: 'high' | 'medium' | 'low';
      timeout?: number;
    } = {}
  ): Promise<T> {
    const { priority = 'medium', timeout = 300000 } = options; // 5 min default timeout

    // Wait for available slot
    while (this.activeOperations.size >= this.MAX_CONCURRENT_OPERATIONS) {
      await this.delay(100); // Wait 100ms
    }

    this.activeOperations.add(operationId);
    
    try {
      // Add small delays for low priority operations
      if (priority === 'low') {
        await this.delay(50);
      }

      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), timeout)
        )
      ]);
    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static getActiveOperations(): string[] {
    return Array.from(this.activeOperations);
  }
}

// Auto-cleanup interval
setInterval(() => {
  FileOperationManager.cleanupExpiredCache();
  
  // Check for memory leaks
  if (memoryManager.checkMemoryLeak()) {
    console.warn('[Memory] High memory usage detected, triggering cleanup');
    memoryManager.performCleanup();
  }
}, 60000); // Every minute
