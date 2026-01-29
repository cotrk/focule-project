/**
 * FFmpeg service for audio extraction
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { findFFmpeg } from '../utils/paths';

export interface AudioExtractionResult {
  audioPath: string;
  duration: number;
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
 */
export async function extractAudio(videoPath: string): Promise<AudioExtractionResult> {
  if (!fs.existsSync(videoPath)) {
    throw new Error('Video file not found. The download may have failed.');
  }

  // Setup output directory
  const outputDir = path.join(app.getPath('userData'), 'audio');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const videoName = path.basename(videoPath, path.extname(videoPath));
  const sanitizedName = sanitizeFilename(videoName);
  const audioPath = path.join(outputDir, `${sanitizedName}.wav`);

  const ffmpegPath = findFFmpeg();
  console.log(`[FFmpeg] Using: ${ffmpegPath}`);
  console.log(`[FFmpeg] Input: ${videoPath}`);
  console.log(`[FFmpeg] Output: ${audioPath}`);

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

    console.log(`[FFmpeg] Command: ${ffmpegPath} ${args.join(' ')}`);

    const ffmpeg = spawn(ffmpegPath, args, { shell: true });

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

      console.log(`[FFmpeg] Success: ${audioPath} (${duration}s)`);
      resolve({ audioPath, duration });
    });

    ffmpeg.on('error', (error) => {
      reject(new Error('Video processor not found. Please check System settings.'));
    });
  });
}
