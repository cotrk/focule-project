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
