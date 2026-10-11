import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { downloadVideo } from './services/downloader';
import { extractAudio } from './services/ffmpeg';
import { transcribeAudio } from './services/transcriber';
import { processWithOllama, getAvailableModels, getStarterRecommendations, getRecommendedFromInstalled, categorizeInstalledModels, isEmbeddingModelName } from './services/ollama';
import { checkPrerequisites, setCustomPath } from './services/prerequisites';
import * as fs from 'fs';
import * as os from 'os';

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow() {
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
}

function getMainWindow() {
  return mainWindow;
}

// IPC Handlers
ipcMain.handle('download:start', async (_event, url: string) => {
  try {
    const result = await downloadVideo(url, (progress) => {
      mainWindow?.webContents.send('download:progress', progress);
    });
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('extract:audio', async (_event, videoPath: string, sessionId: string) => {
  try {
    const result = await extractAudio(videoPath, sessionId);
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('transcribe:start', async (_event, audioPath: string, model?: string) => {
  try {
    const result = await transcribeAudio(audioPath, model, (progress) => {
      mainWindow?.webContents.send('transcribe:progress', progress);
    });
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ollama:process', async (_event, transcript: string, model?: string) => {
  try {
    const result = await processWithOllama(transcript, model);
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ollama:get-models', async () => {
  try {
    const localModels = await getAvailableModels();
    const categorized = categorizeInstalledModels(localModels);
    const recommendedFromInstalled = getRecommendedFromInstalled(localModels);
    const starterRecommendations = getStarterRecommendations();
    
    return { 
      success: true, 
      localModels, 
      categorized,
      recommendedFromInstalled,
      starterRecommendations,
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message, 
      localModels: [], 
      categorized: { lightweight: [], balanced: [], performance: [] },
      recommendedFromInstalled: [],
      starterRecommendations: getStarterRecommendations(),
    };
  }
});

ipcMain.handle('settings:get', async () => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  // Default to user's Downloads folder for Windows desktop app
  const defaultOutputPath = path.join(app.getPath('downloads'), 'Focule');
  const defaultSettings = {
    outputPath: defaultOutputPath,
    whisperModel: 'base',
    ollamaModel: 'qwen3.5:4b',
  };
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      const settings = JSON.parse(data);
      const legacyModelNames: string[] = ['llama3', 'llama3.1:70b', 'qwen2.5:14b', 'qwen2.5:32b', 'mistral-nemo:12b'];
      const needsModelMigration = legacyModelNames.includes(settings.ollamaModel) ||
        (typeof settings.ollamaModel === 'string' && isEmbeddingModelName(settings.ollamaModel));
      if (needsModelMigration) {
        const installedModels = await getAvailableModels().catch((): string[] => []);
        const preferredModel = [
          'qwen3.5:4b',
          'qwen3.5:9b',
          'ministral-3:8b',
          'gemma4:e4b-it-qat',
        ].find(model => installedModels.includes(model));
        settings.ollamaModel = preferredModel || getRecommendedFromInstalled(installedModels)[0] || defaultSettings.ollamaModel;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      }
      return { ...defaultSettings, ...settings };
    }
    return defaultSettings;
  } catch (error) {
    console.error('[Settings] Could not load settings:', error);
    return defaultSettings;
  }
});

ipcMain.handle('settings:set', async (_event, settings: any) => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  if (typeof settings?.ollamaModel === 'string' && isEmbeddingModelName(settings.ollamaModel)) {
    return {
      success: false,
      error: 'Embedding-only models cannot generate social content. Choose a text-generation model in Settings.',
    };
  }

  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:save', async (_event, content: string, filename: string) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    // Default to user's Downloads/Focule folder
    let outputPath = path.join(app.getPath('downloads'), 'Focule');
    
    if (fs.existsSync(settingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        if (settings.outputPath) {
          outputPath = settings.outputPath;
        }
      } catch {
        // Use default if settings can't be read
      }
    }
    
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    const filePath = path.join(outputPath, filename);
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Save all project files to a unique folder
ipcMain.handle('file:save-project', async (_event, projectData: {
  title: string;
  transcript: string;
  transcriptWithTimestamps: string;
  socialContent?: any;
  videoPath?: string;
  audioPath?: string;
}) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    // Default to user's Downloads/Focule folder
    let basePath = path.join(app.getPath('downloads'), 'Focule');
    
    if (fs.existsSync(settingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        if (settings.outputPath) {
          basePath = settings.outputPath;
        }
      } catch {
        // Use default
      }
    }
    
    // Create unique project folder with timestamp
    const sanitizedTitle = projectData.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const projectFolder = path.join(basePath, `${sanitizedTitle}_${timestamp}`);
    
    fs.mkdirSync(projectFolder, { recursive: true });
    
    // Save transcript
    fs.writeFileSync(
      path.join(projectFolder, 'transcript.txt'),
      projectData.transcript,
      'utf-8'
    );
    
    // Save timestamped transcript
    fs.writeFileSync(
      path.join(projectFolder, 'transcript_timestamped.txt'),
      projectData.transcriptWithTimestamps,
      'utf-8'
    );
    
    // Save social content if available
    if (projectData.socialContent) {
      const socialText = `HOOK/TITLE:\n${projectData.socialContent.hook || ''}\n\nDESCRIPTION:\n${projectData.socialContent.description || ''}\n\nHASHTAGS:\n${(projectData.socialContent.hashtags || []).join(' ')}\n\nKEYWORDS:\n${(projectData.socialContent.keywords || []).join(', ')}\n\nFILENAME SUGGESTIONS:\n${(projectData.socialContent.filenames || []).join('\n')}\n\nIMAGE PROMPTS:\n${(projectData.socialContent.imagePrompts || []).join('\n\n')}`;
      fs.writeFileSync(
        path.join(projectFolder, 'social_content.txt'),
        socialText,
        'utf-8'
      );
    }
    
    // Copy video if exists
    if (projectData.videoPath && fs.existsSync(projectData.videoPath)) {
      const videoExt = path.extname(projectData.videoPath);
      const destVideo = path.join(projectFolder, `video${videoExt}`);
      fs.copyFileSync(projectData.videoPath, destVideo);
    }
    
    // Copy audio if exists
    if (projectData.audioPath && fs.existsSync(projectData.audioPath)) {
      const audioExt = path.extname(projectData.audioPath);
      const destAudio = path.join(projectFolder, `audio${audioExt}`);
      fs.copyFileSync(projectData.audioPath, destAudio);
    }
    
    // Save complete JSON
    const jsonData = {
      ...projectData,
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(
      path.join(projectFolder, 'project_data.json'),
      JSON.stringify(jsonData, null, 2),
      'utf-8'
    );
    
    return { success: true, path: projectFolder };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Open folder in system file explorer
ipcMain.handle('shell:open-folder', async (_event, folderPath: string) => {
  try {
    await shell.openPath(folderPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Export with folder dialog
ipcMain.handle('file:export-with-dialog', async (_event, projectData: {
  title: string;
  transcript: string;
  transcriptWithTimestamps: string;
  socialContent?: any;
  videoPath?: string;
  audioPath?: string;
}) => {
  try {
    // Show folder selection dialog
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Select Export Location',
      defaultPath: app.getPath('downloads'),
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const basePath = result.filePaths[0];
    
    // Create project folder
    const sanitizedTitle = projectData.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const projectFolder = path.join(basePath, `${sanitizedTitle}_${timestamp}`);
    
    fs.mkdirSync(projectFolder, { recursive: true });
    
    // Save all files
    fs.writeFileSync(path.join(projectFolder, 'transcript.txt'), projectData.transcript, 'utf-8');
    fs.writeFileSync(path.join(projectFolder, 'transcript_timestamped.txt'), projectData.transcriptWithTimestamps, 'utf-8');
    
    if (projectData.socialContent) {
      const hooksText = projectData.socialContent.hooks && projectData.socialContent.hooks.length > 0 
        ? projectData.socialContent.hooks.map((hook: string, index: number) => `${index + 1}. ${hook}`).join('\n')
        : 'No hooks available';
      
      const socialText = `HOOK/TITLE OPTIONS:\n${hooksText}\n\nDESCRIPTION:\n${projectData.socialContent.description || ''}\n\nHASHTAGS:\n${(projectData.socialContent.hashtags || []).join(' ')}\n\nKEYWORDS:\n${(projectData.socialContent.keywords || []).join(', ')}\n\nFILENAME SUGGESTIONS:\n${(projectData.socialContent.filenames || []).join('\n')}\n\nTEXT TO IMAGE PROMPTS:\n${(projectData.socialContent.imagePrompts || []).join('\n\n')}`;
      fs.writeFileSync(path.join(projectFolder, 'results.txt'), socialText, 'utf-8');
    }
    
    if (projectData.videoPath && fs.existsSync(projectData.videoPath)) {
      const videoExt = path.extname(projectData.videoPath);
      fs.copyFileSync(projectData.videoPath, path.join(projectFolder, `video${videoExt}`));
    }
    
    if (projectData.audioPath && fs.existsSync(projectData.audioPath)) {
      const audioExt = path.extname(projectData.audioPath);
      fs.copyFileSync(projectData.audioPath, path.join(projectFolder, `audio${audioExt}`));
    }
    
    fs.writeFileSync(
      path.join(projectFolder, 'project_data.json'),
      JSON.stringify({ ...projectData, generatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );
    
    return { success: true, path: projectFolder };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('prerequisites:check', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    const result = await checkPrerequisites(settingsPath);
    const find = (name: string) => result.prerequisites.find(prerequisite => prerequisite.name === name);
    const ffmpeg = find('Media Processor');
    const ytDlp = find('Video Downloader');
    const whisper = find('Voice Recognition');
    const ollama = find('AI Engine');
    const tools = {
      ffmpeg: { name: 'FFmpeg', installed: ffmpeg?.installed ?? false, version: ffmpeg?.version, path: ffmpeg?.path },
      'yt-dlp': { name: 'yt-dlp', installed: ytDlp?.installed ?? false, version: ytDlp?.version, path: ytDlp?.path },
      whisper: { name: 'Whisper', installed: whisper?.installed ?? false, version: whisper?.version, path: whisper?.path },
      ollama: {
        name: 'Ollama',
        installed: Boolean(ollama?.installed && ollama.note?.endsWith('model(s) available')),
        version: ollama?.version,
        path: ollama?.path,
      },
    };
    const missing = Object.entries(tools)
      .filter(([, status]) => !status.installed)
      .map(([name]) => name);
    return { success: true, ...result, tools, missing };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('prerequisites:set-path', async (_event, toolName: string, toolPath: string) => {
  try {
    setCustomPath(toolName, toolPath);
    // Also save to settings for persistence
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    let settings: any = {};
    if (fs.existsSync(settingsPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      } catch {}
    }
    if (!settings.customPaths) {
      settings.customPaths = {};
    }
    settings.customPaths[toolName] = toolPath;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('prerequisites:browse-path', async (_event, toolName: string) => {
  try {
    const isDirectory = toolName === 'export-directory';
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: isDirectory ? 'Select export directory' : `Select ${toolName} executable`,
      ...(isDirectory ? {} : {
        filters: [
          { name: 'Executable', extensions: process.platform === 'win32' ? ['exe'] : [''] },
          { name: 'All Files', extensions: ['*'] },
        ],
      }),
      properties: isDirectory ? ['openDirectory', 'createDirectory'] : ['openFile'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      setCustomPath(toolName, result.filePaths[0]);
      // Save to settings
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      let settings: any = {};
      if (fs.existsSync(settingsPath)) {
        try {
          settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        } catch {}
      }
      if (!settings.customPaths) {
        settings.customPaths = {};
      }
      settings.customPaths[toolName] = result.filePaths[0];
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      return { success: true, path: result.filePaths[0] };
    }
    return { success: false, canceled: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

export { getMainWindow };
