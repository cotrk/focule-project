// Standardized error handling for Focule video transcriber
import { logger } from './logger';
export type ErrorCode = 
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED'
  | 'FILE_NOT_FOUND'
  | 'INVALID_INPUT'
  | 'PROCESSING_ERROR'
  | 'AI_MODEL_ERROR'
  | 'RESOURCE_EXHAUSTED'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

export type ErrorCategory = 
  | 'network'
  | 'permission'
  | 'validation'
  | 'processing'
  | 'ai'
  | 'resource'
  | 'system'
  | 'user';

export interface ErrorContext {
  operation?: string;
  sessionId?: string;
  timestamp?: string;
  userAgent?: string;
  platform?: string;
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly category: ErrorCategory;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly userMessage?: string;
  public readonly details?: unknown;
  public readonly context?: ErrorContext;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    category: ErrorCategory = 'system',
    userMessage?: string,
    details?: unknown,
    context?: ErrorContext
  ) {
    super(message);
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.userMessage = userMessage;
    this.details = details;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.name = 'AppError';
  }

  public toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      userMessage: this.userMessage,
      details: this.details,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  // Static factory methods for common error types
  public static networkError(message: string, details?: unknown): AppError {
    return new AppError(
      'NETWORK_ERROR',
      message,
      'high',
      'network',
      undefined,
      details
    );
  }

  public static permissionError(message: string, details?: unknown): AppError {
    return new AppError(
      'PERMISSION_DENIED',
      message,
      'high',
      'permission',
      undefined,
      details
    );
  }

  public static validationError(message: string, details?: unknown): AppError {
    return new AppError(
      'INVALID_INPUT',
      message,
      'medium',
      'validation',
      undefined,
      details
    );
  }

  public static processingError(message: string, details?: unknown): AppError {
    return new AppError(
      'PROCESSING_ERROR',
      message,
      'high',
      'processing',
      undefined,
      details
    );
  }

  public static aiModelError(message: string, details?: unknown): AppError {
    return new AppError(
      'AI_MODEL_ERROR',
      message,
      'high',
      'ai',
      undefined,
      details
    );
  }

  public static resourceError(message: string, details?: unknown): AppError {
    return new AppError(
      'RESOURCE_EXHAUSTED',
      message,
      'critical',
      'resource',
      undefined,
      details
    );
  }

  public static timeoutError(message: string, details?: unknown): AppError {
    return new AppError(
      'TIMEOUT_ERROR',
      message,
      'medium',
      'system',
      undefined,
      details
    );
  }

  public static fromError(error: Error | unknown, code?: ErrorCode): AppError {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    return new AppError(
      code || 'UNKNOWN_ERROR',
      message,
      'medium',
      'system',
      undefined,
      { originalError: error },
      { stack }
    );
  }
}

// Error handler utility
export class ErrorHandler {
  private static logger = logger;

  public static handle(error: Error | AppError | unknown, context?: string): AppError {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else {
      appError = AppError.fromError(error, undefined);
    }

    // Log the error
    this.logger.error(appError.message, context, {
      code: appError.code,
      category: appError.category,
      severity: appError.severity,
      userMessage: appError.userMessage,
      details: appError.details,
      context: appError.context,
      stack: appError.stack
    });

    return appError;
  }

  public static getUserMessage(error: AppError): string {
    return error.userMessage || error.message;
  }

  public static shouldRetry(error: AppError): boolean {
    return error.category === 'network' || error.category === 'ai';
  }

  public static getRecoveryStrategies(error: AppError): Array<{
    type: 'retry' | 'fallback' | 'skip';
    userMessage?: string;
    maxAttempts?: number;
    delay?: number;
    fallbackOptions?: string[];
    requiresUserAction?: boolean;
  }> {
    const strategies: Array<{
      type: 'retry' | 'fallback' | 'skip';
      userMessage?: string;
      maxAttempts?: number;
      delay?: number;
      fallbackOptions?: string[];
      requiresUserAction?: boolean;
    }> = [];

    switch (error.category) {
      case 'network':
        strategies.push({
          type: 'retry',
          maxAttempts: 3,
          delay: 2000,
          userMessage: 'Network connection failed. Retrying with exponential backoff...'
        });
        strategies.push({
          type: 'fallback',
          fallbackOptions: ['offline_mode', 'cached_content'],
          userMessage: 'Network unavailable. Using offline mode or cached content.'
        });
        break;

      case 'ai':
        strategies.push({
          type: 'fallback',
          fallbackOptions: ['smaller_model', 'alternative_model'],
          userMessage: 'AI model failed. Switching to a more reliable model...'
        });
        strategies.push({
          type: 'retry',
          maxAttempts: 2,
          delay: 3000,
          userMessage: 'AI processing failed. Retrying with different settings...'
        });
        break;

      case 'resource':
        strategies.push({
          type: 'fallback',
          fallbackOptions: ['smaller_model', 'reduced_quality'],
          userMessage: 'Insufficient resources. Switching to resource-efficient mode...'
        });
        strategies.push({
          type: 'skip',
          requiresUserAction: true,
          userMessage: 'Please close other applications and try again.'
        });
        break;

      case 'permission':
        strategies.push({
          type: 'skip',
          requiresUserAction: true,
          userMessage: 'Permission denied. Please check file or directory permissions.'
        });
        break;

      case 'validation':
        strategies.push({
          type: 'skip',
          requiresUserAction: true,
          userMessage: 'Invalid input detected. Please check your input and try again.'
        });
        break;

      default:
        strategies.push({
          type: 'retry',
          maxAttempts: 2,
          delay: 1000,
          userMessage: 'An error occurred. Retrying...'
        });
        break;
    }

    return strategies;
  }
}
