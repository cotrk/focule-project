import { ResourceExhaustionError, ErrorSeverity } from '../utils/errorHandling';
import { RecoveryService } from './RecoveryService';

// ============================================================================
// Resource Management Service
// ============================================================================

export interface ResourceThresholds {
  memory: {
    warning: number; // percentage
    critical: number; // percentage
    maxUsage: number; // MB
  };
  cpu: {
    warning: number; // percentage
    critical: number; // percentage
    sustainedDuration: number; // ms
  };
  disk: {
    warning: number; // percentage
    critical: number; // percentage
    minFreeSpace: number; // MB
  };
  processes: {
    maxConcurrent: number;
    maxQueueSize: number;
  };
}

export interface ResourceStatus {
  memory: {
    used: number;
    total: number;
    percentage: number;
    status: 'normal' | 'warning' | 'critical';
  };
  cpu: {
    usage: number;
    status: 'normal' | 'warning' | 'critical';
    sustainedTime: number;
  };
  disk: {
    used: number;
    total: number;
    free: number;
    percentage: number;
    status: 'normal' | 'warning' | 'critical';
  };
  processes: {
    active: number;
    queued: number;
    status: 'normal' | 'warning' | 'critical';
  };
  timestamp: number;
}

export interface ResourceManagementOptions {
  enableAutoCleanup: boolean;
  cleanupThreshold: number;
  monitoringInterval: number;
  enableThrottling: boolean;
  throttleThreshold: number;
}

export class ResourceManagementService {
  private static instance: ResourceManagementService;
  private recoveryService: RecoveryService;
  private thresholds: ResourceThresholds;
  private options: ResourceManagementOptions;
  private currentStatus: ResourceStatus;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private resourceHistory: ResourceStatus[] = [];
  private activeProcesses: Set<string> = new Set();
  private processQueue: Array<{ id: string; priority: number; timestamp: number }> = [];

  private constructor() {
    this.recoveryService = RecoveryService.getInstance();
    this.thresholds = this.initializeThresholds();
    this.options = this.initializeOptions();
    this.currentStatus = this.getCurrentResourceStatus();
  }

