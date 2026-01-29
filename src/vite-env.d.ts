/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    downloadVideo: (url: string) => Promise<any>;
    onDownloadProgress: (callback: (progress: any) => void) => void;
    extractAudio: (videoPath: string) => Promise<any>;
    transcribeAudio: (audioPath: string, model?: string) => Promise<any>;
    onTranscribeProgress: (callback: (progress: any) => void) => void;
    processWithOllama: (transcript: string, model?: string) => Promise<any>;
    getOllamaModels: () => Promise<any>;
    getSettings: () => Promise<any>;
    setSettings: (settings: any) => Promise<any>;
    saveFile: (content: string, filename: string) => Promise<any>;
    saveProject: (projectData: any) => Promise<any>;
    exportWithDialog: (projectData: any) => Promise<any>;
    openFolder: (folderPath: string) => Promise<any>;
    prerequisites: {
      check: () => Promise<any>;
      setPath: (toolName: string, toolPath: string) => Promise<any>;
      browsePath: (toolName: string) => Promise<any>;
    };
    removeAllListeners: (channel: string) => void;
  };
}

