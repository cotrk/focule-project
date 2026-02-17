import type { AppError } from '../types';
import React from 'react';

// ============================================================================
// Error Classification System
// ============================================================================

export enum ErrorSeverity {
  CRITICAL = 'critical',    // Application cannot continue
  HIGH = 'high',           // Major feature unavailable
  MEDIUM = 'medium',       // Minor issues with workarounds
  LOW = 'low'             // Cosmetic issues or warnings
}

export enum ErrorRecoverability {
  AUTOMATIC = 'automatic', // Can recover without user intervention
  USER_ACTION = 'user_action', // Requires user input to recover
  MANUAL = 'manual'       // Requires manual intervention
}

export enum ErrorCategory {
  NETWORK = 'network',
  PROCESSING = 'processing',
  AI = 'ai',
  SYSTEM = 'system',
  USER_INPUT = 'user_input',
  RESOURCE = 'resource',
  PERMISSION = 'permission'
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

export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'skip' | 'abort';
  maxAttempts?: number;
  delay?: number;
  fallbackOptions?: string[];
  requiresUserAction?: boolean;
  userMessage?: string;
}

// ============================================================================
// Enhanced Error Classes
// ============================================================================

export class TranscriptionError extends Error {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly details?: unknown;
  public readonly severity: ErrorSeverity;
  public readonly recoverability: ErrorRecoverability;
  public readonly category: ErrorCategory;
  public readonly context: ErrorContext;
  public readonly recoveryStrategies: RecoveryStrategy[];
  public readonly correlationId: string;

  constructor(
    code: string,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    recoverability: ErrorRecoverability = ErrorRecoverability.USER_ACTION,
    category: ErrorCategory = ErrorCategory.PROCESSING,
    context?: Partial<ErrorContext>,
    recoveryStrategies?: RecoveryStrategy[],
    details?: unknown
  ) {
    super(message);
    this.name = 'TranscriptionError';
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.severity = severity;
    this.recoverability = recoverability;
    this.category = category;
    this.details = details;
    this.correlationId = this.generateCorrelationId();
    this.recoveryStrategies = recoveryStrategies || this.getDefaultRecoveryStrategies();
    this.context = {
      timestamp: this.timestamp,
      stackTrace: this.stack,
      ...context
    };
  }

  private generateCorrelationId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultRecoveryStrategies(): RecoveryStrategy[] {
    return [
      {
        type: 'retry',
        maxAttempts: 3,
        delay: 1000,
        userMessage: 'The operation failed. Would you like to try again?'
      }
    ];
  }

  public addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }

  public updateContext(newContext: Partial<ErrorContext>): void {
    Object.assign(this.context, newContext);
  }
}

export class NetworkError extends TranscriptionError {
  constructor(
    message: string,
    context?: Partial<ErrorContext>,
    recoveryStrategies?: RecoveryStrategy[],
    details?: unknown
  ) {
    super(
      'NETWORK_ERROR',
      message,
      ErrorSeverity.HIGH,
      ErrorRecoverability.AUTOMATIC,
      ErrorCategory.NETWORK,
      context,
      recoveryStrategies || [
        {
          type: 'retry',
          maxAttempts: 5,
          delay: 2000,
          userMessage: 'Network connection failed. Retrying with exponential backoff...'
        },
        {
          type: 'fallback',
          fallbackOptions: ['offline_mode', 'cached_content'],
          userMessage: 'Network unavailable. Using offline mode or cached content.'
        }
      ],
      details
    );
    this.name = 'NetworkError';
  }
}

export class ValidationError extends TranscriptionError {
  constructor(
    message: string,
    context?: Partial<ErrorContext>,
    details?: unknown
  ) {
    super(
      'VALIDATION_ERROR',
      message,
      ErrorSeverity.MEDIUM,
      ErrorRecoverability.USER_ACTION,
      ErrorCategory.USER_INPUT,
      context,
      [
        {
          type: 'skip',
          userMessage: 'Invalid input detected. Please check your input and try again.',
          requiresUserAction: true
        }
      ],
      details
    );
    this.name = 'ValidationError';
  }
}