  public static getInstance(): ResourceManagementService {
    if (!ResourceManagementService.instance) {
      ResourceManagementService.instance = new ResourceManagementService();
    }
    return ResourceManagementService.instance;
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private initializeThresholds(): ResourceThresholds {
    return {
      memory: {
        warning: 70, // 70%
        critical: 85, // 85%
        maxUsage: 4096 // 4GB
      },
      cpu: {
        warning: 75, // 75%
        critical: 90, // 90%
        sustainedDuration: 30000 // 30 seconds
      },
      disk: {
        warning: 80, // 80%
        critical: 90, // 90%
        minFreeSpace: 1024 // 1GB
      },
      processes: {
        maxConcurrent: 5,
        maxQueueSize: 20
      }
    };
  }

  private initializeOptions(): ResourceManagementOptions {
    return {
      enableAutoCleanup: true,
      cleanupThreshold: 80,
      monitoringInterval: 5000, // 5 seconds
      enableThrottling: true,
      throttleThreshold: 75
    };
  }

  // ============================================================================
  // Resource Monitoring
  // ============================================================================

  public startMonitoring(): void {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    this.monitoringInterval = setInterval(() => {
      this.updateResourceStatus();
      this.checkThresholds();
      this.performAutoCleanup();
    }, this.options.monitoringInterval);
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private updateResourceStatus(): void {
    const newStatus = this.getCurrentResourceStatus();
    this.currentStatus = newStatus;
    
    // Keep history limited to last 100 entries
    this.resourceHistory.push(newStatus);
    if (this.resourceHistory.length > 100) {
      this.resourceHistory.splice(0, this.resourceHistory.length - 100);
    }
  }

  private getCurrentResourceStatus(): ResourceStatus {
    // This would integrate with actual system monitoring
    // For now, using simulated values
    const memoryUsage = this.simulateMemoryUsage();
    const cpuUsage = this.simulateCpuUsage();
    const diskUsage = this.simulateDiskUsage();

    return {
      memory: {
        used: memoryUsage.used,
        total: memoryUsage.total,
        percentage: memoryUsage.percentage,
        status: this.getResourceStatus(memoryUsage.percentage, this.thresholds.memory)
      },
      cpu: {
        usage: cpuUsage,
        status: this.getResourceStatus(cpuUsage, this.thresholds.cpu),
        sustainedTime: 0 // Would track sustained high usage
      },
      disk: {
        used: diskUsage.used,
        total: diskUsage.total,
        free: diskUsage.free,
        percentage: diskUsage.percentage,
        status: this.getResourceStatus(diskUsage.percentage, this.thresholds.disk)
      },
      processes: {
        active: this.activeProcesses.size,
        queued: this.processQueue.length,
        status: this.getProcessStatus()
      },
      timestamp: Date.now()
    };
  }

  // ============================================================================
  // Resource Management
  // ============================================================================

  public async executeWithResourceManagement<T>(
    operation: () => Promise<T>,
    operationId: string,
    priority: number = 5
  ): Promise<T> {
    // Check if we can execute the operation
    await this.waitForResourceAvailability(operationId, priority);

    // Register the operation
    this.registerProcess(operationId);

    try {
      // Monitor resources during execution
      const result = await this.executeWithMonitoring(operation, operationId);
      return result;
    } finally {
      // Unregister the operation
      this.unregisterProcess(operationId);
    }
  }

  private async waitForResourceAvailability(operationId: string, priority: number): Promise<void> {
    // Check if we have available slots
    if (this.activeProcesses.size < this.thresholds.processes.maxConcurrent) {
      return; // Can execute immediately
    }

    // Add to queue if there's space
    if (this.processQueue.length >= this.thresholds.processes.maxQueueSize) {
      throw new ResourceExhaustionError(
        'Process queue is full. System is overloaded.',
        { operation: 'queue_process', metadata: { operationId, queueSize: this.processQueue.length } }
      );
    }

    // Add to queue based on priority
    this.addToQueue(operationId, priority);

    // Wait for our turn
    return new Promise((resolve, reject) => {
      const checkQueue = () => {
        const queueIndex = this.processQueue.findIndex(p => p.id === operationId);
        if (queueIndex === -1) {
          reject(new Error('Operation removed from queue'));
          return;
        }

        if (queueIndex === 0 && this.activeProcesses.size < this.thresholds.processes.maxConcurrent) {
          // Our turn!
          this.processQueue.shift();
          resolve();
        } else {
          // Wait and check again
          setTimeout(checkQueue, 1000);
        }
      };
      checkQueue();
    });
  }

  private async executeWithMonitoring<T>(operation: () => Promise<T>, operationId: string): Promise<T> {
    const startTime = Date.now();
    let lastResourceCheck = startTime;

    return new Promise(async (resolve, reject) => {
      const monitor = setInterval(() => {
        const now = Date.now();
        
        // Check resources every 2 seconds during operation
        if (now - lastResourceCheck > 2000) {
          this.updateResourceStatus();
          lastResourceCheck = now;

          // Check if we need to abort due to resource exhaustion
          if (this.shouldAbortOperation()) {
            clearInterval(monitor);
            reject(new ResourceExhaustionError(
              'Operation aborted due to resource exhaustion',
              { operation: 'execute_with_monitoring', operationId, metadata: { status: this.currentStatus } }
            ));
            return;
          }
        }
      }, 1000);

      try {
        const result = await operation();
        clearInterval(monitor);
        resolve(result);
      } catch (error) {
        clearInterval(monitor);
        reject(error);
      }
    });
  }

  // ============================================================================
  // Threshold Checking and Auto-Cleanup
  // ============================================================================

  private checkThresholds(): void {
    const status = this.currentStatus;
    let needsIntervention = false;

    // Check memory thresholds
    if (status.memory.status === 'critical') {
      console.warn('Critical memory usage detected:', status.memory.percentage + '%');
      needsIntervention = true;
    }

    // Check CPU thresholds
    if (status.cpu.status === 'critical') {
      console.warn('Critical CPU usage detected:', status.cpu.usage + '%');
      needsIntervention = true;
    }

    // Check disk thresholds
    if (status.disk.status === 'critical') {
      console.warn('Critical disk usage detected:', status.disk.percentage + '%');
      needsIntervention = true;
    }

    // Check process thresholds
    if (status.processes.status === 'critical') {
      console.warn('Critical process count detected:', status.processes.active + ' active');
      needsIntervention = true;
    }

    if (needsIntervention) {
      this.performEmergencyCleanup();
    }
  }

  private performAutoCleanup(): void {
    if (!this.options.enableAutoCleanup) {
      return;
    }

    const status = this.currentStatus;
    
    // Check if cleanup is needed
    if (status.memory.percentage > this.options.cleanupThreshold ||
        status.cpu.usage > this.options.cleanupThreshold ||
        status.disk.percentage > this.options.cleanupThreshold) {
      
      console.log('Performing automatic resource cleanup...');
      this.cleanupTempFiles();
      this.garbageCollect();
      this.optimizeMemory();
    }
  }

  private performEmergencyCleanup(): void {
    console.log('Performing emergency cleanup due to critical resource usage...');
    
    // Clear process queue for low-priority operations
    this.processQueue = this.processQueue.filter(p => p.priority <= 3);
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
    
    // Clean up temporary files
    this.cleanupTempFiles();
    
    // Notify about resource exhaustion
    this.notifyResourceExhaustion();
  }

  // ============================================================================
  // Process Management
  // ============================================================================

  private registerProcess(operationId: string): void {
    this.activeProcesses.add(operationId);
  }

  private unregisterProcess(operationId: string): void {
    this.activeProcesses.delete(operationId);
  }

  private addToQueue(operationId: string, priority: number): void {
    this.processQueue.push({ id: operationId, priority, timestamp: Date.now() });
    // Sort by priority (lower number = higher priority)
    this.processQueue.sort((a, b) => a.priority - b.priority);
  }

  private getProcessStatus(): 'normal' | 'warning' | 'critical' {
    const active = this.activeProcesses.size;
    const max = this.thresholds.processes.maxConcurrent;
    const percentage = (active / max) * 100;
    
    return this.getResourceStatus(percentage, { warning: 60, critical: 80 });
  }

  // ============================================================================
  // Cleanup Methods
  // ============================================================================

  private cleanupTempFiles(): void {
    // This would integrate with actual file system cleanup
    console.log('Cleaning up temporary files...');
  }

  private garbageCollect(): void {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  private optimizeMemory(): void {
    // Clear resource history if it's getting large
    if (this.resourceHistory.length > 50) {
      this.resourceHistory = this.resourceHistory.slice(-25);
    }
  }

  private notifyResourceExhaustion(): void {
    // This would integrate with notification system
    console.error('Resource exhaustion detected! System performance may be degraded.');
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getResourceStatus(percentage: number, thresholds: { warning: number; critical: number }): 'normal' | 'warning' | 'critical' {
    if (percentage >= thresholds.critical) return 'critical';
    if (percentage >= thresholds.warning) return 'warning';
    return 'normal';
  }

  private shouldAbortOperation(): boolean {
    const status = this.currentStatus;
    
    // Abort if any resource is in critical state
    return status.memory.status === 'critical' ||
           status.cpu.status === 'critical' ||
           status.disk.status === 'critical';
  }

  // Simulation methods (replace with actual system monitoring)
  private simulateMemoryUsage(): { used: number; total: number; percentage: number } {
    const total = 8192; // 8GB
    const used = total * (0.3 + Math.random() * 0.4); // 30-70% usage
    return {
      used,
      total,
      percentage: (used / total) * 100
    };
  }

  private simulateCpuUsage(): number {
    return 20 + Math.random() * 60; // 20-80% usage
  }

  private simulateDiskUsage(): { used: number; total: number; free: number; percentage: number } {
    const total = 512000; // 500GB
    const used = total * (0.4 + Math.random() * 0.3); // 40-70% usage
    const free = total - used;
    return {
      used,
      total,
      free,
      percentage: (used / total) * 100
    };
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  public getResourceStatus(): ResourceStatus {
    return { ...this.currentStatus };
  }

  public getResourceHistory(): ResourceStatus[] {
    return [...this.resourceHistory];
  }

  public getThresholds(): ResourceThresholds {
    return { ...this.thresholds };
  }

  public updateThresholds(newThresholds: Partial<ResourceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  public getOptions(): ResourceManagementOptions {
    return { ...this.options };
  }

  public updateOptions(newOptions: Partial<ResourceManagementOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    // Restart monitoring with new interval if needed
    if (this.monitoringInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  public getResourceStatistics(): {
    averageMemoryUsage: number;
    averageCpuUsage: number;
    averageDiskUsage: number;
    peakMemoryUsage: number;
    peakCpuUsage: number;
    totalProcesses: number;
    queueEfficiency: number;
  } {
    if (this.resourceHistory.length === 0) {
      return {
        averageMemoryUsage: 0,
        averageCpuUsage: 0,
        averageDiskUsage: 0,
        peakMemoryUsage: 0,
        peakCpuUsage: 0,
        totalProcesses: 0,
        queueEfficiency: 0
      };
    }

    const memoryUsages = this.resourceHistory.map(h => h.memory.percentage);
    const cpuUsages = this.resourceHistory.map(h => h.cpu.usage);
    const diskUsages = this.resourceHistory.map(h => h.disk.percentage);

    return {
      averageMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      averageCpuUsage: cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length,
      averageDiskUsage: diskUsages.reduce((a, b) => a + b, 0) / diskUsages.length,
      peakMemoryUsage: Math.max(...memoryUsages),
      peakCpuUsage: Math.max(...cpuUsages),
      totalProcesses: this.activeProcesses.size,
      queueEfficiency: this.processQueue.length > 0 ? 
        this.processQueue.filter(p => Date.now() - p.timestamp < 30000).length / this.processQueue.length : 1
    };
  }

  public forceCleanup(): void {
    this.performEmergencyCleanup();
  }

  public isSystemHealthy(): boolean {
    const status = this.currentStatus;
    return status.memory.status !== 'critical' &&
           status.cpu.status !== 'critical' &&
           status.disk.status !== 'critical' &&
           status.processes.status !== 'critical';
  }
}
