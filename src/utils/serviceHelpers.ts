import type { 
  DownloadVideoResult, 
  ExtractAudioResult, 
  TranscribeAudioResult, 
  OllamaProcessResult 
} from '../types';

// ============================================================================
// Service Result Handler - Eliminates Duplicate Error Handling
// ============================================================================

export interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  sessionId?: string;
}

export function handleServiceResult<T>(
  result: ServiceResult<T>,
  operation: string
): T {
  if (!result.success) {
    throw new Error(result.error || `${operation} failed`);
  }
  return result.data as T;
}

export function createServiceResult<T>(
  success: boolean,
  data?: T,
  error?: string,
  sessionId?: string
): ServiceResult<T> {
  return {
    success,
    data,
    error,
    sessionId
  };
}

// ============================================================================
// Enhanced Type Guards and Validation
// ============================================================================

export function isValidDownloadResult(result: unknown): result is DownloadVideoResult {
  const r = result as DownloadVideoResult;
  return (
    typeof r === 'object' &&
    r !== null &&
    typeof r.success === 'boolean' &&
    (r.success ? 
      (typeof r.videoPath === 'string' && typeof r.sessionId === 'string') :
      typeof r.error === 'string'
    )
  );
}

export function isValidExtractAudioResult(result: unknown): result is ExtractAudioResult {
  const r = result as ExtractAudioResult;
  return (
    typeof r === 'object' &&
    r !== null &&
    typeof r.success === 'boolean' &&
    (r.success ? typeof r.audioPath === 'string' : typeof r.error === 'string')
  );
}

export function isValidTranscribeResult(result: unknown): result is TranscribeAudioResult {
  const r = result as TranscribeAudioResult;
  return (
    typeof r === 'object' &&
    r !== null &&
    typeof r.success === 'boolean' &&
    (r.success ? 
      (typeof r.transcript === 'string' && typeof r.transcriptWithTimestamps === 'string') :
      typeof r.error === 'string'
    )
  );
}

export function isValidOllamaResult(result: unknown): result is OllamaProcessResult {
  const r = result as OllamaProcessResult;
  return (
    typeof r === 'object' &&
    r !== null &&
    typeof r.success === 'boolean' &&
    (r.success ? 
      (r.socialContent !== undefined && typeof r.model === 'string') :
      typeof r.error === 'string'
    )
  );
}

// ============================================================================
// Progress Tracking Utilities
// ============================================================================

export interface ProgressUpdate {
  percent: number;
  message: string;
  details?: string;
}

export function createProgressUpdater(
  setProgress: (update: ProgressUpdate) => void,
  baseProgress: number = 0,
  progressRange: number = 100
): (percent: number, message: string, details?: string) => void {
  return (percent: number, message: string, details?: string): void => {
    const adjustedProgress = baseProgress + (percent / 100) * progressRange;
    setProgress({
      percent: Math.min(adjustedProgress, 100),
      message,
      details
    });
  };
}

// ============================================================================
// Async Operation Wrapper with Consistent Error Handling
// ============================================================================

export async function withProgressTracking<T>(
  operation: () => Promise<T>,
  progressCallback: (update: ProgressUpdate) => void,
  startMessage: string,
  successMessage?: string
): Promise<T> {
  progressCallback({ percent: 0, message: startMessage });
  
  try {
    const result = await operation();
    
    if (successMessage) {
      progressCallback({ percent: 100, message: successMessage });
    }
    
    return result;
  } catch (error) {
    progressCallback({
      percent: 0,
      message: error instanceof Error ? error.message : 'Operation failed'
    });
    throw error;
  }
}

// ============================================================================
// Session Management Utilities
// ============================================================================

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createSessionContext(sessionId?: string) {
  return {
    sessionId: sessionId || generateSessionId(),
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    platform: navigator.platform
  };
}

// ============================================================================
// File Path Validation
// ============================================================================

export function isValidFilePath(path: unknown): path is string {
  return typeof path === 'string' && path.length > 0 && !path.includes('..');
}

export function sanitizeFilePath(path: string): string {
  return path.replace(/\.\./g, '').replace(/[\\/]/g, '/');
}

// ============================================================================
// URL Validation Enhancement
// ============================================================================

export function validateVideoURL(url: string): {
  isValid: boolean;
  platform?: 'youtube' | 'twitch' | 'vimeo' | 'other';
  error?: string;
} {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    const hostname = urlObj.hostname.toLowerCase();
    
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return { isValid: true, platform: 'youtube' };
    } else if (hostname.includes('twitch.tv')) {
      return { isValid: true, platform: 'twitch' };
    } else if (hostname.includes('vimeo.com')) {
      return { isValid: true, platform: 'vimeo' };
    } else {
      return { isValid: true, platform: 'other' };
    }
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

// ============================================================================
// Model Configuration Validation
// ============================================================================

export const WHISPER_MODELS = ['tiny', 'base', 'small', 'medium', 'large'] as const;
export type WhisperModel = typeof WHISPER_MODELS[number];

export function isValidWhisperModel(model: unknown): model is WhisperModel {
  return typeof model === 'string' && WHISPER_MODELS.includes(model as WhisperModel);
}

export function isValidOllamaModel(model: unknown): model is string {
  return typeof model === 'string' && model.length > 0;
}

// ============================================================================
// Error Message Standardization
// ============================================================================

export const ERROR_MESSAGES = {
  DOWNLOAD_FAILED: 'Video download failed. Please check the URL and try again.',
  AUDIO_EXTRACTION_FAILED: 'Audio extraction failed. The video file may be corrupted.',
  TRANSCRIPTION_FAILED: 'Transcription failed. Please try again with a different model.',
  AI_PROCESSING_FAILED: 'AI processing failed. Continuing without social content generation.',
  ELECTRON_API_UNAVAILABLE: 'Electron API not available. This app must be run in Electron.',
  INVALID_URL: 'Please enter a valid video URL.',
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  PERMISSION_DENIED: 'Permission denied. Please check file and folder permissions.',
  DISK_SPACE_INSUFFICIENT: 'Insufficient disk space. Please free up space and try again.',
  SESSION_EXPIRED: 'Session has expired. Please start a new transcription.',
  MODEL_NOT_AVAILABLE: 'Selected model is not available. Please choose a different model.',
  FILE_NOT_FOUND: 'File not found. Please check the file path and try again.',
  INVALID_FILE_FORMAT: 'Invalid file format. Please use a supported video format.',
  PROCESSING_TIMEOUT: 'Processing timed out. Please try again.',
  QUOTA_EXCEEDED: 'Processing quota exceeded. Please try again later.'
} as const;

export function getErrorMessage(error: unknown, fallback?: string): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    // Map common error messages to standardized ones
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    if (message.includes('permission')) {
      return ERROR_MESSAGES.PERMISSION_DENIED;
    }
    
    if (message.includes('disk') || message.includes('space')) {
      return ERROR_MESSAGES.DISK_SPACE_INSUFFICIENT;
    }
    
    if (message.includes('timeout')) {
      return ERROR_MESSAGES.PROCESSING_TIMEOUT;
    }
    
    return error.message;
  }
  
  return fallback || ERROR_MESSAGES.TRANSCRIPTION_FAILED;
}
