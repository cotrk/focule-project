/**
 * Optimized FFmpeg service with memory management and CPU throttling
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { findFFmpeg } from '../utils/paths';
import { touchSession } from './sessionCleanup';
import { withProcessCleanup, CPUThrottler } from '../utils/memoryManager';

export interface AudioExtractionResult {
  audioPath: string;
  duration: number;
  sessionId: string;
}

// ============================================================================
// Session Management
// ============================================================================

interface SessionData {
  sessionId: string;
  videoPath: string;
  createdAt: number;
  audioPath?: string;
  duration?: number;
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

function saveSessionData(sessionDir: string, data: SessionData): void {
  const sessionFile = path.join(sessionDir, 'session.json');
  fs.writeFileSync(sessionFile, JSON.stringify(data, null, 2));
}

function getSessionDirectory(sessionId: string): string {
  return path.join(app.getPath('userData'), 'sessions', sessionId);
}

/**
 * Sanitize filename to remove problematic characters
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[：]/g, '-')  // Full-width colon
    .replace(/[<>:"/\\|?*]/g, '-')  // Windows forbidden characters
    .replace(/\s+/g, '_')  // Replace whitespace with underscore
    .replace(/-+/g, '-')  // Collapse multiple dashes
    .replace(/_+/g, '_'); // Collapse multiple underscores
}

/**
 * Extract audio from video file as WAV (optimized for Whisper)
 * Uses session-based isolation to prevent cross-contamination
 * Includes memory management and CPU throttling
 */
export async function extractAudio(videoPath: string, sessionId: string): Promise<AudioExtractionResult> {
  if (!fs.existsSync(videoPath)) {
    throw new Error('Video file not found. The download may have failed.');
  }

  // Get session directory and validate
  const sessionDir = getSessionDirectory(sessionId);
  const sessionData = loadSessionData(sessionDir);
  
  if (!sessionData) {
    throw new Error('Invalid session ID. Audio extraction must be part of a valid download session.');
  }

  // Update session access time
  touchSession(sessionId);

  // Validate that the video path belongs to this session
  if (!videoPath.includes(sessionDir)) {
    throw new Error('Video file does not belong to this session. Potential contamination detected.');
  }

  // Setup isolated audio directory for this session
  const audioDir = path.join(sessionDir, 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const videoName = path.basename(videoPath, path.extname(videoPath));
  const sanitizedName = sanitizeFilename(videoName);
  const audioPath = path.join(audioDir, `${sanitizedName}.wav`);

  const ffmpegPath = findFFmpeg();
  console.warn(`[FFmpeg] Session: ${sessionId}`);
  console.warn(`[FFmpeg] Using: ${ffmpegPath}`);
  console.warn(`[FFmpeg] Input: ${videoPath}`);
  console.warn(`[FFmpeg] Output: ${audioPath}`);

  return CPUThrottler.throttle(
    `ffmpeg-${sessionId}`,
    () => withProcessCleanup(
      `ffmpeg-${sessionId}`,
      performExtraction(ffmpegPath, videoPath, audioPath),
      () => {
        // Cleanup function
        if (fs.existsSync(audioPath)) {
          try {
            // Verify file size is reasonable (>1KB)
            const stats = fs.statSync(audioPath);
            if (stats.size < 1024) {
              fs.unlinkSync(audioPath);
              console.warn('[FFmpeg] Removed tiny/corrupted audio file');
            }
          } catch (error) {
            console.error('[FFmpeg] Cleanup error:', error);
          }
        }
      }
    ),
    { priority: 'high', timeout: 600000 } // 10 minutes
  ).then((result) => {
    // Update session data with audio extraction results
    sessionData.audioPath = audioPath;
    sessionData.duration = result.duration;
    saveSessionData(sessionDir, sessionData);

    console.warn(`[FFmpeg] Success: ${audioPath} (${result.duration}s)`);
    return { audioPath, duration: result.duration, sessionId };
  });
}

function performExtraction(
  ffmpegPath: string,
  videoPath: string,
  audioPath: string
): Promise<{ duration: number }> {
  return new Promise((resolve, reject) => {
    // FFmpeg arguments for Whisper-optimized audio
    const args = [
      '-i', `"${videoPath}"`,
      '-vn',              // No video
      '-acodec', 'pcm_s16le',  // PCM 16-bit
      '-ar', '16000',     // 16kHz sample rate (Whisper optimal)
      '-ac', '1',         // Mono
      '-y',               // Overwrite output
      `"${audioPath}"`,
    ];

    console.warn(`[FFmpeg] Command: ${ffmpegPath} ${args.join(' ')}`);

    const ffmpeg = spawn(ffmpegPath, args, { 
      shell: true,
      // Limit process priority to prevent UI blocking
      windowsHide: true
    });

    let duration = 0;

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();

      // Parse duration from FFmpeg output
      const durationMatch = output.match(/Duration:\s+(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (durationMatch) {
        duration = 
          parseInt(durationMatch[1]) * 3600 +
          parseInt(durationMatch[2]) * 60 +
          parseInt(durationMatch[3]) +
          parseInt(durationMatch[4]) / 100;
      }
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Audio extraction failed. The video file may be corrupted.'));
        return;
      }

      if (!fs.existsSync(audioPath)) {
        reject(new Error('Audio extraction failed. Please try again.'));
        return;
      }

      resolve({ duration });
    });

    ffmpeg.on('error', (_error) => {
      reject(new Error('Video processor not found. Please check System settings.'));
    });

    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      ffmpeg.kill('SIGTERM');
      reject(new Error('Audio extraction timeout. The video file may be too large or corrupted.'));
    }, 600000); // 10 minutes

    ffmpeg.on('close', () => {
      clearTimeout(timeout);
    });
  });
}
