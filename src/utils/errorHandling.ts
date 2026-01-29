import type { AppError } from '../types';

// Error class hierarchy for better error handling
export class TranscriptionError extends Error {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'TranscriptionError';
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.details = details;
  }
}

export class NetworkError extends TranscriptionError {
  constructor(message: string, details?: unknown) {
    super('NETWORK_ERROR', message, details);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends TranscriptionError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class ElectronAPIError extends TranscriptionError {
  constructor(message: string, details?: unknown) {
    super('ELECTRON_API_ERROR', message, details);
    this.name = 'ElectronAPIError';
  }
}

// Error boundary utilities
export function createErrorBoundaryFallback(error: Error, errorInfo: React.ErrorInfo): ReactNode {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--focule-bg-primary)]">
      <div className="max-w-lg w-full p-6 bg-[var(--focule-bg-secondary)] rounded-lg border border-[var(--focule-border)]">
        <div className="text-center">
          <div className="text-4xl mb-4">😵</div>
          <h1 className="text-xl font-semibold text-[var(--focule-text-primary)] mb-2">
            Something went wrong
          </h1>
          <p className="text-[var(--focule-text-secondary)] mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left text-xs text-[var(--focule-text-muted)] mb-4">
              <summary className="cursor-pointer mb-2">Error details</summary>
              <pre className="whitespace-pre-wrap bg-[var(--focule-bg-tertiary)] p-2 rounded">
                {error.stack}
                {'\n\n'}
                Component Stack:
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--focule-primary)] text-white rounded-lg hover:bg-[var(--focule-primary-dark)] transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    </div>
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
          details: error.stack,
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
  private static toasts: ToastMessage[] = [];
  private static listeners: ((toasts: ToastMessage[]) => void)[] = [];

  static add(toast: Omit<ToastMessage, 'id'>): string {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { ...toast, id };
    
    this.toasts.push(newToast);
    this.notifyListeners();

    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    setTimeout(() => this.remove(id), duration);

    return id;
  }

  static remove(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  static getToasts(): ToastMessage[] {
    return [...this.toasts];
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
