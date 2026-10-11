/**
 * Prerequisites checker service
 * Verifies all required tools are installed
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec, execFile } from 'child_process';
import * as http from 'http';
import { 
  getFFmpegPaths, 
  findYtDlp,
  setCustomPath as setPathsCustomPath, 
  getCustomPath as getPathsCustomPath,
  loadCustomPaths 
} from '../utils/paths';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// ============================================================================
// Types
// ============================================================================

export interface PrerequisiteStatus {
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
}

export interface PrerequisitesCheckResult {
  prerequisites: PrerequisiteStatus[];
  allRequiredInstalled: boolean;
}

// ============================================================================
// Prerequisites Definition
// ============================================================================

// White-labeled prerequisite names for user-facing display
// Internal names are mapped to user-friendly labels
const PREREQUISITES: Omit<PrerequisiteStatus, 'installed' | 'version' | 'path'>[] = [
  {
    name: 'Script Engine',
    category: 'required',
    downloadUrl: 'https://www.python.org/downloads/',
    checkCommand: process.platform === 'win32' ? 'python --version' : 'python3 --version',
  },
  {
    name: 'Package Manager',
    category: 'required',
    downloadUrl: 'https://pip.pypa.io/en/stable/installation/',
    checkCommand: process.platform === 'win32' ? 'pip --version' : 'pip3 --version',
  },
  {
    name: 'Media Processor',
    category: 'required',
    downloadUrl: 'https://www.gyan.dev/ffmpeg/builds/',
    checkCommand: 'ffmpeg -version',
  },
  {
    name: 'Video Downloader',
    category: 'required',
    downloadUrl: 'https://github.com/yt-dlp/yt-dlp/releases',
    installCommand: 'pip install --user yt-dlp',
    checkCommand: 'python -m yt_dlp --version',
  },
  {
    name: 'Voice Recognition',
    category: 'required',
    downloadUrl: 'https://github.com/openai/whisper',
    installCommand: 'pip install --user openai-whisper',
    checkCommand: 'python -c "import whisper"',
  },
  {
    name: 'AI Engine',
    category: 'required',
    downloadUrl: 'https://ollama.ai/download',
    checkCommand: 'ollama --version',
  },
];

// ============================================================================
// Custom Path Management
// ============================================================================

export function setCustomPath(toolName: string, toolPath: string): void {
  setPathsCustomPath(toolName, toolPath);
}

export function getCustomPath(toolName: string): string | undefined {
  return getPathsCustomPath(toolName);
}

// ============================================================================
// Check Functions
// ============================================================================

async function checkCommand(command: string, customPath?: string): Promise<{ installed: boolean; version?: string; path?: string }> {
  const fullCommand = customPath 
    ? `"${customPath}" ${command.split(' ').slice(1).join(' ')}`
    : command;
  
  try {
    const { stdout, stderr } = await execAsync(fullCommand, { timeout: 15000 });
    const output = stdout || stderr || '';
    const version = output.split('\n')[0].trim();
    
    return {
      installed: true,
      version: version || 'Installed',
      path: customPath || command.split(' ')[0],
    };
  } catch (error: any) {
    // Some commands output to stderr on success
    if (error.stderr?.trim() && !error.stderr.toLowerCase().includes('error')) {
      return {
        installed: true,
        version: error.stderr.split('\n')[0].trim(),
        path: customPath || command.split(' ')[0],
      };
    }
    return { installed: false };
  }
}

async function checkFFmpeg(customPath?: string): Promise<{ installed: boolean; version?: string; path?: string }> {
  // Check custom path first
  if (customPath && fs.existsSync(customPath)) {
    const result = await checkCommand(`"${customPath}" -version`);
    if (result.installed) return { ...result, path: customPath };
  }

  // Check known paths
  for (const ffmpegPath of getFFmpegPaths()) {
    if (!ffmpegPath) continue;
    
    // Skip if file doesn't exist (except for 'ffmpeg' which relies on PATH)
    if (ffmpegPath !== 'ffmpeg' && !fs.existsSync(ffmpegPath)) continue;
    
    const cmd = ffmpegPath === 'ffmpeg' ? 'ffmpeg -version' : `"${ffmpegPath}" -version`;
    const result = await checkCommand(cmd);
    
    if (result.installed) {
      console.log(`[Prerequisites] Found FFmpeg at: ${ffmpegPath}`);
      return { ...result, path: ffmpegPath };
    }
  }

  return { installed: false };
}

async function checkYtDlp(customPath?: string): Promise<{ installed: boolean; version?: string; path?: string }> {
  const candidate = customPath
    ? { command: customPath, args: [] as string[] }
    : findYtDlp();
  try {
    const { stdout, stderr } = await execFileAsync(
      candidate.command,
      [...candidate.args, '--version'],
      { timeout: 15000 }
    );
    return {
      installed: true,
      version: (stdout || stderr).trim().split('\n')[0] || 'Installed',
      path: candidate.command,
    };
  } catch {
    return { installed: false };
  }
}

async function checkPythonModule(moduleName: string): Promise<boolean> {
  const commands = process.platform === 'win32'
    ? [{ command: 'python', args: ['-c', `import ${moduleName}`] }, { command: 'py', args: ['-3.11', '-c', `import ${moduleName}`] }, { command: 'py', args: ['-c', `import ${moduleName}`] }]
    : [{ command: 'python3', args: ['-c', `import ${moduleName}`] }, { command: 'python', args: ['-c', `import ${moduleName}`] }];
  
  for (const { command, args } of commands) {
    try {
      await execFileAsync(command, args, { timeout: 10000 });
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

async function checkOllamaRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:11434/api/tags', { timeout: 2000 }, (res) => {
      const available = res.statusCode === 200;
      res.resume();
      resolve(available);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function checkOllamaModels(): Promise<string[]> {
  const { getAvailableModels } = await import('./ollama');
  return await getAvailableModels();
}

// ============================================================================
// Main Check Function
// ============================================================================

export async function loadCustomPathsFromSettings(settingsPath: string): Promise<void> {
  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      if (settings.customPaths) {
        loadCustomPaths(settings.customPaths);
      }
    }
  } catch {
    // Ignore errors
  }
}

export async function checkPrerequisites(settingsPath?: string): Promise<PrerequisitesCheckResult> {
  console.log('[Prerequisites] Starting check...');
  
  // Load custom paths from settings
  if (settingsPath) {
    await loadCustomPathsFromSettings(settingsPath);
  }

  const results: PrerequisiteStatus[] = [];

  for (const prereq of PREREQUISITES) {
    console.log(`[Prerequisites] Checking: ${prereq.name}`);
    const customPath = getCustomPath(prereq.name);
    let status: PrerequisiteStatus;

    switch (prereq.name) {
      case 'Media Processor': {
        const result = await checkFFmpeg(customPath);
        status = {
          ...prereq,
          installed: result.installed,
          version: result.version,
          path: result.path,
          customPath,
          note: result.installed ? undefined : 'Download and extract to a folder',
        };
        break;
      }
      
      case 'Voice Recognition': {
        const installed = await checkPythonModule('whisper');
        status = {
          ...prereq,
          installed,
          version: installed ? 'Ready' : undefined,
        };
        break;
      }

      case 'Video Downloader': {
        const result = await checkYtDlp(customPath);
        status = { ...prereq, ...result, customPath };
        break;
      }
      
      case 'AI Engine': {
        const result = await checkCommand(prereq.checkCommand || '', customPath);
        const running = await checkOllamaRunning();
        const models = running ? await checkOllamaModels() : [];
        
        let note: string | undefined;
        if (result.installed) {
          if (!running) note = 'Not running - please start the AI engine';
          else if (models.length === 0) note = 'No models installed yet';
          else note = `${models.length} model(s) available`;
        }
        
        status = { ...prereq, ...result, customPath, note };
        break;
      }
      
      default: {
        const result = await checkCommand(prereq.checkCommand || '', customPath);
        status = { ...prereq, ...result, customPath };
      }
    }

    console.log(`[Prerequisites] ${prereq.name}: ${status.installed ? '✓' : '✗'}`);
    results.push(status);
  }

  const allRequiredInstalled = results
    .filter(r => r.category === 'required')
    .every(r => r.installed);

  console.log(`[Prerequisites] All required: ${allRequiredInstalled}`);

  return { prerequisites: results, allRequiredInstalled };
}
