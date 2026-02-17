/**
 * Centralized path utilities for finding external tools
 * Single source of truth for tool locations
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const userProfile = os.homedir();
const foculeTools = process.env.FOCULETOOLS || 'C:\\Users\\Cody\\Tools';

// Custom paths set by user through settings
let customPaths: Record<string, string> = {};

export function setCustomPath(toolName: string, toolPath: string): void {
  customPaths[toolName] = toolPath;
}

export function getCustomPath(toolName: string): string | undefined {
  return customPaths[toolName];
}

export function loadCustomPaths(paths: Record<string, string>): void {
  customPaths = { ...customPaths, ...paths };
}

/**
 * Common FFmpeg installation paths on Windows
 */
export function getFFmpegPaths(): string[] {
  return [
    // Check bundled tools in public directory first (self-contained distribution)
    path.join(process.cwd(), 'public', 'ffmpeg.exe'),
    // FoculeTools directory (your custom tools location)
    path.join(foculeTools, 'ffmpeg.exe'),
  ].filter(Boolean);
}

/**
 * Find FFmpeg executable
 */
export function findFFmpeg(): string {
  const paths = getFFmpegPaths();
  
  for (const ffmpegPath of paths) {
    if (ffmpegPath && fs.existsSync(ffmpegPath)) {
      console.log(`[Paths] Found FFmpeg at: ${ffmpegPath}`);
      return ffmpegPath;
    }
  }
  
  // Fall back to system PATH
  console.log('[Paths] FFmpeg not found in known locations, trying system PATH');
  return 'ffmpeg';
}

/**
 * Find FFmpeg directory (for adding to PATH)
 */
export function findFFmpegDir(): string | undefined {
  const ffmpegPath = findFFmpeg();
  if (ffmpegPath && ffmpegPath !== 'ffmpeg' && fs.existsSync(ffmpegPath)) {
    return path.dirname(ffmpegPath);
  }
  return undefined;
}

/**
 * Common yt-dlp installation paths
 */
export function getYtDlpPaths(): string[] {
  return [
    // Check bundled tools in public directory first (self-contained distribution)
    path.join(process.cwd(), 'public', 'yt-dlp.exe'),
    // FoculeTools directory (your custom tools location)
    path.join(foculeTools, 'yt-dlp.exe'),
  ].filter(Boolean) as string[];
}

/**
 * Find yt-dlp - returns command and args
 */
export interface CommandWithArgs {
  command: string;
  args: string[];
}

export function findYtDlp(): CommandWithArgs {
  const paths = getYtDlpPaths();
  
  for (const ytDlpPath of paths) {
    if (ytDlpPath && fs.existsSync(ytDlpPath)) {
      console.log(`[Paths] Found yt-dlp at: ${ytDlpPath}`);
      return { command: ytDlpPath, args: [] };
    }
  }
  
  // Fall back to Python module
  console.log('[Paths] Using Python module: python -m yt_dlp');
  return { command: 'python', args: ['-m', 'yt_dlp'] };
}

/**
 * Find Whisper executable
 */
export function findWhisper(): string {
  const whisperPaths = [
    // Check bundled tools in public directory first (self-contained distribution)
    path.join(process.cwd(), 'public', 'whisper.exe'),
    // FoculeTools directory (your custom tools location)
    path.join(foculeTools, 'whisper.exe'),
  ];

  for (const whisperPath of whisperPaths) {
    if (whisperPath && fs.existsSync(whisperPath)) {
      console.log(`[Paths] Found Whisper at: ${whisperPath}`);
      return whisperPath;
    }
  }

  // Fall back to Python module
  console.log('[Paths] Using Python module: python -c whisper');
  return 'python';
}

/**
 * Video file extensions we support
 */
export const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.flv', '.avi', '.ts', '.m4v', '.mov'];
export const AUDIO_EXTENSIONS = ['.m4a', '.mp3', '.wav', '.aac', '.ogg'];
export const MEDIA_EXTENSIONS = [...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS];

/**
 * Extensions that indicate a failed download
 */
export const INVALID_EXTENSIONS = ['.mhtml', '.html', '.htm', '.json', '.part'];
