import {
  TranscriptionError,
  ErrorSeverity,
  ErrorRecoverability,
  ErrorCategory
} from '../utils/errorHandling';

// ============================================================================
// Comprehensive Error Logging and Analytics Service
// ============================================================================

export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  error: TranscriptionError;
  context: ErrorContext;
  recoveryAttempts: number;
  recoverySuccess: boolean;
  recoveryTime: number;
  userAgent: string;
  sessionId?: string;
  userId?: string;
  stackTrace?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByCategory: Map<ErrorCategory, number>;
  errorsBySeverity: Map<ErrorSeverity, number>;
  errorsByRecoverability: Map<ErrorRecoverability, number>;
  recoveryRate: number;
  averageRecoveryTime: number;
  errorTrends: ErrorTrend[];
  topErrors: TopError[];
  systemHealth: SystemHealthMetrics;
}

export interface ErrorTrend {
  period: string;
  count: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoveryRate: number;
}

export interface TopError {
  errorCode: string;
  message: string;
  category: ErrorCategory;
  count: number;
  recoveryRate: number;
  lastOccurrence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemHealthMetrics {
  overallHealth: 'healthy' | 'degraded' | 'critical';
  errorRate: number; // errors per hour
  recoveryRate: number;
  averageResponseTime: number;
  uptime: number;
  performanceScore: number; // 0-100
}

export interface ErrorContext {
  operation?: string;
  sessionId?: string;
  userId?: string;
  timestamp: string;
  stackTrace?: string;
  userAgent?: string;
  systemInfo?: {
    platform?: string;
    arch?: string;
    nodeVersion?: string;
    memory?: {
      used: number;
      total: number;
    };
  };
  metadata?: Record<string, unknown>;
}

export interface LoggingConfig {
  enableRemoteLogging: boolean;
  enableLocalLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxLogEntries: number;
  retentionPeriod: number; // in milliseconds
  remoteEndpoint?: string;
  batchSize: number;
  flushInterval: number; // in milliseconds
}

export class ErrorLoggingAnalyticsService {
  private static instance: ErrorLoggingAnalyticsService;
  private errorLogs: ErrorLogEntry[] = [];
  private config: LoggingConfig;
  private flushTimer: NodeJS.Timeout | null = null;
  private pendingRemoteLogs: ErrorLogEntry[] = [];

  private constructor() {
    this.config = this.getDefaultConfig();
    this.startPeriodicFlush();
    this.loadPersistedLogs();
  }

  public static getInstance(): ErrorLoggingAnalyticsService {
    if (!ErrorLoggingAnalyticsService.instance) {
      ErrorLoggingAnalyticsService.instance = new ErrorLoggingAnalyticsService();
    }
    return ErrorLoggingAnalyticsService.instance;
  }

  private getDefaultConfig(): LoggingConfig {
    return {
      enableRemoteLogging: false,
      enableLocalLogging: true,
      logLevel: 'error',
      maxLogEntries: 10000,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      batchSize: 50,
      flushInterval: 30000 // 30 seconds
    };
  }

  // ============================================================================
  // Error Logging Interface
  // ============================================================================

  public logError(
    error: Error | TranscriptionError,
    context: Partial<ErrorContext> = {},
    recoveryInfo: {
      attempts: number;
      success: boolean;
      time: number;
    } = { attempts: 0, success: false, time: 0 }
  ): void {
    const transcriptionError = error instanceof TranscriptionError 
      ? error 
      : new TranscriptionError(
          'UNKNOWN_ERROR',
          error.message,
          ErrorSeverity.MEDIUM,
          ErrorRecoverability.USER_ACTION,
          ErrorCategory.SYSTEM,
          context,
          [],
          error
        );

    const logEntry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      error: transcriptionError,
      context: this.buildFullContext(context),
      recoveryAttempts: recoveryInfo.attempts,
      recoverySuccess: recoveryInfo.success,
      recoveryTime: recoveryInfo.time,
      userAgent: navigator.userAgent,
      sessionId: context.sessionId,
      userId: context.userId,
      stackTrace: error.stack,
      metadata: context.metadata
    };

    this.addLogEntry(logEntry);
  }

  public logRecoveryAttempt(
    error: TranscriptionError,
    attempt: number,
    success: boolean,
    recoveryTime: number,
    context?: Partial<ErrorContext>
  ): void {
    this.logError(error, context, {
      attempts: attempt,
      success,
      time: recoveryTime
    });
  }

