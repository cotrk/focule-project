import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { safeFileOperation, FileOperationError, ElectronLogger } from './errorHandler';
import type { Settings, ProjectData, FileSaveResult } from '../types/ipc';

// ============================================================================
// File Management Utilities
// ============================================================================

export class FileManager {
  private static readonly USER_DATA_PATH = app.getPath('userData');
  private static readonly SETTINGS_FILE = 'settings.json';
  private static readonly DEFAULT_OUTPUT_PATH = path.join(app.getPath('downloads'), 'Focule');

  // ============================================================================
  // Settings Management
  // ============================================================================

  static async getSettings(): Promise<Settings> {
    return safeFileOperation(async () => {
      const settingsPath = this.getSettingsPath();
      
      if (!fs.existsSync(settingsPath)) {
        return this.getDefaultSettings();
      }

      const data = await fs.promises.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(data);
      
      // Validate and merge with defaults
      return {
        ...this.getDefaultSettings(),
        ...settings
      };
    }, 'Load settings');
  }

  static async setSettings(settings: Settings): Promise<void> {
    return safeFileOperation(async () => {
      const settingsPath = this.getSettingsPath();
      const settingsData = JSON.stringify(settings, null, 2);
      await fs.promises.writeFile(settingsPath, settingsData, 'utf-8');
      
      ElectronLogger.info('Settings saved successfully', { path: settingsPath });
    }, 'Save settings');
  }

  static getSettingsPath(): string {
    return path.join(this.USER_DATA_PATH, this.SETTINGS_FILE);
  }

  private static getDefaultSettings(): Settings {
    return {
      outputPath: this.DEFAULT_OUTPUT_PATH,
      whisperModel: 'base',
      ollamaModel: 'llama3'
    };
  }

  // ============================================================================
  // File Operations
  // ============================================================================

  static async saveFile(content: string, filename: string): Promise<FileSaveResult> {
    return safeFileOperation(async () => {
      const settings = await this.getSettings();
      const outputPath = settings.outputPath || this.DEFAULT_OUTPUT_PATH;
      
      // Ensure output directory exists
      await this.ensureDirectoryExists(outputPath);
      
      const filePath = path.join(outputPath, filename);
      await fs.promises.writeFile(filePath, content, 'utf-8');
      
      ElectronLogger.file('save', 'File saved successfully', { filePath });
      
      return { filePath, success: true };
    }, 'Save file');
  }

  static async saveProject(projectData: ProjectData): Promise<FileSaveResult> {
    return safeFileOperation(async () => {
      const settings = await this.getSettings();
      const basePath = settings.outputPath || this.DEFAULT_OUTPUT_PATH;
      
      // Create unique project folder
      const projectFolder = await this.createProjectFolder(basePath, projectData.title);
      
      // Save all project files
      await this.saveProjectFiles(projectFolder, projectData);
      
      ElectronLogger.file('save-project', 'Project saved successfully', { 
        projectFolder, 
        title: projectData.title 
      });
      
      return { filePath: projectFolder, success: true };
    }, 'Save project');
  }

  // ============================================================================
  // Directory Operations
  // ============================================================================

