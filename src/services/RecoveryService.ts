import {
  TranscriptionError,
  ErrorSeverity,
  ErrorRecoverability,
  ErrorCategory,
  RecoveryStrategy
} from '../utils/errorHandling';
import { ErrorClassificationService } from './ErrorClassificationService';

// ============================================================================
// Recovery Service
// ============================================================================

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  recoveryTimeout?: number;
  monitoringPeriod?: number;
}

export interface RecoveryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
  recoveryStrategy?: RecoveryStrategy;
}

export class RecoveryService {
  private static instance: RecoveryService;
  private classificationService: ErrorClassificationService;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private retryHistory: Map<string, RetryHistoryEntry[]> = new Map();

  private constructor() {
    this.classificationService = ErrorClassificationService.getInstance();
  }

  public static getInstance(): RecoveryService {
    if (!RecoveryService.instance) {
      RecoveryService.instance = new RecoveryService();
    }
    return RecoveryService.instance;
  }

  // ============================================================================
  // Enhanced Retry with Exponential Backoff
  // ============================================================================

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    options: RetryOptions = {}
  ): Promise<RecoveryResult<T>> {
    const startTime = Date.now();
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      jitter = true,
      onRetry,
      shouldRetry
    } = options;

    let lastError: Error | undefined;
    let attempts = 0;

    // Check circuit breaker first
    if (this.isCircuitBreakerOpen(operationId)) {
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
        totalTime: 0
      };
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      attempts = attempt;
      
      try {
        const result = await operation();
        
        // Record success
        this.recordSuccess(operationId);
        
        return {
          success: true,
          result,
          attempts,
          totalTime: Date.now() - startTime
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Classify the error
        const classification = this.classificationService.classifyError(lastError);
        
        // Check if we should retry
        if (!this.shouldRetryOperation(classification.error, attempt, shouldRetry)) {
          break;
        }
        
        // Record failure
        this.recordFailure(operationId, classification.error);
        
        // Notify retry callback
        onRetry?.(attempt, classification.error);
        
        // Calculate delay for next attempt
        if (attempt < maxAttempts) {
          const delay = this.calculateDelay(
            attempt,
            baseDelay,
            maxDelay,
            backoffMultiplier,
            jitter
          );
          
          await this.delay(delay);
        }
      }
    }

    // All attempts failed
    return {
      success: false,
      error: lastError,
      attempts,
      totalTime: Date.now() - startTime
    };
  }

  // ============================================================================
  // Graceful Degradation
  // ============================================================================

  public async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperations: (() => Promise<T>)[],
    operationId: string,
    options: RetryOptions = {}
  ): Promise<RecoveryResult<T>> {
    const startTime = Date.now();
    const operations = [primaryOperation, ...fallbackOperations];
    
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      const fallbackName = i === 0 ? 'primary' : `fallback_${i}`;
      const fullOperationId = `${operationId}_${fallbackName}`;
      
      const result = await this.executeWithRetry(
        operation,
        fullOperationId,
        options
      );
      
      if (result.success) {
        return {
          ...result,
          recoveryStrategy: {
            type: i === 0 ? 'retry' : 'fallback',
            fallbackOptions: fallbackOperations.map((_, index) => `fallback_${index + 1}`),
            userMessage: i === 0 
              ? 'Operation succeeded on primary attempt'
              : `Operation succeeded using ${fallbackName}`
          }
        };
      }
      
      // If primary failed, try fallbacks
      if (i === 0) {
        console.warn(`Primary operation ${operationId} failed, trying fallbacks...`);
      }
    }
    
    // All operations failed
    return {
      success: false,
      error: new TranscriptionError(
        'ALL_FALLBACKS_FAILED',
        `All fallback operations failed for ${operationId}`,
        ErrorSeverity.HIGH,
        ErrorRecoverability.USER_ACTION,
        ErrorCategory.PROCESSING
      ),
      attempts: operations.length,
      totalTime: Date.now() - startTime
    };
  }

  // ============================================================================
  // Circuit Breaker Implementation
  // ============================================================================

  private isCircuitBreakerOpen(operationId: string): boolean {
    const breaker = this.circuitBreakers.get(operationId);
    if (!breaker) return false;
    
    if (breaker.state === 'OPEN') {
      if (Date.now() - breaker.openedAt >= breaker.recoveryTimeout) {
        // Transition to HALF_OPEN
        breaker.state = 'HALF_OPEN';
        breaker.halfOpenAttempts = 0;
        return false;
      }
      return true;
    }
    
    return false;
  }

  private recordSuccess(operationId: string): void {
    const breaker = this.circuitBreakers.get(operationId);
    if (breaker) {
      if (breaker.state === 'HALF_OPEN') {
        breaker.halfOpenAttempts++;
        if (breaker.halfOpenAttempts >= 3) {
          // Recovery confirmed, close the circuit
          breaker.state = 'CLOSED';
          breaker.failures = 0;
          breaker.halfOpenAttempts = 0;
        }
      } else if (breaker.state === 'CLOSED') {
        breaker.failures = 0;
      }
    }
    
    // Record in retry history
    this.recordRetryAttempt(operationId, true);
  }

  private recordFailure(operationId: string, error: TranscriptionError): void {
    let breaker = this.circuitBreakers.get(operationId);
    
    if (!breaker) {
      breaker = {
        state: 'CLOSED',
        failures: 0,
        lastFailure: 0,
        openedAt: 0,
        recoveryTimeout: 60000, // 1 minute
        halfOpenAttempts: 0
      };
      this.circuitBreakers.set(operationId, breaker);
    }
    
    breaker.failures++;
    breaker.lastFailure = Date.now();
    
    if (breaker.state === 'CLOSED' && breaker.failures >= 5) {
      // Open the circuit
      breaker.state = 'OPEN';
      breaker.openedAt = Date.now();
      console.warn(`Circuit breaker opened for ${operationId} due to repeated failures`);
    } else if (breaker.state === 'HALF_OPEN') {
      // Failed in half-open state, open again
      breaker.state = 'OPEN';
      breaker.openedAt = Date.now();
      breaker.halfOpenAttempts = 0;
    }
    
    // Record in retry history
    this.recordRetryAttempt(operationId, false, error);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private shouldRetryOperation(
    error: TranscriptionError,
    attempt: number,
    customShouldRetry?: (error: Error, attempt: number) => boolean
  ): boolean {
    // Use custom retry logic if provided
    if (customShouldRetry) {
      return customShouldRetry(error, attempt);
    }
    
    // Don't retry critical errors or user input errors
    if (error.severity === ErrorSeverity.CRITICAL || 
        error.category === ErrorCategory.USER_INPUT) {
      return false;
    }
    
    // Check error's recoverability
    if (error.recoverability === ErrorRecoverability.MANUAL) {
      return false;
    }
    
    // Check if error has retry strategy
    const retryStrategy = error.recoveryStrategies.find(s => s.type === 'retry');
    if (retryStrategy && retryStrategy.maxAttempts) {
      return attempt < retryStrategy.maxAttempts;
    }
    
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
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.min(delay, maxDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private recordRetryAttempt(
    operationId: string,
    success: boolean,
    error?: TranscriptionError
  ): void {
    const history = this.retryHistory.get(operationId) || [];
    
    history.push({
      timestamp: Date.now(),
      success,
      error: error?.message,
      severity: error?.severity
    });
    
    // Keep only last 50 attempts
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    this.retryHistory.set(operationId, history);
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  public getCircuitBreakerState(operationId: string): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(operationId);
  }

  public getRetryHistory(operationId: string): RetryHistoryEntry[] {
    return this.retryHistory.get(operationId) || [];
  }

  public resetCircuitBreaker(operationId: string): void {
    this.circuitBreakers.delete(operationId);
  }

  public getAllCircuitBreakers(): Map<string, CircuitBreakerState> {
    return new Map(this.circuitBreakers);
  }

  public getRecoveryStatistics(): RecoveryStatistics {
    const stats: RecoveryStatistics = {
      totalOperations: this.retryHistory.size,
      circuitBreakersOpen: 0,
      averageRetryAttempts: 0,
      successRate: 0
    };
    
    let totalAttempts = 0;
    let successfulOperations = 0;
    
    this.circuitBreakers.forEach(breaker => {
      if (breaker.state === 'OPEN') {
        stats.circuitBreakersOpen++;
      }
    });
    
    this.retryHistory.forEach(history => {
      const recentAttempts = history.filter(entry => 
        Date.now() - entry.timestamp < 300000 // Last 5 minutes
      );
      
      totalAttempts += recentAttempts.length;
      if (recentAttempts.some(entry => entry.success)) {
        successfulOperations++;
      }
    });
    
    if (this.retryHistory.size > 0) {
      stats.averageRetryAttempts = totalAttempts / this.retryHistory.size;
      stats.successRate = (successfulOperations / this.retryHistory.size) * 100;
    }
    
    return stats;
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailure: number;
  openedAt: number;
  recoveryTimeout: number;
  halfOpenAttempts: number;
}

interface RetryHistoryEntry {
  timestamp: number;
  success: boolean;
  error?: string;
  severity?: ErrorSeverity;
}

interface RecoveryStatistics {
  totalOperations: number;
  circuitBreakersOpen: number;
  averageRetryAttempts: number;
  successRate: number;
}
