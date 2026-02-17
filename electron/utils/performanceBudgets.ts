/**
 * Performance budgets and regression testing utilities
 * Ensures application stays within performance thresholds
 */

import { performanceMonitor } from './performanceMonitor';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { app } from 'electron';

interface PerformanceBudget {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxBundleSizeKB: number;
  maxStartupTimeMs: number;
  maxProcessingTimeMs: number;
}

interface PerformanceSnapshot {
  timestamp: number;
  memoryUsage: number;
  cpuUsage: number;
  bundleSize: number;
  startupTime: number;
  processingTime: number;
}

interface RegressionTest {
  name: string;
  threshold: number;
  currentValue: number;
  status: 'pass' | 'fail' | 'warning';
  trend: 'improving' | 'degrading' | 'stable';
}

export class PerformanceBudgetManager {
  private budget: PerformanceBudget = {
    maxMemoryMB: 200,
    maxCpuPercent: 50,
    maxBundleSizeKB: 100 * 1024, // 100MB
    maxStartupTimeMs: 3000,
    maxProcessingTimeMs: 30000 // 30 seconds for typical video
  };

  private snapshots: PerformanceSnapshot[] = [];
  private snapshotFile: string;
  private regressionTests: RegressionTest[] = [];

  constructor() {
    this.snapshotFile = join(app.getPath('userData'), 'performance-snapshots.json');
    this.loadSnapshots();
    this.setupRegressionTests();
  }

  /**
   * Set up automated regression tests
   */
  private setupRegressionTests(): void {
    this.regressionTests = [
      {
        name: 'Memory Usage',
        threshold: this.budget.maxMemoryMB,
        currentValue: 0,
        status: 'pass',
        trend: 'stable'
      },
      {
        name: 'CPU Usage',
        threshold: this.budget.maxCpuPercent,
        currentValue: 0,
        status: 'pass',
        trend: 'stable'
      },
      {
        name: 'Bundle Size',
        threshold: this.budget.maxBundleSizeKB,
        currentValue: 0,
        status: 'pass',
        trend: 'stable'
      },
      {
        name: 'Startup Time',
        threshold: this.budget.maxStartupTimeMs,
        currentValue: 0,
        status: 'pass',
        trend: 'stable'
      },
      {
        name: 'Processing Time',
        threshold: this.budget.maxProcessingTimeMs,
        currentValue: 0,
        status: 'pass',
        trend: 'stable'
      }
    ];
  }

  /**
   * Take a performance snapshot
   */
  takeSnapshot(metrics: Partial<PerformanceSnapshot>): void {
    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      memoryUsage: metrics.memoryUsage || 0,
      cpuUsage: metrics.cpuUsage || 0,
      bundleSize: metrics.bundleSize || 0,
      startupTime: metrics.startupTime || 0,
      processingTime: metrics.processingTime || 0
    };

