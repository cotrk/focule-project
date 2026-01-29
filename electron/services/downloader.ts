/**
 * Video downloader service using yt-dlp
 * Supports YouTube and Twitch
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { findYtDlp, findFFmpeg, VIDEO_EXTENSIONS, INVALID_EXTENSIONS } from '../utils/paths';

// ============================================================================
// Types
// ============================================================================

export interface DownloadProgress {
  percent: number;
  downloaded: string;
  total: string;
  speed: string;
  eta: string;
}

export interface DownloadResult {
  videoPath: string;
  title: string;
  duration: number;
}

// ============================================================================
// URL Validation
// ============================================================================

const URL_PATTERNS = {
  youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
  twitch: /^(https?:\/\/)?(www\.)?twitch\.tv\/(videos\/\d+|[a-zA-Z0-9_]+\/clip\/[a-zA-Z0-9_-]+)/,
};

function validateURL(url: string): boolean {
  return Object.values(URL_PATTERNS).some(pattern => pattern.test(url));
}

function getPlatform(url: string): string {
  if (URL_PATTERNS.youtube.test(url)) return 'youtube';
  if (URL_PATTERNS.twitch.test(url)) return 'twitch';
  return 'unknown';
}

// ============================================================================
// File Detection
// ============================================================================

interface FileInfo {
  name: string;
  path: string;
  mtime: number;
  size: number;
}

/**
 * Check if a filename is a partial/unmerged stream file
 * These have format IDs like .f137, .f140, .f251 in the name
 */
function isPartialStreamFile(filename: string): boolean {
  // Pattern: .f followed by digits before the extension
  return /\.f\d+\.[^.]+$/.test(filename);
}

/**
 * Find the downloaded video file
 * Tries recent files first, then falls back to any valid video file (for cached downloads)
 */
function findDownloadedVideo(outputDir: string, downloadStartTime: number, alreadyDownloaded: boolean = false): string | null {
  if (!fs.existsSync(outputDir)) return null;
  
  const files = fs.readdirSync(outputDir);
  
  // Get all valid video files (not partial streams, >1KB)
  const allVideoFiles: FileInfo[] = files
    .filter(f => VIDEO_EXTENSIONS.some(ext => f.toLowerCase().endsWith(ext)))
    .filter(f => !isPartialStreamFile(f)) // Skip unmerged stream files
    .map(f => {
      const filePath = path.join(outputDir, f);
      const stats = fs.statSync(filePath);
      return {
        name: f,
        path: filePath,
        mtime: stats.mtime.getTime(),
        size: stats.size,
      };
    })
    .filter(f => f.size > 1000) // Must be >1KB
    .sort((a, b) => b.mtime - a.mtime); // Most recent first
  
  // If yt-dlp said file was already downloaded, just use the most recent valid file
  if (alreadyDownloaded && allVideoFiles.length > 0) {
    console.log(`[Downloader] Using cached file: ${allVideoFiles[0].name}`);
    return allVideoFiles[0].path;
  }
  
  // Otherwise, prefer files modified recently (within 5 min of download start)
  const fiveMinutesAgo = downloadStartTime - 300000;
  const recentFiles = allVideoFiles.filter(f => f.mtime >= fiveMinutesAgo);
  
  if (recentFiles.length > 0) {
    console.log(`[Downloader] Found ${recentFiles.length} recent video file(s), using: ${recentFiles[0].name}`);
    return recentFiles[0].path;
  }
  
  // Fallback: use most recent file even if older (handles re-runs)
  if (allVideoFiles.length > 0) {
    console.log(`[Downloader] No recent files, using most recent: ${allVideoFiles[0].name}`);
    return allVideoFiles[0].path;
  }
  
  // If no merged files found, check if we have partial streams (merge failed)
  const partialFiles = files.filter(f => 
    VIDEO_EXTENSIONS.some(ext => f.toLowerCase().endsWith(ext)) && 
    isPartialStreamFile(f)
  );
  
  if (partialFiles.length > 0) {
    console.error(`[Downloader] Found partial stream files but no merged video. FFmpeg merge may have failed.`);
    console.error(`[Downloader] Partial files: ${partialFiles.join(', ')}`);
  }
  
  return null;
}

