/**
 * FFmpeg service for audio extraction
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { findFFmpeg } from '../utils/paths';
import { touchSession } from './sessionCleanup';

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
  console.log(`[FFmpeg] Session: ${sessionId}`);
  console.log(`[FFmpeg] Using: ${ffmpegPath}`);
  console.log(`[FFmpeg] Input: ${videoPath}`);
  console.log(`[FFmpeg] Output: ${audioPath}`);

  return new Promise((resolve, reject) => {
    // FFmpeg arguments for Whisper-optimized audio
    const args = [
      '-i', videoPath,
      '-vn',              // No video
      '-acodec', 'pcm_s16le',  // PCM 16-bit
      '-ar', '16000',     // 16kHz sample rate (Whisper optimal)
      '-ac', '1',         // Mono
      '-y',               // Overwrite output
      audioPath,
    ];

    console.log(`[FFmpeg] Command: ${ffmpegPath} ${args.join(' ')}`);

    const ffmpeg = spawn(ffmpegPath, args, { windowsHide: true });

    let stderr = '';
    let duration = 0;

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;

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

      // Update session data with audio extraction results
      sessionData.audioPath = audioPath;
      sessionData.duration = duration;
      saveSessionData(sessionDir, sessionData);

      console.log(`[FFmpeg] Success: ${audioPath} (${duration}s)`);
      resolve({ audioPath, duration, sessionId });
    });

    ffmpeg.on('error', (_error) => {
      reject(new Error('Video processor not found. Please check System settings.'));
    });
  });
}
