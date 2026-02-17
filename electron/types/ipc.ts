// ============================================================================
// Electron IPC Type Definitions
// ============================================================================

export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DownloadProgress {
  percent: number;
  downloaded?: string;
  total?: string;
  speed?: string;
  eta?: string;
  filename?: string;
}

export interface TranscriptionProgress {
  percent: number;
  status: string;
  current?: string;
  total?: string;
  speed?: string;
  eta?: string;
}

export interface DownloadResult {
  videoPath: string;
  title: string;
  sessionId: string;
  duration?: string;
  format?: string;
  size?: number;
}

export interface ExtractAudioResult {
  audioPath: string;
  duration: number;
  format: string;
  size: number;
}

export interface TranscriptionResult {
  transcript: string;
  transcriptWithTimestamps: string;
  model: string;
  duration: number;
  processingTime: number;
}

export interface OllamaModelsResponse {
  localModels: OllamaModel[];
  categorized: {
    lightweight: OllamaModel[];
    balanced: OllamaModel[];
    performance: OllamaModel[];
  };
  recommendedFromInstalled: OllamaModel[];
  starterRecommendations: OllamaModel[];
}

export interface OllamaModel {
  name: string;
  size: string;
  digest: string;
  modified_at: string;
  parameters?: number;
  family?: string;
}

export interface SocialContent {
  hooks: string[];
  description: string;
  hashtags: string[];
  keywords: string[];
  filenames: string[];
  imagePrompts: string[];
}

export interface ProjectData {
  title: string;
  transcript: string;
  transcriptWithTimestamps: string;
  socialContent?: SocialContent;
  videoPath?: string;
  audioPath?: string;
}

export interface Settings {
  outputPath: string;
  whisperModel: WhisperModel;
  ollamaModel: string;
  customPaths?: Record<string, string>;
}

export type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large';

export interface FileSaveResult {
  filePath: string;
  success: boolean;
}

export interface PrerequisiteCheck {
  tool: string;
  installed: boolean;
  version?: string;
  path?: string;
  status: 'ok' | 'missing' | 'outdated';
}

export interface PrerequisitesResult {
  allInstalled: boolean;
  checks: PrerequisiteCheck[];
  recommendations: string[];
}

// ============================================================================
// IPC Channel Types
// ============================================================================

export type IPCChannel = 
  | 'download:start'
  | 'download:progress'
  | 'extract:audio'
  | 'transcribe:start'
  | 'transcribe:progress'
  | 'ollama:process'
  | 'ollama:get-models'
  | 'settings:get'
  | 'settings:set'
  | 'file:save'
  | 'file:save-project'
  | 'file:export-with-dialog'
  | 'shell:open-folder'
  | 'prerequisites:check'
  | 'prerequisites:set-path'
  | 'prerequisites:browse-path';

// ============================================================================
// API Handler Types
// ============================================================================

export type IPCHandler<T = unknown, R = unknown> = (
  event: Electron.IpcMainInvokeEvent,
  ...args: T[]
) => Promise<IPCResponse<R>>;

export interface IPCAPI {
  // Download service
  downloadVideo: (url: string) => Promise<IPCResponse<DownloadResult>>;
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void;
  
  // Audio extraction
  extractAudio: (videoPath: string, sessionId: string) => Promise<IPCResponse<ExtractAudioResult>>;
  
  // Transcription service
  transcribeAudio: (audioPath: string, model?: string) => Promise<IPCResponse<TranscriptionResult>>;
  onTranscribeProgress: (callback: (progress: TranscriptionProgress) => void) => void;
  
  // Ollama service
  processWithOllama: (transcript: string, model?: string) => Promise<IPCResponse<SocialContent>>;
  getOllamaModels: () => Promise<IPCResponse<OllamaModelsResponse>>;
  
  // Settings
  getSettings: () => Promise<IPCResponse<Settings>>;
  setSettings: (settings: Settings) => Promise<IPCResponse<void>>;
  
  // File operations
  saveFile: (content: string, filename: string) => Promise<IPCResponse<FileSaveResult>>;
  saveProject: (projectData: ProjectData) => Promise<IPCResponse<FileSaveResult>>;
  exportWithDialog: (projectData: ProjectData) => Promise<IPCResponse<FileSaveResult>>;
  openFolder: (folderPath: string) => Promise<IPCResponse<void>>;
  
  // Prerequisites
  prerequisites: {
    check: () => Promise<IPCResponse<PrerequisitesResult>>;
    setPath: (toolName: string, toolPath: string) => Promise<IPCResponse<void>>;
    browsePath: (toolName: string) => Promise<IPCResponse<string | { canceled: true }>>;
  };
  
  // Utilities
  removeAllListeners: (channel: string) => void;
}