export class ElectronAPIError extends TranscriptionError {
  constructor(
    message: string,
    context?: Partial<ErrorContext>,
    details?: unknown
  ) {
    super(
      'ELECTRON_API_ERROR',
      message,
      ErrorSeverity.CRITICAL,
      ErrorRecoverability.MANUAL,
      ErrorCategory.SYSTEM,
      context,
      [
        {
          type: 'abort',
          userMessage: 'Critical system error. Please restart the application.',
          requiresUserAction: true
        }
      ],
      details
    );
    this.name = 'ElectronAPIError';
  }
}

// ============================================================================
// Specialized Error Classes
// ============================================================================

export class VideoProcessingError extends TranscriptionError {
  constructor(
    message: string,
    context?: Partial<ErrorContext>,
    details?: unknown
  ) {
    super(
      'VIDEO_PROCESSING_ERROR',
      message,
      ErrorSeverity.HIGH,
      ErrorRecoverability.AUTOMATIC,
      ErrorCategory.PROCESSING,
      context,
      [
        {
          type: 'retry',
          maxAttempts: 3,
          delay: 1500,
          userMessage: 'Video processing failed. Retrying with different parameters...'
        },
        {
          type: 'fallback',
          fallbackOptions: ['lower_quality', 'audio_only'],
          userMessage: 'Processing failed. Trying with lower quality or audio-only mode.'
        }
      ],
      details
    );
    this.name = 'VideoProcessingError';
  }
}

export class AIModelError extends TranscriptionError {
  constructor(
    message: string,
    context?: Partial<ErrorContext>,
    details?: unknown
  ) {
    super(
      'AI_MODEL_ERROR',
      message,
      ErrorSeverity.HIGH,
      ErrorRecoverability.AUTOMATIC,
      ErrorCategory.AI,
      context,
      [
        {
          type: 'fallback',
          fallbackOptions: ['smaller_model', 'alternative_model'],
          userMessage: 'AI model failed. Switching to a more reliable model...'
        },
        {
          type: 'retry',
          maxAttempts: 2,
          delay: 3000,
          userMessage: 'AI processing failed. Retrying with different settings...'
        }
      ],
      details
    );
    this.name = 'AIModelError';
  }
}

export class ResourceExhaustionError extends TranscriptionError {
  constructor(
    message: string,
    context?: Partial<ErrorContext>,
    details?: unknown
  ) {
    super(
      'RESOURCE_EXHAUSTION_ERROR',
      message,
      ErrorSeverity.HIGH,
      ErrorRecoverability.USER_ACTION,
      ErrorCategory.RESOURCE,
      context,
      [
        {
          type: 'skip',
          userMessage: 'Insufficient system resources. Please close other applications and try again.',
          requiresUserAction: true
        },
        {
          type: 'fallback',
          fallbackOptions: ['reduced_quality', 'batch_processing'],
          userMessage: 'Resources limited. Switching to resource-efficient mode.'
        }
      ],
      details
    );
    this.name = 'ResourceExhaustionError';
  }
}

export class SessionRecoveryError extends TranscriptionError {
  constructor(
    message: string,
    context?: Partial<ErrorContext>,
    details?: unknown
  ) {
    super(
      'SESSION_RECOVERY_ERROR',
      message,
      ErrorSeverity.MEDIUM,
      ErrorRecoverability.USER_ACTION,
      ErrorCategory.SYSTEM,
      context,
      [
        {
          type: 'retry',
          maxAttempts: 2,
          delay: 1000,
          userMessage: 'Session recovery failed. Attempting to restore from backup...'
        },
        {
          type: 'skip',
          userMessage: 'Unable to recover session. Starting fresh session.',
          requiresUserAction: true
        }
      ],
      details
    );
    this.name = 'SessionRecoveryError';
  }
}

