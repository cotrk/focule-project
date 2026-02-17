import {
  TranscriptionError,
  ErrorSeverity,
  ErrorRecoverability,
  ErrorCategory
} from '../utils/errorHandling';

// ============================================================================
// Advanced Retry Service with Exponential Backoff
// ============================================================================

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  onRetry?: (attempt: number, error: Error, delay: number) => void;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
  retryHistory: RetryAttempt[];
}

export interface RetryAttempt {
  attempt: number;
  timestamp: number;
  error?: Error;
  delay: number;
  success: boolean;
}

export class AdvancedRetryService {
  private static instance: AdvancedRetryService;
  private retryHistory: Map<string, RetryAttempt[]> = new Map();
  private globalRetryStats: GlobalRetryStats;

  private constructor() {
    this.globalRetryStats = this.initializeStats();
  }

  public static getInstance(): AdvancedRetryService {
    if (!AdvancedRetryService.instance) {
      AdvancedRetryService.instance = new AdvancedRetryService();
    }
    return AdvancedRetryService.instance;
  }

  private initializeStats(): GlobalRetryStats {
    return {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageAttempts: 0,
      totalRetryTime: 0,
      errorTypeBreakdown: new Map()
    };
  }

  // ============================================================================
  // Main Retry Execution
  // ============================================================================

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const fullConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      ...config
    };

    const startTime = Date.now();
    const attempts: RetryAttempt[] = [];
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
      const attemptStartTime = Date.now();
      
      try {
        const result = await operation();
        
        // Record successful attempt
        const attemptRecord: RetryAttempt = {
          attempt,
          timestamp: attemptStartTime,
          delay: 0,
          success: true
        };
        attempts.push(attemptRecord);
        
        // Update global stats
        this.updateGlobalStats(true, attempts.length, Date.now() - startTime);
        
        // Store retry history
        this.storeRetryHistory(operationId, attempts);
        
        return {
          success: true,
          result,
          attempts: attempt,
          totalTime: Date.now() - startTime,
          retryHistory: attempts
        };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Calculate delay for next attempt
        const delay = this.calculateDelay(
          attempt,
          fullConfig.baseDelay,
          fullConfig.maxDelay,
          fullConfig.backoffMultiplier,
          fullConfig.jitter
        );
        
        // Record failed attempt
        const attemptRecord: RetryAttempt = {
          attempt,
          timestamp: attemptStartTime,
          error: lastError,
          delay,
          success: false
        };
        attempts.push(attemptRecord);
        
        // Notify retry callback
        fullConfig.onRetry?.(attempt, lastError, delay);
        
        // Check if we should retry
        if (attempt === fullConfig.maxAttempts || 
            !this.shouldRetry(lastError, attempt, fullConfig.shouldRetry)) {
          break;
        }
        
        // Wait before retry
        await this.delay(delay);
      }
    }
    
    // All attempts failed
    this.updateGlobalStats(false, attempts.length, Date.now() - startTime);
    this.storeRetryHistory(operationId, attempts);
    
    return {
      success: false,
      error: lastError,
      attempts: attempts.length,
      totalTime: Date.now() - startTime,
      retryHistory: attempts
    };
  }

  // ============================================================================
  // Specialized Retry Strategies
  // ============================================================================

  public async executeWithAdaptiveRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const adaptiveConfig: RetryConfig = {
      maxAttempts: 5,
      baseDelay: 500,
      maxDelay: 60000,
      backoffMultiplier: 1.5,
      jitter: true,
      ...config
    };

    // Get historical retry data for this operation
    const history = this.retryHistory.get(operationId) || [];
    const recentFailures = history.filter(h => 
      Date.now() - h.timestamp < 300000 && !h.success
    ).length;

    // Adapt config based on historical performance
    if (recentFailures > 3) {
      adaptiveConfig.maxAttempts = Math.min(adaptiveConfig.maxAttempts + 2, 10);
      adaptiveConfig.baseDelay = Math.min(adaptiveConfig.baseDelay * 2, 5000);
    }

    return this.executeWithRetry(operation, operationId, adaptiveConfig);
  }

  public async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    operationId: string,
    config: Partial<RetryConfig> = {},
    circuitBreakerConfig: CircuitBreakerConfig = {}
  ): Promise<RetryResult<T>> {
    const circuitBreaker = this.getCircuitBreaker(operationId, circuitBreakerConfig);
    
    if (circuitBreaker.isOpen()) {
      return {
        success: false,
        error: new TranscriptionError(
          'CIRCUIT_BREAKER_OPEN',
          `Operation ${operationId} is temporarily disabled due to repeated failures`,
          ErrorSeverity.HIGH,
          ErrorRecoverability.AUTOMATIC,
          ErrorCategory.SYSTEM
        ),
        attempts: 0,
        totalTime: 0,
        retryHistory: []
      };
    }

    const result = await this.executeWithRetry(operation, operationId, config);
    
    // Update circuit breaker state
    if (result.success) {
      circuitBreaker.recordSuccess();
    } else {
      circuitBreaker.recordFailure();
    }

    return result;
  }

  public async executeWithPriorityRetry<T>(
    operations: Array<{
      operation: () => Promise<T>;
      priority: 'high' | 'medium' | 'low';
      operationId: string;
    }>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    // Sort operations by priority
    const sortedOperations = operations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Execute operations in priority order
    for (const { operation, operationId, priority } of sortedOperations) {
      const priorityConfig: RetryConfig = {
        maxAttempts: priority === 'high' ? 5 : priority === 'medium' ? 3 : 2,
        baseDelay: priority === 'high' ? 500 : priority === 'medium' ? 1000 : 2000,
        ...config
      };

      const result = await this.executeWithRetry(operation, operationId, priorityConfig);
      
      if (result.success) {
        return {
          ...result,
          retryHistory: [
            ...result.retryHistory,
            { attempt: result.attempts, timestamp: Date.now(), delay: 0, success: true }
          ]
        };
      }
    }

    // All operations failed
    return {
      success: false,
      error: new Error('All priority operations failed'),
      attempts: sortedOperations.reduce((total, op) => total + (config.maxAttempts || 3), 0),
      totalTime: 0,
      retryHistory: []
    };
  }

  // ============================================================================
  // Retry Logic Utilities
  // ============================================================================

  private shouldRetry(
    error: Error,
    attempt: number,
    customShouldRetry?: (error: Error, attempt: number) => boolean
  ): boolean {
    // Use custom retry logic if provided
    if (customShouldRetry) {
      return customShouldRetry(error, attempt);
    }

    // Don't retry certain error types
    if (error instanceof TranscriptionError) {
      if (error.severity === ErrorSeverity.CRITICAL) {
        return false;
      }
      
      if (error.category === ErrorCategory.USER_INPUT) {
        return false;
      }
      
      if (error.recoverability === ErrorRecoverability.MANUAL) {
        return false;
      }
    }

    // Default retry logic
    return true;
  }

  private calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    multiplier: number,
    jitter: boolean
  ): number {
    let delay = baseDelay * Math.pow(multiplier, attempt - 1);
    
    // Apply jitter to prevent thundering herd
    if (jitter) {
      const jitterRange = delay * 0.1;
      delay = delay + (Math.random() - 0.5) * jitterRange;
    }
    
    return Math.min(Math.max(delay, 0), maxDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // Circuit Breaker Implementation
  // ============================================================================

  private getCircuitBreaker(operationId: string, config: CircuitBreakerConfig): CircuitBreaker {
    const key = `circuit_breaker_${operationId}`;
    let breaker = this.circuitBreakers.get(key);
    
    if (!breaker) {
      breaker = new CircuitBreaker(config);
      this.circuitBreakers.set(key, breaker);
    }
    
    return breaker;
  }

  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  // ============================================================================
  // Statistics and History Management
  // ============================================================================

  private updateGlobalStats(success: boolean, attempts: number, totalTime: number): void {
    this.globalRetryStats.totalRetries++;
    
    if (success) {
      this.globalRetryStats.successfulRetries++;
    } else {
      this.globalRetryStats.failedRetries++;
    }
    
    this.globalRetryStats.totalRetryTime += totalTime;
    
    // Update average attempts
    const totalOperations = this.globalRetryStats.successfulRetries + this.globalRetryStats.failedRetries;
    this.globalRetryStats.averageAttempts = 
      (this.globalRetryStats.averageAttempts * (totalOperations - 1) + attempts) / totalOperations;
  }

  private storeRetryHistory(operationId: string, attempts: RetryAttempt[]): void {
    const existing = this.retryHistory.get(operationId) || [];
    const combined = [...existing, ...attempts];
    
    // Keep only last 50 attempts per operation
    if (combined.length > 50) {
      combined.splice(0, combined.length - 50);
    }
    
    this.retryHistory.set(operationId, combined);
  }

  // ============================================================================
  // Public API
  // ============================================================================

  public getRetryHistory(operationId: string): RetryAttempt[] {
    return this.retryHistory.get(operationId) || [];
  }

  public getGlobalStats(): GlobalRetryStats {
    return { ...this.globalRetryStats };
  }

  public getCircuitBreakerStates(): Map<string, CircuitBreakerState> {
    const states = new Map<string, CircuitBreakerState>();
    
    this.circuitBreakers.forEach((breaker, key) => {
      states.set(key, breaker.getState());
    });
    
    return states;
  }

  public resetCircuitBreaker(operationId: string): void {
    const key = `circuit_breaker_${operationId}`;
    this.circuitBreakers.delete(key);
  }

  public clearHistory(operationId?: string): void {
    if (operationId) {
      this.retryHistory.delete(operationId);
    } else {
      this.retryHistory.clear();
    }
  }

  public resetStats(): void {
    this.globalRetryStats = this.initializeStats();
  }
}

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

interface CircuitBreakerConfig {
  failureThreshold?: number;
  recoveryTimeout?: number;
  monitoringPeriod?: number;
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailure: number;
  openedAt: number;
  recoveryTimeout: number;
  halfOpenAttempts: number;
}

class CircuitBreaker {
  private state: CircuitBreakerState;
  private config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      recoveryTimeout: config.recoveryTimeout || 60000,
      monitoringPeriod: config.monitoringPeriod || 300000
    };

    this.state = {
      state: 'CLOSED',
      failures: 0,
      lastFailure: 0,
      openedAt: 0,
      recoveryTimeout: this.config.recoveryTimeout,
      halfOpenAttempts: 0
    };
  }

  public isOpen(): boolean {
    if (this.state.state === 'OPEN') {
      if (Date.now() - this.state.openedAt >= this.state.recoveryTimeout) {
        this.state.state = 'HALF_OPEN';
        this.state.halfOpenAttempts = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  public recordSuccess(): void {
    if (this.state.state === 'HALF_OPEN') {
      this.state.halfOpenAttempts++;
      if (this.state.halfOpenAttempts >= 3) {
        this.state.state = 'CLOSED';
        this.state.failures = 0;
        this.state.halfOpenAttempts = 0;
      }
    } else if (this.state.state === 'CLOSED') {
      this.state.failures = 0;
    }
  }

  public recordFailure(): void {
    this.state.failures++;
    this.state.lastFailure = Date.now();

    if (this.state.state === 'CLOSED' && this.state.failures >= this.config.failureThreshold) {
      this.state.state = 'OPEN';
      this.state.openedAt = Date.now();
    } else if (this.state.state === 'HALF_OPEN') {
      this.state.state = 'OPEN';
      this.state.openedAt = Date.now();
      this.state.halfOpenAttempts = 0;
    }
  }

  public getState(): CircuitBreakerState {
    return { ...this.state };
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface GlobalRetryStats {
  totalRetries: number;
  successfulRetries: number;
  failedRetries: number;
  averageAttempts: number;
  totalRetryTime: number;
  errorTypeBreakdown: Map<string, number>;
}
