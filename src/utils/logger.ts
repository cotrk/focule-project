// Structured logging system for Focule video transcriber
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    // In development, log everything
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // In production, only log warnings and errors
    return level >= LogLevel.WARN;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = LogLevel[entry.level].padEnd(5);
    const context = entry.context ? `[${entry.context}] ` : '';
    const data = entry.data ? ` | Data: ${JSON.stringify(entry.data)}` : '';
    
    return `${timestamp} ${level} ${context}${entry.message}${data}`;
  }

  private addLog(level: LogLevel, message: string, context?: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data
    };

    this.logs.push(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Console output for development
    if (this.shouldLog(level)) {
      const formattedMessage = this.formatMessage(entry);
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
      }
    }
  }

  public debug(message: string, context?: string, data?: unknown): void {
    this.addLog(LogLevel.DEBUG, message, context, data);
  }

  public info(message: string, context?: string, data?: unknown): void {
    this.addLog(LogLevel.INFO, message, context, data);
  }

  public warn(message: string, context?: string, data?: unknown): void {
    this.addLog(LogLevel.WARN, message, context, data);
  }

  public error(message: string, context?: string, data?: unknown): void {
    this.addLog(LogLevel.ERROR, message, context, data);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  // Performance logging
  public logPerformance(operation: string, duration: number, context?: string): void {
    this.info(`Performance: ${operation} completed in ${duration.toFixed(2)}ms`, context, {
      operation,
      duration,
      performance: true
    });
  }

  // Memory logging
  public logMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.info('Memory usage', 'performance', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      });
    }
  }

  // Error logging with context
  public logError(error: Error | unknown, context?: string, additionalData?: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    this.error(errorMessage, context, {
      error: {
        message: errorMessage,
        stack: errorStack,
        ...additionalData
      }
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