  static async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
      ElectronLogger.debug('Directory created', { path: dirPath });
    }
  }

  static async createProjectFolder(basePath: string, title: string): Promise<string> {
    const sanitizedTitle = this.sanitizeFileName(title);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const projectFolder = path.join(basePath, `${sanitizedTitle}_${timestamp}`);
    
    await this.ensureDirectoryExists(projectFolder);
    
    return projectFolder;
  }

  // ============================================================================
  // File Validation
  // ============================================================================

  static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  static isValidPath(filePath: string): boolean {
    try {
      // Try to resolve the path
      path.resolve(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async getFileStats(filePath: string): Promise<fs.Stats | null> {
    try {
      return await fs.promises.stat(filePath);
    } catch {
      return null;
    }
  }

  // ============================================================================
  // Path Utilities
  // ============================================================================

  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-z0-9]/gi, '_')
      .substring(0, 50);
  }

  static getFileExtension(filePath: string): string {
    return path.extname(filePath);
  }

  static getFileName(filePath: string): string {
    return path.basename(filePath);
  }

  static getFileDirectory(filePath: string): string {
    return path.dirname(filePath);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private static async saveProjectFiles(
    projectFolder: string, 
    projectData: ProjectData
  ): Promise<void> {
    const files = [
      { name: 'transcript.txt', content: projectData.transcript },
      { name: 'transcript_timestamped.txt', content: projectData.transcriptWithTimestamps }
    ];

    // Save text files
    for (const file of files) {
      const filePath = path.join(projectFolder, file.name);
      await fs.promises.writeFile(filePath, file.content, 'utf-8');
    }

    // Save social content if available
    if (projectData.socialContent) {
      const socialContent = this.formatSocialContent(projectData.socialContent);
      const socialPath = path.join(projectFolder, 'social_content.txt');
      await fs.promises.writeFile(socialPath, socialContent, 'utf-8');
    }

    // Copy media files if they exist
    await this.copyMediaFiles(projectFolder, projectData);

    // Save project metadata
    const metadata = {
      ...projectData,
      generatedAt: new Date().toISOString()
    };
    const metadataPath = path.join(projectFolder, 'project_data.json');
    await fs.promises.writeFile(
      metadataPath, 
      JSON.stringify(metadata, null, 2), 
      'utf-8'
    );
  }

  private static formatSocialContent(socialContent: any): string {
    return `HOOK/TITLE:\n${socialContent.hook || ''}\n\nDESCRIPTION:\n${socialContent.description || ''}\n\nHASHTAGS:\n${(socialContent.hashtags || []).join(' ')}\n\nKEYWORDS:\n${(socialContent.keywords || []).join(', ')}\n\nFILENAME SUGGESTIONS:\n${(socialContent.filenames || []).join('\n')}\n\nIMAGE PROMPTS:\n${(socialContent.imagePrompts || []).join('\n\n')}`;
  }

  private static async copyMediaFiles(
    projectFolder: string, 
    projectData: ProjectData
  ): Promise<void> {
    const mediaFiles = [
      { path: projectData.videoPath, name: 'video' },
      { path: projectData.audioPath, name: 'audio' }
    ];

    for (const media of mediaFiles) {
      if (media.path && this.fileExists(media.path)) {
        const extension = this.getFileExtension(media.path);
        const destPath = path.join(projectFolder, `${media.name}${extension}`);
        await fs.promises.copyFile(media.path, destPath);
        
        ElectronLogger.debug('Media file copied', { 
          from: media.path, 
          to: destPath 
        });
      }
    }
  }
}

// ============================================================================
// Export Dialog Utilities
// ============================================================================

export class ExportDialogManager {
  static async showExportDialog(
    mainWindow: Electron.BrowserWindow,
    projectData: ProjectData
  ): Promise<FileSaveResult> {
    return safeFileOperation(async () => {
      const { dialog } = require('electron');
      const settings = await FileManager.getSettings();
      const defaultPath = settings.outputPath || FileManager['DEFAULT_OUTPUT_PATH'];

      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Export Location',
        defaultPath,
        properties: ['openDirectory', 'createDirectory']
      });

      if (result.canceled || result.filePaths.length === 0) {
        throw new FileOperationError(
          'DIALOG_CANCELLED',
          'Export dialog was cancelled by user'
        );
      }

      const basePath = result.filePaths[0];
      const projectFolder = await FileManager.createProjectFolder(basePath, projectData.title);
      await FileManager['saveProjectFiles'](projectFolder, projectData);

      ElectronLogger.info('Export completed successfully', { projectFolder });

      return { filePath: projectFolder, success: true };
    }, 'Export with dialog');
  }
}

// ============================================================================
// Path Validation Utilities
// ============================================================================

export class PathValidator {
  static validatePath(filePath: string): { valid: boolean; error?: string } {
    if (!filePath || typeof filePath !== 'string') {
      return { valid: false, error: 'Path must be a non-empty string' };
    }

    if (!FileManager.isValidPath(filePath)) {
      return { valid: false, error: 'Invalid path format' };
    }

    // Check for dangerous path traversal
    if (filePath.includes('..') || filePath.includes('~')) {
      return { valid: false, error: 'Path contains dangerous characters' };
    }

    return { valid: true };
  }

  static validateFileName(fileName: string): { valid: boolean; error?: string } {
    if (!fileName || typeof fileName !== 'string') {
      return { valid: false, error: 'Filename must be a non-empty string' };
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(fileName)) {
      return { valid: false, error: 'Filename contains invalid characters' };
    }

    // Check for reserved names (Windows)
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
    if (reservedNames.test(fileName)) {
      return { valid: false, error: 'Filename is a reserved name' };
    }

    return { valid: true };
  }
}
