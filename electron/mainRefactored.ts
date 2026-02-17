import { app, BrowserWindow, ipcMain, shell, dialog, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import { extractAudio } from './services/ffmpeg';
import { downloadVideo } from './services/downloader';
import { transcribeAudio } from './services/transcriber';
import { processWithOllama, getAvailableModels, getStarterRecommendations, getRecommendedFromInstalled, categorizeInstalledModels } from './services/ollama';
import { checkPrerequisites, setCustomPath } from './services/prerequisites';
import { 
  wrapIPCHandler, 
  ElectronLogger
} from './utils/errorHandler';
import { 
  FileManager, 
  ExportDialogManager, 
  PathValidator 
} from './utils/fileManager';
import type { 
  DownloadResult, 
  ExtractAudioResult, 
  TranscriptionResult, 
  OllamaModelsResponse, 
  OllamaModel, 
  SocialContent, 
  ProjectData, 
  Settings, 
  FileSaveResult, 
  PrerequisitesResult,
  PrerequisiteCheck,
  WhisperModel 
} from './types/ipc';

// ============================================================================
// Application State
// ============================================================================

let mainWindow: BrowserWindow | null = null;
const isDev = !app.isPackaged;

// ============================================================================
// Window Management
// ============================================================================

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // DevTools disabled - uncomment below to re-enable for debugging
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  ElectronLogger.info('Main window created', { isDev });
}

function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

// ============================================================================
// IPC Handlers - Download Service
// ============================================================================

ipcMain.handle(
  'download:start',
  wrapIPCHandler(async (event: IpcMainInvokeEvent, url: string): Promise<DownloadResult> => {
    ElectronLogger.ipc('download:start', 'Starting download', { url });
    
    const result = await downloadVideo(url, (progress) => {
      mainWindow?.webContents.send('download:progress', progress);
      ElectronLogger.ipc('download:progress', 'Progress update', progress);
    });
    
    ElectronLogger.ipc('download:start', 'Download completed', { 
      videoPath: result.videoPath, 
      title: result.title 
    });
    
    return {
      ...result,
      duration: result.duration?.toString() || ''
    };
  }, 'download')
);

// ============================================================================
// IPC Handlers - Audio Extraction
// ============================================================================

ipcMain.handle(
  'extract:audio',
  wrapIPCHandler(async (event: IpcMainInvokeEvent, videoPath: string, sessionId: string): Promise<ExtractAudioResult> => {
    ElectronLogger.ipc('extract:audio', 'Starting audio extraction', { 
      videoPath, 
      sessionId 
    });
    
    const result = await extractAudio(videoPath, sessionId);
    
    ElectronLogger.ipc('extract:audio', 'Audio extraction completed', { 
      audioPath: result.audioPath,
      duration: result.duration 
    });
    
    return {
      audioPath: result.audioPath,
      duration: result.duration || 0,
      format: 'mp3', // Default format
      size: 0 // Not available from service
    };
  }, 'audio extraction')
);

// ============================================================================
// IPC Handlers - Transcription Service
// ============================================================================

ipcMain.handle(
  'transcribe:start',
  wrapIPCHandler(async (event: IpcMainInvokeEvent, audioPath: string, model?: string): Promise<TranscriptionResult> => {
    ElectronLogger.ipc('transcribe:start', 'Starting transcription', { 
      audioPath, 
      model: model || 'base' 
    });
    
    const result = await transcribeAudio(audioPath, model || 'base', (progress) => {
      mainWindow?.webContents.send('transcribe:progress', progress);
      ElectronLogger.ipc('transcribe:progress', 'Progress update', progress);
    });
    
    ElectronLogger.ipc('transcribe:start', 'Transcription completed', { 
      audioPath, 
      textLength: result.transcript.length 
    });
    
    return {
      transcript: result.transcript,
      transcriptWithTimestamps: result.transcriptWithTimestamps || result.transcript,
      model: model || 'base',
      duration: 0, // Not available from transcriber service
      processingTime: 0 // Not available from transcriber service
    };
  }, 'transcription')
);

// ============================================================================
// IPC Handlers - Ollama Service
// ============================================================================

ipcMain.handle(
  'ollama:process',
  wrapIPCHandler(async (event: IpcMainInvokeEvent, transcript: string, model?: string) => {
    ElectronLogger.ipc('ollama:process', 'Starting AI processing', { model });
    
    const result = await processWithOllama(transcript, model);
    
    ElectronLogger.ipc('ollama:process', 'AI processing completed');
    
    return result;
  }, 'ollama processing')
);