    this.snapshots.push(snapshot);
    this.saveSnapshots();
    this.updateRegressionTests(snapshot);
  }

  /**
   * Update regression tests with latest snapshot
   */
  private updateRegressionTests(snapshot: PerformanceSnapshot): void {
    this.regressionTests[0].currentValue = snapshot.memoryUsage;
    this.regressionTests[1].currentValue = snapshot.cpuUsage;
    this.regressionTests[2].currentValue = snapshot.bundleSize;
    this.regressionTests[3].currentValue = snapshot.startupTime;
    this.regressionTests[4].currentValue = snapshot.processingTime;

    // Update status
    this.regressionTests.forEach(test => {
      const percentage = (test.currentValue / test.threshold) * 100;
      if (percentage > 100) {
        test.status = 'fail';
      } else if (percentage > 80) {
        test.status = 'warning';
      } else {
        test.status = 'pass';
      }
    });

    // Update trends (compare with last 5 snapshots)
    this.updateTrends();
  }

  /**
   * Update performance trends
   */
  private updateTrends(): void {
    if (this.snapshots.length < 10) return;

    const recent = this.snapshots.slice(-5);
    const previous = this.snapshots.slice(-10, -5);

    const recentAvg = this.calculateAverage(recent);
    const previousAvg = this.calculateAverage(previous);

    this.regressionTests.forEach((test, index) => {
      const recentValue = recentAvg[index];
      const previousValue = previousAvg[index];
      
      if (recentValue < previousValue * 0.95) {
        test.trend = 'improving';
      } else if (recentValue > previousValue * 1.05) {
        test.trend = 'degrading';
      } else {
        test.trend = 'stable';
      }
    });
  }

  /**
   * Calculate average values from snapshots
   */
  private calculateAverage(snapshots: PerformanceSnapshot[]): number[] {
    if (snapshots.length === 0) return [0, 0, 0, 0, 0];

    const sum = snapshots.reduce((acc, snapshot) => [
      acc[0] + snapshot.memoryUsage,
      acc[1] + snapshot.cpuUsage,
      acc[2] + snapshot.bundleSize,
      acc[3] + snapshot.startupTime,
      acc[4] + snapshot.processingTime
    ], [0, 0, 0, 0, 0]);

    return sum.map(value => value / snapshots.length);
  }

  /**
   * Check if current performance meets budgets
   */
  checkBudgets(): { passed: boolean; violations: string[] } {
    const currentMetrics = performanceMonitor.getCurrentMemoryUsage();
    const violations: string[] = [];

    const memoryMB = currentMetrics.rss / 1024 / 1024;
    if (memoryMB > this.budget.maxMemoryMB) {
      violations.push(`Memory usage: ${memoryMB.toFixed(2)}MB > ${this.budget.maxMemoryMB}MB`);
    }

    // Check other metrics as needed
    this.regressionTests.forEach(test => {
      if (test.status === 'fail') {
        violations.push(`${test.name}: ${test.currentValue} exceeds threshold ${test.threshold}`);
      }
    });

    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Get regression test results
   */
  getRegressionTests(): RegressionTest[] {
    return [...this.regressionTests];
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): string {
    const budgetCheck = this.checkBudgets();
    const tests = this.getRegressionTests();

    let report = 'Performance Budget Report\n';
    report += '========================\n\n';

    report += `Overall Status: ${budgetCheck.passed ? '✅ PASS' : '❌ FAIL'}\n\n`;

    if (budgetCheck.violations.length > 0) {
      report += 'Violations:\n';
      budgetCheck.violations.forEach(violation => {
        report += `- ${violation}\n`;
      });
      report += '\n';
    }

    report += 'Regression Tests:\n';
    tests.forEach(test => {
      const status = test.status === 'pass' ? '✅' : test.status === 'warning' ? '⚠️' : '❌';
      const trend = test.trend === 'improving' ? '📈' : test.trend === 'degrading' ? '📉' : '➡️';
      report += `- ${status} ${trend} ${test.name}: ${test.currentValue.toFixed(2)} / ${test.threshold}\n`;
    });

    return report;
  }

  /**
   * Save snapshots to file
   */
  private saveSnapshots(): void {
    try {
      writeFileSync(this.snapshotFile, JSON.stringify(this.snapshots, null, 2));
    } catch (error) {
      console.error('[PerformanceBudget] Failed to save snapshots:', error);
    }
  }

  /**
   * Load snapshots from file
   */
  private loadSnapshots(): void {
    try {
      if (existsSync(this.snapshotFile)) {
        const data = readFileSync(this.snapshotFile, 'utf-8');
        this.snapshots = JSON.parse(data);
      }
    } catch (error) {
      console.error('[PerformanceBudget] Failed to load snapshots:', error);
      this.snapshots = [];
    }
  }

  /**
   * Get performance budget configuration
   */
  getBudget(): PerformanceBudget {
    return { ...this.budget };
  }

  /**
   * Update performance budget
   */
  updateBudget(newBudget: Partial<PerformanceBudget>): void {
    this.budget = { ...this.budget, ...newBudget };
    this.setupRegressionTests();
  }

  /**
   * Clear old snapshots (keep last 100)
   */
  cleanupOldSnapshots(): void {
    if (this.snapshots.length > 100) {
      this.snapshots = this.snapshots.slice(-100);
      this.saveSnapshots();
    }
  }
}

// Global instance
export const performanceBudgetManager = new PerformanceBudgetManager();
