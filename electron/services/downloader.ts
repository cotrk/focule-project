/**
 * Video downloader service using yt-dlp
 * Supports YouTube and Twitch
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { findYtDlp, findFFmpeg, VIDEO_EXTENSIONS, INVALID_EXTENSIONS } from '../utils/paths';
import * as crypto from 'crypto';
import { registerSession, completeSession, touchSession } from './sessionCleanup';

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
  sessionId: string;
}

// ============================================================================
// Session Management
// ============================================================================

interface SessionData {
  sessionId: string;
  url: string;
  createdAt: number;
  videoPath?: string;
  title?: string;
  duration?: number;
}

function createSessionId(url: string): string {
  const hash = crypto.createHash('sha256').update(url).digest('hex').substring(0, 16);
  const timestamp = Date.now().toString(36);
  return `${hash}_${timestamp}`;
}

function createSessionDirectory(sessionId: string): string {
  const sessionsDir = path.join(app.getPath('userData'), 'sessions');
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }
  
  const sessionDir = path.join(sessionsDir, sessionId);
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }
  
  const downloadsDir = path.join(sessionDir, 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }
  
  return sessionDir;
}

function saveSessionData(sessionDir: string, data: SessionData): void {
  const sessionFile = path.join(sessionDir, 'session.json');
  fs.writeFileSync(sessionFile, JSON.stringify(data, null, 2));
}

function loadSessionData(sessionDir: string): SessionData | null {
  const sessionFile = path.join(sessionDir, 'session.json');
  if (!fs.existsSync(sessionFile)) {
    return null;
  }
  
  try {
    return JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
  } catch {
    return null;
  }
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
 * Find the downloaded video file within a session directory
 * Validates file ownership by checking session metadata
 */
function findDownloadedVideo(sessionDir: string, downloadStartTime: number, alreadyDownloaded: boolean = false): string | null {
  const outputDir = path.join(sessionDir, 'downloads');
  if (!fs.existsSync(outputDir)) return null;
  
  const sessionData = loadSessionData(sessionDir);
  if (!sessionData) {
    console.error('[Downloader] No session data found for validation');
    return null;
  }
  
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
  
  // If yt-dlp said file was already downloaded, validate with session data
  if (alreadyDownloaded && allVideoFiles.length > 0) {
    const candidateFile = allVideoFiles[0];
    // Additional validation: check if file matches expected session timeframe
    const sessionAge = Date.now() - sessionData.createdAt;
    const fileAge = Date.now() - candidateFile.mtime;
    
    // Only use cached file if it's from this session or very recent
    if (fileAge < 60000 && sessionAge < 300000) { // 1 min file age, 5 min session age
      console.log(`[Downloader] Using validated cached file: ${candidateFile.name}`);
      return candidateFile.path;
    } else {
      console.log(`[Downloader] Cached file too old, forcing re-download`);
      return null; // Force re-download
    }
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
 * Get video info from .info.json file within session directory
 * Validates that info file belongs to the current session
 */
function getVideoInfo(videoPath: string, sessionDir: string): { title: string; duration: number } {
  const baseName = path.basename(videoPath, path.extname(videoPath));
  const outputDir = path.join(sessionDir, 'downloads');
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
  
  // yt-dlp option errors
  if (output.includes('no such option') || output.includes('unrecognized arguments')) {
    return 'The yt-dlp version is outdated. Some advanced options may not be available. Using compatible fallback settings.';
  }
  
  // YouTube-specific errors
  if (output.includes('http error 403') || output.includes('forbidden')) {
    return 'YouTube is blocking the download. This is usually temporary. Try these solutions:\n\n1. Wait 2-3 minutes and try again\n2. Try a different YouTube video\n3. Check if the video is public (not private or age-restricted)\n4. Use Twitch videos as an alternative\n\nYouTube frequently updates their anti-bot measures, causing temporary blocks.';
  }
  
  if (output.includes('http error 429') || output.includes('too many requests')) {
    return 'YouTube rate limit detected. Please wait 5-10 minutes before trying again. This happens when too many requests are made in a short time.';
  }
  
  if (output.includes('network error') || output.includes('connection') || output.includes('timeout')) {
    return 'Network connection issue. Please check your internet connection and try again. YouTube may be experiencing temporary issues.';
  }
  
  if (output.includes('no supported javascript runtime')) {
    return 'YouTube requires JavaScript runtime for extraction. The app is using alternative methods to bypass this.';
  }
  
  if (output.includes('sabr streaming')) {
    return 'YouTube is using advanced streaming protection. The app is attempting alternative extraction methods.';
  }
  
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
  
  // Create isolated session for this download
  const sessionId = createSessionId(url);
  const sessionDir = createSessionDirectory(sessionId);
  
  // Register session for cleanup tracking
  registerSession(sessionId);
  
  // Initialize session data
  const sessionData: SessionData = {
    sessionId,
    url,
    createdAt: Date.now(),
  };
  saveSessionData(sessionDir, sessionData);
  
  const outputDir = path.join(sessionDir, 'downloads');
  const downloadStartTime = Date.now();
  
  // Get yt-dlp command and FFmpeg location
  const ytDlpCmd = findYtDlp();
  const ffmpegPath = findFFmpeg();
  const outputTemplate = path.resolve(outputDir, '%(title)s.%(ext)s');
  
  console.log(`[Downloader] Session: ${sessionId}`);
  console.log(`[Downloader] Output: ${outputDir}`);
  console.log(`[Downloader] Using: ${ytDlpCmd.command} ${ytDlpCmd.args.join(' ')}`);
  console.log(`[Downloader] FFmpeg: ${ffmpegPath}`);

  return new Promise((resolve, reject) => {
    // Build yt-dlp arguments with minimal, compatible options
    const downloadArgs = [
      url,
      '-f', 'best[height<=720]/best', // Limit to 720p to avoid restrictions
      '--merge-output-format', 'mp4',
      '--no-playlist',
      '--write-info-json',
      '--progress',
      '-o', outputTemplate,
      '--retries', '10',
      '--fragment-retries', '10',
      '--extractor-retries', '3',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--referer', 'https://www.youtube.com/',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      '--ignore-errors',
      '--no-abort-on-error',
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

      // Find the downloaded video (pass sessionDir for validation)
      const videoPath = findDownloadedVideo(sessionDir, downloadStartTime, alreadyDownloaded);
      if (!videoPath) {
        console.error(`[Downloader] No video file found in ${outputDir}`);
        reject(new Error('Download failed. Please check the URL and your internet connection.'));
        return;
      }
      
      // Get video info (pass sessionDir for validation)
      const { title, duration } = getVideoInfo(videoPath, sessionDir);
      
      // Update session data with results
      sessionData.videoPath = videoPath;
      sessionData.title = title;
      sessionData.duration = duration;
      saveSessionData(sessionDir, sessionData);
      
      // Mark session as complete for cleanup tracking
      completeSession(sessionId);
      
      console.log(`[Downloader] Success: ${videoPath}`);
      resolve({ videoPath, title, duration, sessionId });
    });

    // Handle spawn errors
    ytDlp.on('error', (error) => {
      reject(new Error('Video downloader not found. Please check System settings.'));
    });
  });
}
