import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Download service
  downloadVideo: (url: string) => ipcRenderer.invoke('download:start', url),
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('download:progress', (_event, progress) => callback(progress));
  },
  
  // Audio extraction
  extractAudio: (videoPath: string) => ipcRenderer.invoke('extract:audio', videoPath),
  
  // Transcription service
  transcribeAudio: (audioPath: string, model?: string) => 
    ipcRenderer.invoke('transcribe:start', audioPath, model),
  onTranscribeProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('transcribe:progress', (_event, progress) => callback(progress));
  },
  
  // Ollama service
  processWithOllama: (transcript: string, model?: string) =>
    ipcRenderer.invoke('ollama:process', transcript, model),
  getOllamaModels: () => ipcRenderer.invoke('ollama:get-models'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: any) => ipcRenderer.invoke('settings:set', settings),
  
  // File operations
  saveFile: (content: string, filename: string) =>
    ipcRenderer.invoke('file:save', content, filename),
  saveProject: (projectData: any) =>
    ipcRenderer.invoke('file:save-project', projectData),
  exportWithDialog: (projectData: any) =>
    ipcRenderer.invoke('file:export-with-dialog', projectData),
  openFolder: (folderPath: string) =>
    ipcRenderer.invoke('shell:open-folder', folderPath),
  
  // Prerequisites
  prerequisites: {
    check: () => ipcRenderer.invoke('prerequisites:check'),
    setPath: (toolName: string, toolPath: string) =>
      ipcRenderer.invoke('prerequisites:set-path', toolName, toolPath),
    browsePath: (toolName: string) =>
      ipcRenderer.invoke('prerequisites:browse-path', toolName),
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
});