  public logSystemEvent(
    event: string,
    level: 'info' | 'warn' | 'error',
    context: Partial<ErrorContext> = {}
  ): void {
    const systemError = new TranscriptionError(
      'SYSTEM_EVENT',
      event,
      level === 'error' ? ErrorSeverity.HIGH : level === 'warn' ? ErrorSeverity.MEDIUM : ErrorSeverity.LOW,
      ErrorRecoverability.AUTOMATIC,
      ErrorCategory.SYSTEM,
      context
    );

    this.logError(systemError, context);
  }

  // ============================================================================
  // Log Management
  // ============================================================================

  private addLogEntry(entry: ErrorLogEntry): void {
    // Add to local logs
    this.errorLogs.push(entry);

    // Maintain log size limits
    if (this.errorLogs.length > this.config.maxLogEntries) {
      this.errorLogs.splice(0, this.errorLogs.length - this.config.maxLogEntries);
    }

    // Add to remote queue if enabled
    if (this.config.enableRemoteLogging) {
      this.pendingRemoteLogs.push(entry);
      
      // Flush immediately if batch size reached
      if (this.pendingRemoteLogs.length >= this.config.batchSize) {
        this.flushRemoteLogs();
      }
    }

    // Persist locally if enabled
    if (this.config.enableLocalLogging) {
      this.persistLogEntry(entry);
    }
  }

  private async flushRemoteLogs(): Promise<void> {
    if (!this.config.enableRemoteLogging || this.pendingRemoteLogs.length === 0) {
      return;
    }

    const logsToSend = this.pendingRemoteLogs.splice(0, this.config.batchSize);
    
    try {
      await this.sendLogsToRemote(logsToSend);
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
      // Re-add failed logs to the queue for retry
      this.pendingRemoteLogs.unshift(...logsToSend);
    }
  }

  private async sendLogsToRemote(logs: ErrorLogEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) {
      throw new Error('Remote endpoint not configured');
    }

