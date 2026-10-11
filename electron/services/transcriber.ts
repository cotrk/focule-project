/**
 * Whisper transcription service
 */

import { execFile, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { findFFmpegDir } from '../utils/paths';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

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
  const pythonCommands = process.platform === 'win32'
    ? [
      { command: 'python', args: [] },
      { command: 'py', args: ['-3.11'] },
      { command: 'py', args: [] },
    ]
    : [
      { command: 'python3', args: [] },
      { command: 'python', args: [] },
    ];

  for (const { command, args } of pythonCommands) {
    try {
      await execFileAsync(command, [...args, '--version'], { timeout: 5000 });
      const pythonPath = args.length ? `${command} ${args.join(' ')}` : command;
      if (await checkWhisperInstalled(command, args)) {
        console.log(`[Transcriber] Found Python with Whisper: ${pythonPath}`);
        return pythonPath;
      }
    } catch {
      continue;
    }
  }

  throw new Error('Python with OpenAI Whisper was not found. Install Python 3.11 and run the included setup script.');
}

async function checkWhisperInstalled(pythonPath: string, pythonArgs: string[]): Promise<boolean> {
  try {
    await execFileAsync(pythonPath, [...pythonArgs, '-c', 'import whisper'], { timeout: 15000 });
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
import array
import wave
import re

def clipping_ratio(audio_path):
    total = 0
    clipped = 0
    with wave.open(audio_path, 'rb') as audio:
        while True:
            chunk = audio.readframes(16000)
            if not chunk:
                break
            samples = array.array('h')
            samples.frombytes(chunk)
            total += len(samples)
            clipped += sum(1 for sample in samples if abs(sample) >= 32760)
    return clipped / total if total else 0

def transcribe_audio(audio_path, model_name='base'):
    try:
        print(json.dumps({"status": "loading_model", "percent": 0}))
        sys.stdout.flush()
        
        model = whisper.load_model(model_name)
        
        print(json.dumps({"status": "transcribing", "percent": 10}))
        sys.stdout.flush()
        
        clipped_ratio = clipping_ratio(audio_path)
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

        transcript = " ".join(plain_transcript).strip()
        segments = result['segments']
        if not transcript:
            raise RuntimeError("No speech was detected. The audio may be silent or too quiet.")

        compact = re.sub(r'[^a-zA-Z0-9]', '', transcript)
        largest_char_ratio = max((compact.lower().count(char) / len(compact) for char in set(compact.lower())), default=0)
        repeated_segment_count = max((plain_transcript.count(text) for text in set(plain_transcript)), default=0)
        low_confidence = segments and all(
            segment.get('no_speech_prob', 0) > 0.85 and segment.get('avg_logprob', 0) < -1.0
            for segment in segments
        )
        garbled = (len(compact) > 80 and largest_char_ratio > 0.4) or repeated_segment_count >= 5
        if low_confidence or garbled:
            if clipped_ratio >= 0.02:
                reason = "Audio is heavily clipped and Whisper could not recognize reliable speech. Reduce recording levels and try again."
            else:
                reason = "Whisper could not recognize reliable speech. The audio may be silent, noisy, or unintelligible."
            raise RuntimeError(reason)
        
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
            "transcript": transcript,
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

  // Find a Python interpreter that can import Whisper.
  const pythonPath = await findWorkingPython();
  console.log(`[Transcriber] Using Python: ${pythonPath}`);

  // Create transcription script
  const scriptPath = createWhisperScript();
  const bundledBaseModel = path.join(process.resourcesPath, 'focule-assets', 'whisper', 'base.pt');
  const modelToLoad = model === 'base' && fs.existsSync(bundledBaseModel)
    ? bundledBaseModel
    : model;
  console.log(`[Transcriber] Script: ${scriptPath}`);
  console.log(`[Transcriber] Audio: ${audioPath}`);
  console.log(`[Transcriber] Model: ${modelToLoad}`);

  // Setup environment with FFmpeg in PATH (Whisper uses it internally)
  const env: NodeJS.ProcessEnv = { ...process.env };
  const ffmpegDir = findFFmpegDir();
  if (ffmpegDir) {
    console.log(`[Transcriber] Adding FFmpeg to PATH: ${ffmpegDir}`);
    env.PATH = ffmpegDir + ';' + (process.env.PATH || '');
  }

  return new Promise((resolve, reject) => {
    const [pythonCommand, ...pythonArgs] = pythonPath.split(' ');
    const child = spawn(pythonCommand, [...pythonArgs, scriptPath, audioPath, modelToLoad], {
      env,
      windowsHide: true,
    });
    let stdoutBuffer = '';
    let stderr = '';
    let result: TranscriptionResult | undefined;
    let scriptError: string | undefined;
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Transcription timed out after two hours. Try a smaller Whisper model or a shorter recording.'));
    }, 7200000);

    const handleLine = (line: string): void => {
      if (!line.trim()) return;
      try {
        const message = JSON.parse(line);
        if (onProgress && message.percent !== undefined) {
          onProgress({
            percent: message.percent,
            status: message.status || 'processing',
          });
        }
        if (message.status === 'complete') {
          result = {
            transcript: message.transcript || '',
            transcriptWithTimestamps: message.transcript_with_timestamps || '',
            srtPath: message.srt_path,
          };
        } else if (message.status === 'error') {
          scriptError = message.error || 'Whisper could not transcribe this audio.';
        }
      } catch {
        console.debug('[Transcriber] Ignoring non-JSON output from Whisper.');
      }
    };

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdoutBuffer += chunk;
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || '';
      lines.forEach(handleLine);
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Could not start Python for transcription: ${error.message}`));
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (stdoutBuffer.trim()) handleLine(stdoutBuffer);
      if (code !== 0) {
        console.error('[Transcriber] Whisper process failed:', stderr);
        reject(new Error(scriptError || 'Transcription failed. Check that Python, Whisper, and FFmpeg are installed.'));
        return;
      }
      if (scriptError) {
        reject(new Error(scriptError));
        return;
      }
      if (!result?.transcript.trim()) {
        reject(new Error('Transcription finished without recognizing any speech. The audio may be silent or unclear.'));
        return;
      }
      console.log('[Transcriber] Complete!');
      resolve(result);
    });
  });
}