/**
 * Check if an invalid file was downloaded (MHTML, storyboard, etc.)
 */
function checkForInvalidDownload(outputDir: string, downloadStartTime: number): { invalid: boolean; reason?: string } {
  if (!fs.existsSync(outputDir)) return { invalid: false };
  
  const files = fs.readdirSync(outputDir);
  const fiveMinutesAgo = downloadStartTime - 300000;
  
  // Check for MHTML files (indicates web archive instead of video)
  const mhtmlFiles = files
    .filter(f => f.toLowerCase().endsWith('.mhtml'))
    .map(f => ({
      path: path.join(outputDir, f),
      mtime: fs.statSync(path.join(outputDir, f)).mtime.getTime(),
    }))
    .filter(f => f.mtime >= fiveMinutesAgo);
  
  if (mhtmlFiles.length > 0) {
    return {
      invalid: true,
      reason: 'yt-dlp downloaded a web archive (MHTML) instead of a video. The video may be restricted or unavailable.',
    };
  }
  
  // Check info.json for storyboard format
  const infoFiles = files.filter(f => f.endsWith('.info.json'));
  for (const infoFile of infoFiles) {
    try {
      const infoPath = path.join(outputDir, infoFile);
      const stats = fs.statSync(infoPath);
      if (stats.mtime.getTime() < fiveMinutesAgo) continue;
      
      const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
      const formatId = info.format_id || '';
      
      if (/^sb\d+$/i.test(formatId)) {
        return {
          invalid: true,
          reason: `yt-dlp downloaded storyboard format (${formatId}) instead of video. The video may be age-restricted, region-locked, or unavailable.`,
        };
      }
    } catch {
      // Ignore parse errors
    }
  }
  
  return { invalid: false };
}

/**
 * Get video info from .info.json file
 */
function getVideoInfo(videoPath: string, outputDir: string): { title: string; duration: number } {
  const baseName = path.basename(videoPath, path.extname(videoPath));
  const infoPath = path.join(outputDir, `${baseName}.info.json`);
  
  try {
    if (fs.existsSync(infoPath)) {
      const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
      return {
        title: info.title || baseName,
        duration: info.duration || 0,
      };
      }
  } catch {
    // Ignore parse errors
  }
  
  return { title: baseName, duration: 0 };
  }

// ============================================================================
// Error Messages
// ============================================================================

function parseYtDlpError(stderr: string, stdout: string): string {
  const output = (stderr + stdout).toLowerCase();
  
  if (output.includes('requested format is not available')) {
    return 'The requested video format is not available. The video may be restricted or unavailable for download.';
  }
  if (output.includes('private video')) {
    return 'This video is private and cannot be downloaded.';
  }
  if (output.includes('video unavailable')) {
    return 'This video is unavailable. It may have been deleted or made private.';
  }
  if (output.includes('sign in to confirm your age')) {
    return 'This video is age-restricted. Downloading age-restricted videos requires authentication (not yet supported).';
}
  if (output.includes('429') || output.includes('too many requests')) {
    return 'Too many requests. Please wait a few minutes and try again.';
  }
  
  return stderr || stdout || 'Download failed for unknown reason';
}

// ============================================================================
// Main Download Function
// ============================================================================

