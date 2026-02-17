// Core domain types for the video transcriber application

export interface SocialContent {
  hooks: string[];
  description: string;
  hashtags: string[];
  keywords: string[];
  filenames: string[];
  imagePrompts: string[];
}

export interface TranscriptionResult {
  transcript: string;
  transcriptWithTimestamps: string;
  socialContent?: SocialContent;
  title: string;
  videoPath?: string;
  audioPath?: string;
  ollamaModel?: string;
  whisperModel?: string;
}

export type TranscriptionStatus = 
  | 'idle' 
  | 'downloading' 
  | 'extracting' 
  | 'transcribing' 
  | 'processing' 
  | 'complete' 
  | 'error';

export interface TranscriptionState {
  status: TranscriptionStatus;
  progress: number; // 0-100
  message: string;
  result?: TranscriptionResult;
  error?: string;
}

// Progress tracking types
export interface DownloadProgress {
  percent: number;
  downloaded?: string;
  total?: string;
  speed?: string;
  eta?: string;
}

export interface TranscriptionProgress {
  percent: number;
  status: string;
  current?: string;
  total?: string;
}

// Enhanced result types for better type safety
export interface DownloadVideoResult {
  success: boolean;
  videoPath?: string;
  title?: string;
  sessionId?: string;
  error?: string;
}

export interface ExtractAudioResult {
  success: boolean;
  audioPath?: string;
  error?: string;
}

export interface TranscribeAudioResult {
  success: boolean;
  transcript?: string;
  transcriptWithTimestamps?: string;
  model?: string;
  error?: string;
}

export interface OllamaProcessResult {
  success: boolean;
  socialContent?: SocialContent;
  model?: string;
  error?: string;
}

// Error handling types
export interface ErrorContext {
  operation?: string;
  sessionId?: string;
  stackTrace?: string;
  timestamp?: string;
  userAgent?: string;
  [key: string]: unknown;
}

export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'skip';
  maxAttempts?: number;
  delay?: number;
  fallbackOptions?: string[];
  userMessage?: string;
  requiresUserAction?: boolean;
}

// Performance and memory types
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface SystemInfo {
  userAgent: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  screenResolution: string;
  viewport: string;
  memoryUsage?: string;
}

// Window extensions for Electron API
export interface WindowExtensions {
  electronAPI: import('./electron').ElectronAPI;
  emailReportData?: {
    gmail?: string;
    outlook?: string;
    mailto?: string;
  };
}

// Generic function types for hooks
export type GenericFunction = (...args: unknown[]) => unknown;
export type DebouncedFunction<T extends GenericFunction> = T;
export type ThrottledFunction<T extends GenericFunction> = T;

// Settings types
export interface Settings {
  outputPath: string;
  whisperModel: WhisperModel;
  ollamaModel: string;
}

export type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large';

// Model information types
export interface WhisperModelInfo {
  id: WhisperModel;
  name: string;
  description: string;
  size?: string;
  accuracy?: 'basic' | 'good' | 'high' | 'maximum';
}

export interface OllamaModel {
  name: string;
  size: string;
  digest: string;
  modified_at: string;
}

// File operation types
export interface FileSaveResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface ProjectData {
  transcript: string;
  socialContent?: SocialContent;
  metadata: {
    title: string;
    createdAt: string;
    models: {
      whisper?: string;
      ollama?: string;
    };
  };
}

// Keyboard shortcut types
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

// Validation types
export interface URLValidationResult {
  isValid: boolean;
  platform?: 'youtube' | 'twitch' | 'vimeo' | 'other';
  error?: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

// Component prop types with enhanced validation
export interface ProgressBarProps {
  label: string;
  percent: number; // 0-100
  status?: string;
  details?: string;
  animated?: boolean;
}

export interface URLInputProps {
  onStart: (url: string) => void;
  disabled?: boolean;
  placeholder?: string;
  validateURL?: boolean;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  theme: Theme;
  accentColor?: string;
  customCSS?: string;
}
