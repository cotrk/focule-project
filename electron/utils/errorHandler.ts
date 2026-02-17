import { IPCResponse } from '../types/ipc';
import { IpcMainInvokeEvent } from 'electron';

// ============================================================================
// Electron Error Handling Utilities
// ============================================================================

export class ElectronError extends Error {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly details?: unknown;
  public readonly category: 'ipc' | 'file' | 'process' | 'network' | 'system';
  public readonly recoverable: boolean;

  constructor(
    code: string,
    message: string,
    category: 'ipc' | 'file' | 'process' | 'network' | 'system',
    recoverable: boolean = false,
    details?: unknown
  ) {
    super(message);
    this.name = 'ElectronError';
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.category = category;
    this.recoverable = recoverable;
    this.details = details;
  }
}

export class IPCHandlerError extends ElectronError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, 'ipc', true, details);
    this.name = 'IPCHandlerError';
  }
}

export class FileOperationError extends ElectronError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, 'file', false, details);
    this.name = 'FileOperationError';
  }
}

export class ProcessError extends ElectronError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, 'process', true, details);
    this.name = 'ProcessError';
  }
}

// ============================================================================
// IPC Response Creator
// ============================================================================

export function createIPCResponse<T>(
  success: boolean,
  data?: T,
  error?: string
): IPCResponse<T> {
  return {
    success,
    data,
    error
  };
}

export function createSuccessResponse<T>(data: T): IPCResponse<T> {
  return createIPCResponse(true, data);
}

export function createErrorResponse<T = never>(error: string): IPCResponse<T> {
  return createIPCResponse(false, null as T, error);
}

// ============================================================================
// Async IPC Handler Wrapper
// ============================================================================

export function wrapIPCHandler<T extends unknown[], R>(
  handler: (event: IpcMainInvokeEvent, ...args: T) => Promise<R>,
  context?: string
): (event: IpcMainInvokeEvent, ...args: T) => Promise<IPCResponse<R>> {
  return async (event: IpcMainInvokeEvent, ...args: T): Promise<IPCResponse<R>> => {
    try {
      const result = await handler(event, ...args);
      return createSuccessResponse(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log error with context
      console.error(`[IPC Error${context ? ` (${context})` : ''}]:`, errorMessage);
      
      if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
      }
      
      return createErrorResponse(errorMessage);
    }
  };
}

// ============================================================================
// File Operation Utilities
// ============================================================================

export async function safeFileOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new FileOperationError(
      'FILE_OPERATION_FAILED',
      `${operationName} failed: ${errorMessage}`,
      { operation: operationName, originalError: error }
    );
  }
}

// ============================================================================
// Process Execution Utilities
// ============================================================================

export async function safeProcessExecution<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new ProcessError(
      'PROCESS_EXECUTION_FAILED',
      `${operationName} failed: ${errorMessage}`,
      { operation: operationName, originalError: error }
    );
  }
}

// ============================================================================
// Error Recovery Strategies
// ============================================================================

export interface RecoveryStrategy {
  canRecover: (error: Error) => boolean;
  recover: () => Promise<unknown>;
  maxAttempts?: number;
}

export class ErrorRecoveryManager {
  private strategies = new Map<string, RecoveryStrategy>();

  registerStrategy(errorCode: string, strategy: RecoveryStrategy): void {
    this.strategies.set(errorCode, strategy);
  }

  async attemptRecovery(error: Error): Promise<unknown> {
    const errorCode = error instanceof ElectronError ? error.code : 'UNKNOWN_ERROR';
    const strategy = this.strategies.get(errorCode);

    if (!strategy || !strategy.canRecover(error)) {
      throw error;
    }

    const maxAttempts = strategy.maxAttempts || 3;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await strategy.recover();
      } catch (recoveryError) {
        if (attempt === maxAttempts) {
          throw new ProcessError(
            'RECOVERY_FAILED',
            `Recovery failed after ${maxAttempts} attempts for ${errorCode}`,
            { originalError: error, recoveryError, attempt }
          );
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw error;
  }
}

// ============================================================================
// Logging Utilities
// ============================================================================

export class ElectronLogger {
  private static logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

  static setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }

  static debug(message: string, ...args: unknown[]): void {
    if (this.logLevel === 'debug') {
      console.warn(`[DEBUG] ${message}`, ...args);
    }
  }

  static info(message: string, ...args: unknown[]): void {
    if (['debug', 'info'].includes(this.logLevel)) {
      console.warn(`[INFO] ${message}`, ...args);
    }
  }

  static warn(message: string, ...args: unknown[]): void {
    if (['debug', 'info', 'warn'].includes(this.logLevel)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  static error(message: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }

  static ipc(channel: string, message: string, ...args: unknown[]): void {
    this.debug(`[IPC:${channel}] ${message}`, ...args);
  }

  static file(operation: string, message: string, ...args: unknown[]): void {
    this.debug(`[FILE:${operation}] ${message}`, ...args);
  }

  static process(command: string, message: string, ...args: unknown[]): void {
    this.debug(`[PROCESS:${command}] ${message}`, ...args);
  }
}

// ============================================================================
// Common Error Messages
// ============================================================================

export const ELECTRON_ERROR_MESSAGES = {
  IPC_HANDLER_FAILED: 'IPC handler execution failed',
  FILE_NOT_FOUND: 'File not found',
  FILE_PERMISSION_DENIED: 'Permission denied for file operation',
  FILE_SYSTEM_ERROR: 'File system error occurred',
  PROCESS_EXECUTION_FAILED: 'Process execution failed',
  PROCESS_TIMEOUT: 'Process execution timed out',
  NETWORK_ERROR: 'Network operation failed',
  INVALID_PARAMETERS: 'Invalid parameters provided',
  SETTINGS_LOAD_FAILED: 'Failed to load settings',
  SETTINGS_SAVE_FAILED: 'Failed to save settings',
  DIALOG_CANCELLED: 'Dialog was cancelled by user',
  PATH_NOT_FOUND: 'Specified path does not exist',
  INVALID_URL: 'Invalid URL provided',
  DOWNLOAD_FAILED: 'Download operation failed',
  EXTRACTION_FAILED: 'Audio extraction failed',
  TRANSCRIPTION_FAILED: 'Transcription process failed',
  AI_PROCESSING_FAILED: 'AI processing failed',
  PREREQUISITE_MISSING: 'Required prerequisite is missing',
  PREREQUISITE_OUTDATED: 'Required prerequisite is outdated'
} as const;
