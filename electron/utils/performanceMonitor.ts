/**
 * Performance monitoring utilities for Focule Video Transcriber
 * Provides real-time metrics, memory tracking, and performance budgets
 */

import { app } from 'electron';
import * as process from 'process';
import * as fs from 'fs';
import * as path from 'path';

interface PerformanceMetrics {
  timestamp: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  activeProcesses: number;
  sessionCount: number;
}

interface PerformanceBudget {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxSessionCount: number;
  maxProcessCount: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private activeProcesses = new Set<string>();
  private budget: PerformanceBudget = {
    maxMemoryMB: 200,
    maxCpuPercent: 50,
    maxSessionCount: 10,
    maxProcessCount: 5
  };
  private metricsFile: string;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.metricsFile = path.join(app.getPath('userData'), 'performance-metrics.json');
    this.startMonitoring();
  }

  startMonitoring() {
    // Collect metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Cleanup old metrics (keep last 24 hours)
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }

  collectMetrics() {
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      activeProcesses: this.activeProcesses.size,
      sessionCount: this.getSessionCount()
    };

    this.metrics.push(metrics);
    this.checkPerformanceBudgets(metrics);
    this.saveMetrics();
  }

  registerProcess(processId: string) {
    this.activeProcesses.add(processId);
  }

  unregisterProcess(processId: string) {
    this.activeProcesses.delete(processId);
  }

  private getSessionCount(): number {
    const sessionsDir = path.join(app.getPath('userData'), 'sessions');
    if (!fs.existsSync(sessionsDir)) return 0;
    
    try {
      return fs.readdirSync(sessionsDir).length;
    } catch {
      return 0;
    }
  }

  private checkPerformanceBudgets(metrics: PerformanceMetrics) {
    const memoryMB = metrics.memoryUsage.rss / 1024 / 1024;
    
    if (memoryMB > this.budget.maxMemoryMB) {
      console.warn(`[Performance] Memory usage exceeded budget: ${memoryMB.toFixed(2)}MB > ${this.budget.maxMemoryMB}MB`);
      this.triggerMemoryCleanup();
    }

    if (metrics.activeProcesses > this.budget.maxProcessCount) {
      console.warn(`[Performance] Active processes exceeded budget: ${metrics.activeProcesses} > ${this.budget.maxProcessCount}`);
    }

    if (metrics.sessionCount > this.budget.maxSessionCount) {
      console.warn(`[Performance] Session count exceeded budget: ${metrics.sessionCount} > ${this.budget.maxSessionCount}`);
      this.triggerSessionCleanup();
    }
  }

  private triggerMemoryCleanup() {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Emit cleanup event to main process
    console.warn('[Performance] Triggering memory cleanup');
  }

  private triggerSessionCleanup() {
    // Emit session cleanup event
    console.warn('[Performance] Triggering session cleanup');
  }

  private cleanupOldMetrics() {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > twentyFourHoursAgo);
  }

  private saveMetrics() {
    try {
      fs.writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error('[Performance] Failed to save metrics:', error);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getCurrentMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  getPerformanceReport(): string {
    if (this.metrics.length === 0) return 'No metrics available';
    
    const latest = this.metrics[this.metrics.length - 1];
    const memoryMB = latest.memoryUsage.rss / 1024 / 1024;
    
    return `
Performance Report - ${new Date(latest.timestamp).toLocaleString()}
Memory Usage: ${memoryMB.toFixed(2)}MB (RSS)
Active Processes: ${latest.activeProcesses}
Session Count: ${latest.sessionCount}
CPU Usage: User ${(latest.cpuUsage.user / 1000000).toFixed(2)}s, System ${(latest.cpuUsage.system / 1000000).toFixed(2)}s
    `.trim();
  }
}

export const performanceMonitor = new PerformanceMonitor();
export type { PerformanceMetrics, PerformanceBudget };
