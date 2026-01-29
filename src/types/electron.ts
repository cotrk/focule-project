import type { 
  DownloadProgress, 
  TranscriptionProgress, 
  Settings, 
  OllamaModel, 
  FileSaveResult, 
  ProjectData
} from './index';

// Type-safe Electron API interface
export interface ElectronAPI {
  // Download service
  downloadVideo: (url: string) => Promise<DownloadVideoResult>;
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void;
  
  // Audio extraction
  extractAudio: (videoPath: string, sessionId: string) => Promise<ExtractAudioResult>;
  
  // Transcription service
  transcribeAudio: (audioPath: string, model?: string) => Promise<TranscribeAudioResult>;
  onTranscribeProgress: (callback: (progress: TranscriptionProgress) => void) => void;
  
  // Ollama service
  processWithOllama: (transcript: string, model?: string) => Promise<OllamaProcessResult>;
  getOllamaModels: () => Promise<GetOllamaModelsResult>;
  
  // Settings management
  getSettings: () => Promise<Settings>;
  setSettings: (settings: Settings) => Promise<void>;
  
  // File operations
  saveFile: (content: string, filename: string) => Promise<FileSaveResult>;
  saveProject: (projectData: ProjectData) => Promise<FileSaveResult>;
  exportWithDialog: (projectData: ProjectData) => Promise<FileSaveResult>;
  openFolder: (folderPath: string) => Promise<void>;
  
  // Prerequisites management
  prerequisites: {
    check: () => Promise<PrerequisitesCheckResult>;
    setPath: (toolName: string, toolPath: string) => Promise<void>;
    browsePath: (toolName: string) => Promise<string>;
  };
  
  // Event cleanup
  removeAllListeners: (channel: string) => void;
}

// Result types for Electron operations
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
  socialContent?: import('./index').SocialContent;
  model?: string;
  error?: string;
}

export interface GetOllamaModelsResult {
  success: boolean;
  localModels?: OllamaModel[];
  availableModels?: OllamaModel[];
  error?: string;
}

export interface PrerequisitesCheckResult {
  success: boolean;
  tools: Record<string, {
    name: string;
    installed: boolean;
    version?: string;
    path?: string;
  }>;
  missing: string[];
  error?: string;
}

export {};