ipcMain.handle(
  'ollama:get-models',
  wrapIPCHandler(async (): Promise<OllamaModelsResponse> => {
    ElectronLogger.ipc('ollama:get-models', 'Fetching available models');
    
    const localModels = await getAvailableModels();
    const categorized = categorizeInstalledModels(localModels);
    const recommendedFromInstalled = getRecommendedFromInstalled(localModels);
    const starterRecommendations = getStarterRecommendations();
    
    const response = { 
      localModels: localModels.map(name => ({ name, size: 'unknown', digest: 'unknown', modified_at: 'unknown' })), 
      categorized: {
        lightweight: categorized.lightweight.map(name => ({ name, size: 'unknown', digest: 'unknown', modified_at: 'unknown' })),
        balanced: categorized.balanced.map(name => ({ name, size: 'unknown', digest: 'unknown', modified_at: 'unknown' })),
        performance: categorized.performance.map(name => ({ name, size: 'unknown', digest: 'unknown', modified_at: 'unknown' }))
      },
      recommendedFromInstalled: recommendedFromInstalled.map(name => ({ name, size: 'unknown', digest: 'unknown', modified_at: 'unknown' })),
      starterRecommendations: starterRecommendations.map(rec => ({ 
        name: rec.name, 
        size: 'unknown', 
        digest: 'unknown', 
        modified_at: 'unknown',
        parameters: undefined,
        family: undefined
      })),
    };
    
    ElectronLogger.ipc('ollama:get-models', 'Models fetched successfully', {
      modelCount: localModels.length
    });
    
    return response;
  }, 'get ollama models')
);

// ============================================================================
// IPC Handlers - Settings
// ============================================================================

ipcMain.handle(
  'settings:get',
  wrapIPCHandler(async (): Promise<Settings> => {
    ElectronLogger.ipc('settings:get', 'Loading settings');
    
    const settings = await FileManager.getSettings();
    
    ElectronLogger.ipc('settings:get', 'Settings loaded', {
      outputPath: settings.outputPath,
      whisperModel: settings.whisperModel,
      ollamaModel: settings.ollamaModel
    });
    
    return settings;
  }, 'get settings')
);

ipcMain.handle(
  'settings:set',
  wrapIPCHandler(async (event: IpcMainInvokeEvent, settings: Settings): Promise<void> => {
    ElectronLogger.ipc('settings:set', 'Saving settings', {
      outputPath: settings.outputPath,
      whisperModel: settings.whisperModel,
      ollamaModel: settings.ollamaModel
    });
    
    await FileManager.setSettings(settings);
    
    ElectronLogger.ipc('settings:set', 'Settings saved successfully');
  }, 'set settings')
);

// ============================================================================
// IPC Handlers - File Operations
// ============================================================================

ipcMain.handle(
  'file:save',
  wrapIPCHandler(async (event: IpcMainInvokeEvent, content: string, filename: string): Promise<FileSaveResult> => {
    ElectronLogger.ipc('file:save', 'Saving file', { filename });
    
    // Validate inputs
    const filenameValidation = PathValidator.validateFileName(filename);
    if (!filenameValidation.valid) {
      throw new Error(filenameValidation.error || 'Invalid filename');
    }
    
    const result = await FileManager.saveFile(content, filename);
    
    ElectronLogger.ipc('file:save', 'File saved successfully', result);
    
    return result;
  }, 'save file')
);

ipcMain.handle(
  'file:save-project',
  wrapIPCHandler(async (event: IpcMainInvokeEvent, projectData: ProjectData): Promise<FileSaveResult> => {
    ElectronLogger.ipc('file:save-project', 'Saving project', { 
      title: projectData.title 
    });
    
    // Validate project data
    if (!projectData.title || !projectData.transcript) {
      throw new Error('Project title and transcript are required');
    }
    
    const result = await FileManager.saveProject(projectData);
    
    ElectronLogger.ipc('file:save-project', 'Project saved successfully', result);
    
    return result;
  }, 'save project')
);

ipcMain.handle(
  'file:export-with-dialog',
  wrapIPCHandler(async (event: IpcMainInvokeEvent, projectData: ProjectData): Promise<FileSaveResult> => {
    ElectronLogger.ipc('file:export-with-dialog', 'Starting export with dialog');
    
    if (!mainWindow) {
      throw new Error('Main window is not available');
    }
    
    // Validate project data
    if (!projectData.title || !projectData.transcript) {
      throw new Error('Project title and transcript are required');
    }
    
    const result = await ExportDialogManager.showExportDialog(mainWindow, projectData);
    
    ElectronLogger.ipc('file:export-with-dialog', 'Export completed successfully', result);
    
    return result;
  }, 'export with dialog')
);

// ============================================================================
// IPC Handlers - Shell Operations
// ============================================================================