// Error boundary utilities
export function createErrorBoundaryFallback(error: Error, errorInfo: React.ErrorInfo): React.ReactNode {
  return React.createElement(
    'div',
    { className: 'min-h-screen flex items-center justify-center bg-[var(--focule-bg-primary)]' },
    React.createElement(
      'div',
      { className: 'max-w-lg w-full p-6 bg-[var(--focule-bg-secondary)] rounded-lg border border-[var(--focule-border)]' },
      React.createElement(
        'div',
        { className: 'text-center' },
        React.createElement('div', { className: 'text-4xl mb-4' }, '😵'),
        React.createElement(
          'h1',
          { className: 'text-xl font-semibold text-[var(--focule-text-primary)] mb-2' },
          'Something went wrong'
        ),
        React.createElement(
          'p',
          { className: 'text-[var(--focule-text-secondary)] mb-4' },
          error.message || 'An unexpected error occurred'
        ),
        process.env.NODE_ENV === 'development' &&
          React.createElement(
            'details',
            { className: 'text-left text-xs text-[var(--focule-text-muted)] mb-4' },
            React.createElement('summary', { className: 'cursor-pointer mb-2' }, 'Error details'),
            React.createElement(
              'pre',
              { className: 'whitespace-pre-wrap bg-[var(--focule-bg-tertiary)] p-2 rounded' },
              `${error.stack}\n\nComponent Stack:\n${errorInfo.componentStack}`
            )
          ),
        React.createElement(
          'button',
          {
            onClick: () => window.location.reload(),
            className: 'px-4 py-2 bg-[var(--focule-primary)] text-white rounded-lg hover:bg-[var(--focule-primary-dark)] transition-colors'
          },
          'Reload Application'
        )
      )
    )
  );
}

// Error logging utility
export class ErrorLogger {
  private static errors: AppError[] = [];

  static log(error: Error | AppError, context?: string): void {
    const appError: AppError = error instanceof TranscriptionError
      ? {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: error.timestamp,
        }
      : {
          code: 'UNKNOWN_ERROR',
          message: error.message,
          details: (error as Error).stack,
          timestamp: new Date().toISOString(),
        };

    this.errors.push(appError);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`🚨 Error [${appError.code}]:`, appError);
    }

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // this.sendToErrorService(appError);
    }
  }

  static getErrors(): AppError[] {
    return [...this.errors];
  }

  static clearErrors(): void {
    this.errors = [];
  }

  static getRecentErrors(count: number = 10): AppError[] {
    return this.errors.slice(-count);
  }
}

// Error recovery utilities
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  errorHandler?: (error: Error) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = error instanceof Error ? error : new Error(String(error));
      ErrorLogger.log(appError);
      errorHandler?.(appError);
      throw appError;
    }
  }) as T;
}

// Retry utility for async operations
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw new TranscriptionError(
          'MAX_ATTEMPTS_EXCEEDED',
          `Operation failed after ${maxAttempts} attempts`,
          ErrorSeverity.HIGH,
          ErrorRecoverability.MANUAL,
          ErrorCategory.PROCESSING,
          undefined,
          [],
          lastError
        );
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, attempt - 1)));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError!;
}

// Validation utilities
export function validateURL(url: string): { isValid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

export function validateProgress(progress: number): { isValid: boolean; error?: string } {
  if (typeof progress !== 'number') {
    return { isValid: false, error: 'Progress must be a number' };
  }

  if (progress < 0 || progress > 100) {
    return { isValid: false, error: 'Progress must be between 0 and 100' };
  }

  return { isValid: true };
}

// Toast notification system for user feedback
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export class ToastManager {
  private static toasts: Map<string, ToastMessage> = new Map();
  private static listeners: ((toasts: ToastMessage[]) => void)[] = [];

  static add(toast: Omit<ToastMessage, 'id'>): string {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { ...toast, id };
    
    this.toasts.set(id, newToast);
    this.notifyListeners();

    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    setTimeout(() => this.remove(id), duration);

    return id;
  }

  static remove(id: string): void {
    this.toasts.delete(id);
    this.notifyListeners();
  }

  static getToasts(): ToastMessage[] {
    return Array.from(this.toasts.values());
  }

  static subscribe(listener: (toasts: ToastMessage[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getToasts()));
  }

  // Convenience methods
  static success(title: string, message?: string): string {
    return this.add({ type: 'success', title, message });
  }

  static error(title: string, message?: string): string {
    return this.add({ type: 'error', title, message, duration: 8000 });
  }

  static warning(title: string, message?: string): string {
    return this.add({ type: 'warning', title, message });
  }

  static info(title: string, message?: string): string {
    return this.add({ type: 'info', title, message });
  }
}
