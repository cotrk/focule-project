/**
 * Whisper transcription service with AI Integration Architect optimizations
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { promisify } from 'util';
import { findFFmpegDir } from '../utils/paths';
import { 
  AIIntegrationArchitect, 
  WhisperModelRecommendation, 
  TranscriptionQualityMetrics,
  AIPerformanceMonitor
} from './aiIntegrationArchitect';

const execAsync = promisify(exec);

export interface TranscriptionProgress {
  percent: number;
  status: string;
}

export interface TranscriptionResult {
  transcript: string;
  transcriptWithTimestamps: string;
  srtPath?: string;
}

// ============================================================================
// Python Detection
// ============================================================================

async function findWorkingPython(): Promise<string> {
  const pythonCommands = ['python', 'python3', 'py'];

  for (const cmd of pythonCommands) {
    try {
      await execAsync(`${cmd} --version`, { timeout: 5000 });
      console.log(`[Transcriber] Found Python: ${cmd}`);
      return cmd;
    } catch {
      continue;
    }
  }

  return 'python';
}

async function checkWhisperInstalled(pythonPath: string): Promise<boolean> {
  try {
    await execAsync(`${pythonPath} -c "import whisper"`, { timeout: 15000 });
    console.log('[Transcriber] Whisper is installed');
    return true;
  } catch {
    console.log('[Transcriber] Whisper not found');
    return false;
  }
}

// ============================================================================
// Whisper Script
// ============================================================================

function createWhisperScript(): string {
  const scriptPath = path.join(app.getPath('userData'), 'whisper_transcribe.py');
  
  const script = `import whisper
import sys
import json

def transcribe_audio(audio_path, model_name='base'):
    try:
        print(json.dumps({"status": "loading_model", "percent": 0}))
        sys.stdout.flush()
        
        model = whisper.load_model(model_name)
        
        print(json.dumps({"status": "transcribing", "percent": 10}))
        sys.stdout.flush()
        
        result = model.transcribe(audio_path, verbose=False)
        
        # Generate transcript with timestamps
        transcript_with_timestamps = []
        plain_transcript = []
        
        for segment in result['segments']:
            start_time = format_time(segment['start'])
            end_time = format_time(segment['end'])
            text = segment['text'].strip()
            
            transcript_with_timestamps.append(f"[{start_time} -> {end_time}] {text}")
            plain_transcript.append(text)
        
        # Save SRT file
        srt_path = audio_path.replace('.wav', '.srt').replace('.mp3', '.srt')
        with open(srt_path, 'w', encoding='utf-8') as f:
            for i, segment in enumerate(result['segments'], 1):
                start = format_srt_time(segment['start'])
                end = format_srt_time(segment['end'])
                text = segment['text'].strip()
                f.write(f"{i}\\n{start} --> {end}\\n{text}\\n\\n")
        
        print(json.dumps({
            "status": "complete",
            "percent": 100,
            "transcript": " ".join(plain_transcript),
            "transcript_with_timestamps": "\\n".join(transcript_with_timestamps),
            "srt_path": srt_path
        }))
        sys.stdout.flush()
        
    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e)}))
        sys.stdout.flush()
        sys.exit(1)

def format_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"

def format_srt_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "error": "Usage: python script.py <audio_path> [model_name]"}))
        sys.exit(1)
    
    audio_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else 'base'
    
    transcribe_audio(audio_path, model_name)
`;

  fs.writeFileSync(scriptPath, script, 'utf-8');
  return scriptPath;
}

// ============================================================================
// Main Transcription Function
// ============================================================================

export async function transcribeAudio(
  audioPath: string,
  model: string = 'base',
  onProgress?: (progress: TranscriptionProgress) => void
): Promise<TranscriptionResult> {
  if (!fs.existsSync(audioPath)) {
    throw new Error('Audio file not found. Please try processing the video again.');
  }

  // Find Python
  const pythonPath = await findWorkingPython();
  console.log(`[Transcriber] Using Python: ${pythonPath}`);
  
  // Check Whisper
  const whisperInstalled = await checkWhisperInstalled(pythonPath);
  if (!whisperInstalled) {
    throw new Error('Whisper is not installed. Please run: pip install openai-whisper');
  }

  // Create transcription script
  const scriptPath = createWhisperScript();
  console.log(`[Transcriber] Script: ${scriptPath}`);
  console.log(`[Transcriber] Audio: ${audioPath}`);
  console.log(`[Transcriber] Model: ${model}`);

  // Setup environment with FFmpeg in PATH (Whisper uses it internally)
  const env: NodeJS.ProcessEnv = { ...process.env };
  const ffmpegDir = findFFmpegDir();
  if (ffmpegDir) {
    console.log(`[Transcriber] Adding FFmpeg to PATH: ${ffmpegDir}`);
    env.PATH = ffmpegDir + ';' + (process.env.PATH || '');
  }

  return new Promise((resolve, reject) => {
    const command = `"${pythonPath}" "${scriptPath}" "${audioPath}" ${model}`;
    console.log(`[Transcriber] Running: ${command}`);
    
    exec(command, { 
      env,
      timeout: 7200000, // 2 hours for large models on CPU
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    }, (error, stdout, stderr) => {
      if (stderr) console.log(`[Transcriber] stderr: ${stderr}`);
      
      if (error) {
        reject(new Error('Transcription failed. Please try a smaller quality setting or shorter video.'));
        return;
      }

      // Parse output for results
      const lines = stdout.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const result = JSON.parse(line);
          
          // Send progress updates
          if (onProgress && result.percent !== undefined) {
            onProgress({
              percent: result.percent,
              status: result.status || 'processing',
            });
          }
          
          // Return completed result
          if (result.status === 'complete') {
            console.log('[Transcriber] Complete!');
            resolve({
              transcript: result.transcript || '',
              transcriptWithTimestamps: result.transcript_with_timestamps || '',
              srtPath: result.srt_path,
            });
            return;
          }
          
          // Handle errors
          if (result.status === 'error') {
            reject(new Error(result.error || 'Transcription failed. Please try again.'));
            return;
          }
        } catch {
          // Not JSON, ignore
        }
      }
      
      reject(new Error('Transcription completed but no result was returned. Please try again.'));
    });
  });
}