export async function downloadVideo(
  url: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> {
  // Validate URL
  if (!validateURL(url)) {
    throw new Error('Please enter a valid YouTube or Twitch URL.');
  }

  const platform = getPlatform(url);
  console.log(`[Downloader] Starting download from ${platform}: ${url}`);
  
  // Setup output directory
  const outputDir = path.join(app.getPath('userData'), 'downloads');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Track download start time for file detection
  const downloadStartTime = Date.now();
  
  // Get yt-dlp command and FFmpeg location
  const ytDlpCmd = findYtDlp();
  const ffmpegPath = findFFmpeg();
  const outputTemplate = path.resolve(outputDir, '%(title)s.%(ext)s');
  
  console.log(`[Downloader] Output: ${outputDir}`);
  console.log(`[Downloader] Using: ${ytDlpCmd.command} ${ytDlpCmd.args.join(' ')}`);
  console.log(`[Downloader] FFmpeg: ${ffmpegPath}`);

  return new Promise((resolve, reject) => {
    // Build yt-dlp arguments
    const downloadArgs = [
      url,
      '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      '--merge-output-format', 'mp4',
      '--no-playlist',
      '--write-info-json',
      '--progress',
      '-o', outputTemplate,
      '--retries', '10',
      '--fragment-retries', '10',
      '--extractor-retries', '3',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      '-4', // Force IPv4
    ];
    
    // Add FFmpeg location if found (needed for merging video+audio)
    if (ffmpegPath && ffmpegPath !== 'ffmpeg') {
      downloadArgs.push('--ffmpeg-location', path.dirname(ffmpegPath));
    }
    
    const args = [...ytDlpCmd.args, ...downloadArgs];
    
    // Spawn yt-dlp process
    const ytDlp = spawn(ytDlpCmd.command, args, {
      shell: false,
      cwd: outputDir,
    });

    let stdout = '';
    let stderr = '';

    // Handle stdout - parse progress
    ytDlp.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      
      // Log important messages
      if (output.includes('[info]') || output.includes('Downloading')) {
        console.log(`[Downloader] ${output.trim()}`);
      }

      // Parse progress
      const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (progressMatch && onProgress) {
        const percent = parseFloat(progressMatch[1]);
        const downloaded = output.match(/(\d+\.?\d*[KMGT]?i?B)\s+of/)?.[1] || '';
        const total = output.match(/of\s+(\d+\.?\d*[KMGT]?i?B)/)?.[1] || '';
        const speed = output.match(/at\s+(\d+\.?\d*[KMGT]?i?B\/s)/)?.[1] || '';
        const eta = output.match(/ETA\s+(\d+:\d+)/)?.[1] || '';
        
          onProgress({ percent, downloaded, total, speed, eta });
        }
    });

    // Handle stderr
    ytDlp.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle completion
    ytDlp.on('close', async (code) => {
      // Wait for file system to sync
      await new Promise(r => setTimeout(r, 500));
      
      // Check for errors
      if (code !== 0) {
        console.error(`[Downloader] yt-dlp exited with code ${code}`);
        reject(new Error(parseYtDlpError(stderr, stdout)));
        return;
      }

      // Check if yt-dlp said file was already downloaded (cached)
      const alreadyDownloaded = stdout.includes('has already been downloaded') || 
                                 stdout.includes('already been downloaded and merged');
      if (alreadyDownloaded) {
        console.log('[Downloader] Video was already downloaded (cached)');
      }
      
      // Check for invalid downloads
      const invalidCheck = checkForInvalidDownload(outputDir, downloadStartTime);
      if (invalidCheck.invalid) {
        reject(new Error(invalidCheck.reason));
          return;
        }

      // Find the downloaded video (pass alreadyDownloaded flag for cached files)
      const videoPath = findDownloadedVideo(outputDir, downloadStartTime, alreadyDownloaded);
      if (!videoPath) {
        console.error(`[Downloader] No video file found in ${outputDir}`);
        reject(new Error('Download failed. Please check the URL and your internet connection.'));
        return;
      }
      
      // Get video info
      const { title, duration } = getVideoInfo(videoPath, outputDir);
      
      console.log(`[Downloader] Success: ${videoPath}`);
      resolve({ videoPath, title, duration });
    });

    // Handle spawn errors
    ytDlp.on('error', (error) => {
      reject(new Error('Video downloader not found. Please check System settings.'));
    });
  });
}
