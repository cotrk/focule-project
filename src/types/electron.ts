import type {
  DownloadProgress, 
  TranscriptionProgress, 
  Settings, 
  FileSaveResult, 
  ProjectData,
  SocialContent
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
  setSettings: (settings: Settings) => Promise<{ success: boolean; error?: string }>;
  
  // File operations
  saveFile: (content: string, filename: string) => Promise<FileSaveResult>;
  saveProject: (projectData: ProjectData) => Promise<FileSaveResult>;
  exportWithDialog: (projectData: ProjectData) => Promise<FileSaveResult>;
  openFolder: (folderPath: string) => Promise<void>;
  
  // Prerequisites management
  prerequisites: {
    check: () => Promise<PrerequisitesCheckResult>;
    setPath: (toolName: string, toolPath: string) => Promise<{ success: boolean; error?: string }>;
    browsePath: (toolName: string) => Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>;
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
  socialContent?: SocialContent;
  model?: string;
  error?: string;
}

export interface GetOllamaModelsResult {
  success: boolean;
  localModels?: string[];
  categorized?: {
    lightweight: string[];
    balanced: string[];
    performance: string[];
  };
  recommendedFromInstalled?: string[];
  starterRecommendations?: {
    name: string;
    tier: 'lightweight' | 'balanced' | 'performance';
    paramRange: string;
    vram: string;
    description: string;
    url: string;
  }[];
  error?: string;
}

export interface PrerequisitesCheckResult {
  success: boolean;
  prerequisites?: {
    name: string;
    installed: boolean;
    version?: string;
    path?: string;
    customPath?: string;
    downloadUrl?: string;
    installCommand?: string;
    checkCommand?: string;
    category: 'required' | 'optional';
    note?: string;
  }[];
  allRequiredInstalled?: boolean;
  tools?: Record<string, {
    name: string;
    installed: boolean;
    version?: string;
    path?: string;
  }>;
  missing?: string[];
  error?: string;
}

export {};