    const response = await fetch(this.config.remoteEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        logs,
        timestamp: Date.now(),
        source: 'video-transcriber'
      })
    });

    if (!response.ok) {
      throw new Error(`Remote logging failed: ${response.status} ${response.statusText}`);
    }
  }

  private persistLogEntry(entry: ErrorLogEntry): void {
    try {
      const key = `error_log_${entry.id}`;
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to persist log entry:', error);
    }
  }

  private loadPersistedLogs(): void {
    try {
      const logs: ErrorLogEntry[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('error_log_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const entry = JSON.parse(data) as ErrorLogEntry;
            
            // Check if log is still within retention period
            if (Date.now() - entry.timestamp <= this.config.retentionPeriod) {
              logs.push(entry);
            } else {
              // Remove expired log
              localStorage.removeItem(key);
            }
          }
        }
      }

      // Sort by timestamp and add to memory
      logs.sort((a, b) => a.timestamp - b.timestamp);
      this.errorLogs.push(...logs);
      
      // Trim to max entries
      if (this.errorLogs.length > this.config.maxLogEntries) {
        this.errorLogs.splice(0, this.errorLogs.length - this.config.maxLogEntries);
      }
    } catch (error) {
      console.warn('Failed to load persisted logs:', error);
    }
  }

  private startPeriodicFlush(): void {
    if (this.config.enableRemoteLogging && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flushRemoteLogs();
      }, this.config.flushInterval);
    }
  }

  // ============================================================================
  // Analytics and Reporting
  // ============================================================================

  public getAnalytics(timeRange?: number): ErrorAnalytics {
    const cutoff = timeRange ? Date.now() - timeRange : 0;
    const relevantLogs = timeRange 
      ? this.errorLogs.filter(log => log.timestamp >= cutoff)
      : this.errorLogs;

    return {
      totalErrors: relevantLogs.length,
      errorsByCategory: this.calculateErrorsByCategory(relevantLogs),
      errorsBySeverity: this.calculateErrorsBySeverity(relevantLogs),
      errorsByRecoverability: this.calculateErrorsByRecoverability(relevantLogs),
      recoveryRate: this.calculateRecoveryRate(relevantLogs),
      averageRecoveryTime: this.calculateAverageRecoveryTime(relevantLogs),
      errorTrends: this.calculateErrorTrends(relevantLogs),
      topErrors: this.getTopErrors(relevantLogs),
      systemHealth: this.calculateSystemHealth(relevantLogs)
    };
  }

  private calculateErrorsByCategory(logs: ErrorLogEntry[]): Map<ErrorCategory, number> {
    const categoryMap = new Map<ErrorCategory, number>();
    
    logs.forEach(log => {
      const count = categoryMap.get(log.error.category) || 0;
      categoryMap.set(log.error.category, count + 1);
    });
    
    return categoryMap;
  }

  private calculateErrorsBySeverity(logs: ErrorLogEntry[]): Map<ErrorSeverity, number> {
    const severityMap = new Map<ErrorSeverity, number>();
    
    logs.forEach(log => {
      const count = severityMap.get(log.error.severity) || 0;
      severityMap.set(log.error.severity, count + 1);
    });
    
    return severityMap;
  }

  private calculateErrorsByRecoverability(logs: ErrorLogEntry[]): Map<ErrorRecoverability, number> {
    const recoverabilityMap = new Map<ErrorRecoverability, number>();
    
    logs.forEach(log => {
      const count = recoverabilityMap.get(log.error.recoverability) || 0;
      recoverabilityMap.set(log.error.recoverability, count + 1);
    });
    
    return recoverabilityMap;
  }

  private calculateRecoveryRate(logs: ErrorLogEntry[]): number {
    if (logs.length === 0) return 0;
    
    const recoveredCount = logs.filter(log => log.recoverySuccess).length;
    return (recoveredCount / logs.length) * 100;
  }

  private calculateAverageRecoveryTime(logs: ErrorLogEntry[]): number {
    const recoveredLogs = logs.filter(log => log.recoverySuccess && log.recoveryTime > 0);
    
    if (recoveredLogs.length === 0) return 0;
    
    const totalTime = recoveredLogs.reduce((sum, log) => sum + log.recoveryTime, 0);
    return totalTime / recoveredLogs.length;
  }

  private calculateErrorTrends(logs: ErrorLogEntry[]): ErrorTrend[] {
    const trends: ErrorTrend[] = [];
    const now = Date.now();
    const periods = [
      { label: 'Last Hour', duration: 60 * 60 * 1000 },
      { label: 'Last 6 Hours', duration: 6 * 60 * 60 * 1000 },
      { label: 'Last 24 Hours', duration: 24 * 60 * 60 * 1000 },
      { label: 'Last 7 Days', duration: 7 * 24 * 60 * 60 * 1000 }
    ];

    periods.forEach(period => {
      const periodLogs = logs.filter(log => now - log.timestamp <= period.duration);
      
      if (periodLogs.length > 0) {
        const category = this.getMostCommonCategory(periodLogs);
        const severity = this.getMostCommonSeverity(periodLogs);
        const recoveryRate = this.calculateRecoveryRate(periodLogs);
        
        trends.push({
          period: period.label,
          count: periodLogs.length,
          category,
          severity,
          recoveryRate
        });
      }
    });

    return trends;
  }

  private getTopErrors(logs: ErrorLogEntry[]): TopError[] {
    const errorCounts = new Map<string, { count: number; lastOccurrence: number; logs: ErrorLogEntry[] }>();
    
    logs.forEach(log => {
      const key = `${log.error.code}_${log.error.message}`;
      const existing = errorCounts.get(key);
      
      if (existing) {
        existing.count++;
        existing.lastOccurrence = Math.max(existing.lastOccurrence, log.timestamp);
        existing.logs.push(log);
      } else {
        errorCounts.set(key, {
          count: 1,
          lastOccurrence: log.timestamp,
          logs: [log]
        });
      }
    });

    const topErrors = Array.from(errorCounts.entries())
      .map(([key, data]) => {
        const [code, message] = key.split('_');
        const sampleLog = data.logs[0];
        const recoveryRate = this.calculateRecoveryRate(data.logs);
        const impact = this.calculateErrorImpact(sampleLog.error);
        
        return {
          errorCode: code,
          message,
          category: sampleLog.error.category,
          count: data.count,
          recoveryRate,
          lastOccurrence: data.lastOccurrence,
          impact
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return topErrors;
  }

  private calculateSystemHealth(logs: ErrorLogEntry[]): SystemHealthMetrics {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    const recentLogs = logs.filter(log => log.timestamp >= hourAgo);
    
    const errorRate = recentLogs.length; // errors per hour
    const recoveryRate = this.calculateRecoveryRate(recentLogs);
    const averageResponseTime = this.calculateAverageRecoveryTime(recentLogs);
    
    // Calculate performance score (0-100)
    let performanceScore = 100;
    
    // Deduct points for high error rate
    if (errorRate > 10) performanceScore -= 30;
    else if (errorRate > 5) performanceScore -= 15;
    else if (errorRate > 2) performanceScore -= 5;
    
    // Deduct points for low recovery rate
    if (recoveryRate < 50) performanceScore -= 25;
    else if (recoveryRate < 70) performanceScore -= 10;
    else if (recoveryRate < 85) performanceScore -= 5;
    
    // Deduct points for slow recovery
    if (averageResponseTime > 30000) performanceScore -= 20;
    else if (averageResponseTime > 15000) performanceScore -= 10;
    else if (averageResponseTime > 5000) performanceScore -= 5;
    
    performanceScore = Math.max(0, performanceScore);
    
    const overallHealth = performanceScore >= 80 ? 'healthy' : 
                         performanceScore >= 60 ? 'degraded' : 'critical';

    return {
      overallHealth,
      errorRate,
      recoveryRate,
      averageResponseTime,
      uptime: 0, // Would calculate from application start time
      performanceScore
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private buildFullContext(partial: Partial<ErrorContext>): ErrorContext {
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      systemInfo: {
        platform: navigator.platform,
        arch: 'unknown', // Would get from actual system
        nodeVersion: 'unknown' // Would get from actual system
      },
      ...partial
    };
  }

  private getMostCommonCategory(logs: ErrorLogEntry[]): ErrorCategory {
    const categoryCounts = new Map<ErrorCategory, number>();
    
    logs.forEach(log => {
      const count = categoryCounts.get(log.error.category) || 0;
      categoryCounts.set(log.error.category, count + 1);
    });
    
    let maxCount = 0;
    let mostCommon = ErrorCategory.SYSTEM;
    
    categoryCounts.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = category;
      }
    });
    
    return mostCommon;
  }

  private getMostCommonSeverity(logs: ErrorLogEntry[]): ErrorSeverity {
    const severityCounts = new Map<ErrorSeverity, number>();
    
    logs.forEach(log => {
      const count = severityCounts.get(log.error.severity) || 0;
      severityCounts.set(log.error.severity, count + 1);
    });
    
    let maxCount = 0;
    let mostCommon = ErrorSeverity.MEDIUM;
    
    severityCounts.forEach((count, severity) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = severity;
      }
    });
    
    return mostCommon;
  }

  private calculateErrorImpact(error: TranscriptionError): 'low' | 'medium' | 'high' | 'critical' {
    if (error.severity === ErrorSeverity.CRITICAL) return 'critical';
    if (error.severity === ErrorSeverity.HIGH) return 'high';
    if (error.recoverability === ErrorRecoverability.MANUAL) return 'medium';
    return 'low';
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  public getErrorLogs(filter?: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    sessionId?: string;
    timeRange?: number;
  }): ErrorLogEntry[] {
    let logs = [...this.errorLogs];
    
    if (filter) {
      if (filter.category) {
        logs = logs.filter(log => log.error.category === filter.category);
      }
      
      if (filter.severity) {
        logs = logs.filter(log => log.error.severity === filter.severity);
      }
      
      if (filter.sessionId) {
        logs = logs.filter(log => log.sessionId === filter.sessionId);
      }
      
      if (filter.timeRange) {
        const cutoff = Date.now() - filter.timeRange;
        logs = logs.filter(log => log.timestamp >= cutoff);
      }
    }
    
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getErrorLogs();
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      // CSV format
      const headers = ['ID', 'Timestamp', 'Error Code', 'Message', 'Category', 'Severity', 'Recovery Success', 'Recovery Time'];
      const csvRows = [headers.join(',')];
      
      logs.forEach(log => {
        const row = [
          log.id,
          new Date(log.timestamp).toISOString(),
          log.error.code,
          `"${log.error.message.replace(/"/g, '""')}"`,
          log.error.category,
          log.error.severity,
          log.recoverySuccess,
          log.recoveryTime
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
  }

  public updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart flush timer if interval changed
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    this.startPeriodicFlush();
  }

  public getConfig(): LoggingConfig {
    return { ...this.config };
  }

  public clearLogs(olderThan?: number): void {
    if (olderThan) {
      const cutoff = Date.now() - olderThan;
      this.errorLogs = this.errorLogs.filter(log => log.timestamp >= cutoff);
    } else {
      this.errorLogs = [];
    }
    
    // Clear persisted logs
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('error_log_')) {
          if (!olderThan) {
            keysToRemove.push(key);
          } else {
            const data = localStorage.getItem(key);
            if (data) {
              const entry = JSON.parse(data) as ErrorLogEntry;
              if (entry.timestamp < cutoff) {
                keysToRemove.push(key);
              }
            }
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear persisted logs:', error);
    }
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Flush any pending remote logs
    this.flushRemoteLogs();
  }
}
