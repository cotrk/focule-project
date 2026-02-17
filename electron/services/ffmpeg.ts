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

// ============================================================================
// Error Parsing
// ============================================================================

function parseFFmpegError(stderr: string): string {
  const output = stderr.toLowerCase();
  
  // Common FFmpeg errors
  if (output.includes('no such file or directory')) {
    return 'Video file not found. The download may have failed or the file was deleted.';
  }
  
  if (output.includes('invalid data found when processing input')) {
    return 'The video file is corrupted or in an unsupported format. Try downloading a different video.';
  }
  
  if (output.includes('permission denied')) {
    return 'Permission denied accessing the video file. Check file permissions.';
  }
  
  if (output.includes('no audio stream found')) {
    return 'No audio stream found in the video file. The video may be silent or audio-only extraction failed.';
  }
  
  if (output.includes('unsupported codec')) {
    return 'Unsupported video codec. Try a different video format.';
  }
  
  if (output.includes('ffmpeg not found')) {
    return 'FFmpeg not found. Please install FFmpeg or check System settings.';
  }
  
  if (output.includes('disk space')) {
    return 'Insufficient disk space for audio extraction. Free up space and try again.';
  }
  
  if (output.includes('operation not permitted')) {
    return 'Operation not permitted. The file may be locked by another process.';
  }
  
  // Return the original error if we can't parse it
  return `Audio extraction failed: ${stderr || 'Unknown FFmpeg error'}`;
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
  try {
    console.log(`[FFmpeg] Starting audio extraction for: ${videoPath}`);
    console.log(`[FFmpeg] Session ID: ${sessionId}`);
    
    if (!fs.existsSync(videoPath)) {
      console.error(`[FFmpeg] Video file not found: ${videoPath}`);
      throw new Error('Video file not found. The download may have failed.');
    }

    // Check file size - very small files are likely corrupted
    const stats = fs.statSync(videoPath);
    console.log(`[FFmpeg] Video file size: ${stats.size} bytes`);
    if (stats.size < 1024) { // Less than 1KB
      console.error(`[FFmpeg] File too small: ${stats.size} bytes`);
      throw new Error('Video file is too small and likely corrupted. Try downloading again.');
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
    
    // Validate FFmpeg is available
    if (!ffmpegPath || ffmpegPath === 'ffmpeg') {
      throw new Error('FFmpeg not found. Please install FFmpeg or check System settings.');
    }
    console.log(`[FFmpeg] Session: ${sessionId}`);
    console.log(`[FFmpeg] Using: ${ffmpegPath}`);
    console.log(`[FFmpeg] Input: ${videoPath}`);
    console.log(`[FFmpeg] Output: ${audioPath}`);

    return new Promise((resolve, reject) => {
      // FFmpeg arguments for Whisper-optimized audio
      const args = [
        '-i', `"${videoPath}"`,  // Quote input path to handle spaces
        '-vn',              // No video
        '-acodec', 'pcm_s16le',  // PCM 16-bit
        '-ar', '16000',     // 16kHz sample rate (Whisper optimal)
        '-ac', '1',         // Mono
        '-y',               // Overwrite output
        '-loglevel', 'error', // Only show errors
        `"${audioPath}"`,  // Quote output path to handle spaces
      ];

      console.log(`[FFmpeg] Command: ${ffmpegPath} ${args.join(' ')}`);

      const ffmpeg = spawn(`"${ffmpegPath}"`, args, { 
        shell: true,  // Use shell to handle paths with spaces
        stdio: ['ignore', 'pipe', 'pipe']  // Capture stderr
      });

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
        console.log(`[FFmpeg] Process exited with code: ${code}`);
        console.log(`[FFmpeg] stderr output: ${stderr}`);
        
        if (code !== 0) {
          // Parse specific FFmpeg errors
          const error = parseFFmpegError(stderr);
          console.error(`[FFmpeg] Parsed error: ${error}`);
          reject(new Error(error));
          return;
        }

        if (!fs.existsSync(audioPath)) {
          console.error(`[FFmpeg] Output file not found: ${audioPath}`);
          reject(new Error('Audio extraction failed - no output file created. The video may be corrupted or in an unsupported format.'));
          return;
        }

        // Update session data with audio extraction results
        sessionData.audioPath = audioPath;
        sessionData.duration = duration;
        saveSessionData(sessionDir, sessionData);

        console.log(`[FFmpeg] Success: ${audioPath} (${duration}s)`);
        resolve({ audioPath, duration, sessionId });
      });

      ffmpeg.on('error', (error: any) => {
        console.error(`[FFmpeg] Spawn error:`, error);
        if (error.code === 'ENOENT') {
          reject(new Error('FFmpeg not found. Please install FFmpeg or check System settings.'));
        } else if (error.code === 'EACCES') {
          reject(new Error('Permission denied accessing FFmpeg. Check file permissions.'));
        } else {
          reject(new Error(`FFmpeg process error: ${error.message}`));
        }
      });
    });
  } catch (error: any) {
    console.error(`[FFmpeg] Unexpected error:`, error);
    throw error;
  }
}