ipcMain.handle(
  'shell:open-folder',
  wrapIPCHandler(async (event: IpcMainInvokeEvent, folderPath: string): Promise<void> => {
    ElectronLogger.ipc('shell:open-folder', 'Opening folder', { folderPath });
    
    // Validate path
    const pathValidation = PathValidator.validatePath(folderPath);
    if (!pathValidation.valid) {
      throw new Error(pathValidation.error || 'Invalid folder path');
    }
    
    // Ensure folder exists
    await FileManager.ensureDirectoryExists(folderPath);
    
    await shell.openPath(folderPath);
    
    ElectronLogger.ipc('shell:open-folder', 'Folder opened successfully', { folderPath });
  }, 'open folder')
);

// ============================================================================
// IPC Handlers - Prerequisites
// ============================================================================

ipcMain.handle(
  'prerequisites:check',
  wrapIPCHandler(async (_event: IpcMainInvokeEvent): Promise<PrerequisitesResult> => {
    ElectronLogger.ipc('prerequisites:check', 'Checking prerequisites');
    
    const settingsPath = FileManager.getSettingsPath();
    const result = await checkPrerequisites(settingsPath);
    
    ElectronLogger.ipc('prerequisites:check', 'Prerequisites check completed', {
      allInstalled: result.prerequisites?.filter(p => p.installed).length === result.prerequisites?.length || false,
      checkCount: result.prerequisites?.length || 0
    });
    
    return {
      allInstalled: result.prerequisites?.filter(p => p.installed).length === result.prerequisites?.length || false,
      checks: result.prerequisites?.map(p => ({ 
        tool: p.name, 
        installed: p.installed,
        status: p.installed ? 'ok' : 'missing',
        version: p.version,
        path: p.path
      })) || [],
      recommendations: []
    };
  }, 'check prerequisites')
);

ipcMain.handle(
  'prerequisites:set-path',
  wrapIPCHandler(async (event: IpcMainInvokeEvent, toolName: string, toolPath: string): Promise<void> => {
    ElectronLogger.ipc('prerequisites:set-path', 'Setting custom path', { 
      toolName, 
      toolPath 
    });
    
    // Validate path
    const pathValidation = PathValidator.validatePath(toolPath);
    if (!pathValidation.valid) {
      throw new Error(pathValidation.error || 'Invalid tool path');
    }
    
    setCustomPath(toolName, toolPath);
    
    // Also save to settings for persistence
    const settings = await FileManager.getSettings();
    if (!settings.customPaths) {
      settings.customPaths = {};
    }
    settings.customPaths[toolName] = toolPath;
    await FileManager.setSettings(settings);
    
    ElectronLogger.ipc('prerequisites:set-path', 'Custom path set successfully');
  }, 'set prerequisite path')
);

ipcMain.handle(
  'prerequisites:browse-path',
  wrapIPCHandler(async (event: IpcMainInvokeEvent, toolName: string): Promise<string | { canceled: true }> => {
    ElectronLogger.ipc('prerequisites:browse-path', 'Browsing for tool path', { toolName });
    
    if (!mainWindow) {
      throw new Error('Main window is not available');
    }
    
    const result = await dialog.showOpenDialog(mainWindow, {
      title: `Select ${toolName} executable`,
      filters: [
        { name: 'Executable', extensions: process.platform === 'win32' ? ['exe'] : [''] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      ElectronLogger.ipc('prerequisites:browse-path', 'Dialog cancelled');
      return { canceled: true };
    }

    const selectedPath = result.filePaths[0];
    
    // Validate path
    const pathValidation = PathValidator.validatePath(selectedPath);
    if (!pathValidation.valid) {
      throw new Error(pathValidation.error || 'Invalid selected path');
    }
    
    setCustomPath(toolName, selectedPath);
    
    // Save to settings
    const settings = await FileManager.getSettings();
    if (!settings.customPaths) {
      settings.customPaths = {};
    }
    settings.customPaths[toolName] = selectedPath;
    await FileManager.setSettings(settings);
    
    ElectronLogger.ipc('prerequisites:browse-path', 'Tool path selected', { 
      toolName, 
      path: selectedPath 
    });
    
    return selectedPath;
  }, 'browse prerequisite path')
);

// ============================================================================
// Application Lifecycle
// ============================================================================

app.whenReady().then(() => {
  ElectronLogger.info('Application ready', { isDev });
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      ElectronLogger.info('Creating window on activate');
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  ElectronLogger.info('All windows closed');
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================================================
// Error Handling
// ============================================================================

process.on('uncaughtException', (error) => {
  ElectronLogger.error('Uncaught exception', error);
  // In production, you might want to restart the app or exit gracefully
  if (!isDev) {
    app.quit();
  }
});

process.on('unhandledRejection', (reason, promise) => {
  ElectronLogger.error('Unhandled rejection', { reason, promise });
});

// ============================================================================
// Exports
// ============================================================================

export { getMainWindow };
