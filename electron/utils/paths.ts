/**
 * Centralized path utilities for finding external tools
 * Single source of truth for tool locations
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const userProfile = os.homedir();

// Custom paths set by user through settings
let customPaths: Record<string, string> = {};

function normalizeToolName(toolName: string): string {
  const aliases: Record<string, string> = {
    ffmpeg: 'Media Processor',
    FFmpeg: 'Media Processor',
    'yt-dlp': 'Video Downloader',
    whisper: 'Voice Recognition',
    ollama: 'AI Engine',
  };
  return aliases[toolName] || toolName;
}

export function setCustomPath(toolName: string, toolPath: string): void {
  customPaths[normalizeToolName(toolName)] = toolPath;
}

export function getCustomPath(toolName: string): string | undefined {
  return customPaths[normalizeToolName(toolName)];
}

export function loadCustomPaths(paths: Record<string, string>): void {
  for (const [toolName, toolPath] of Object.entries(paths)) {
    setCustomPath(toolName, toolPath);
  }
}

/**
 * Common FFmpeg installation paths on Windows
 */
export function getFFmpegPaths(): string[] {
  return [
    ...(process.resourcesPath
      ? [path.join(process.resourcesPath, 'focule-assets', 'bin', 'ffmpeg.exe')]
      : []),
    // Custom path first
    customPaths['Media Processor'],
    // User home directory installations
    path.join(userProfile, 'ffmpeg-8.0.1-essentials_build', 'bin', 'ffmpeg.exe'),
    path.join(userProfile, 'ffmpeg-8.0.1', 'bin', 'ffmpeg.exe'),
    path.join(userProfile, 'ffmpeg', 'bin', 'ffmpeg.exe'),
    path.join(userProfile, 'ffmpeg', 'ffmpeg.exe'),
    // Common Windows locations
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\ffmpeg\\ffmpeg.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'ffmpeg', 'bin', 'ffmpeg.exe'),
    path.join(process.env.PROGRAMFILES || '', 'ffmpeg', 'bin', 'ffmpeg.exe'),
    // Chocolatey/Scoop
    'C:\\ProgramData\\chocolatey\\bin\\ffmpeg.exe',
    path.join(userProfile, 'scoop', 'shims', 'ffmpeg.exe'),
    // Bundled with other software
    'C:\\Program Files\\Topaz Labs LLC\\Topaz Video AI\\ffmpeg.exe',
    'C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\ffmpeg.exe',
    // yt-dlp often bundles ffmpeg
    path.join(process.env.APPDATA || '', 'yt-dlp', 'ffmpeg.exe'),
  ].filter(Boolean) as string[];
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
    ...(process.resourcesPath
      ? [path.join(process.resourcesPath, 'focule-assets', 'bin', 'yt-dlp.exe')]
      : []),
    // Custom path first
    customPaths['Video Downloader'],
    // App bundled
    path.join(process.cwd(), 'assets', 'yt-dlp.exe'),
    path.join(process.cwd(), 'assets', 'yt-dlp'),
    // Common Windows locations
    path.join(userProfile, 'yt-dlp', 'yt-dlp.exe'),
    path.join(process.env.APPDATA || '', 'yt-dlp', 'yt-dlp.exe'),
    // Scoop/Chocolatey
    path.join(userProfile, 'scoop', 'shims', 'yt-dlp.exe'),
    'C:\\ProgramData\\chocolatey\\bin\\yt-dlp.exe',
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
 * Video file extensions we support
 */
export const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.flv', '.avi', '.ts', '.m4v', '.mov'];
export const AUDIO_EXTENSIONS = ['.m4a', '.mp3', '.wav', '.aac', '.ogg'];
export const MEDIA_EXTENSIONS = [...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS];

/**
 * Extensions that indicate a failed download
 */
export const INVALID_EXTENSIONS = ['.mhtml', '.html', '.htm', '.json', '.part'];
