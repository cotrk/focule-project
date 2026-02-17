// Centralized utility exports
export * from './serviceHelpers';
export * from './errorHandling';
export * from './logger';
export * from './performance';

// Re-export commonly used utilities
export { 
  validateURL, 
  validateProgress,
  generateSessionId,
  createSessionContext 
} from './serviceHelpers';

export { 
  ErrorLogger,
  TranscriptionError,
  NetworkError,
  ValidationError,
  ElectronAPIError,
  VideoProcessingError,
  AIModelError,
  ResourceExhaustionError,
  SessionRecoveryError,
  withErrorHandling,
  retry,
  ToastManager,
  ERROR_MESSAGES
} from './errorHandling';

export { logger } from './logger';
