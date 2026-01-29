// Shared IPC contract types for Focule (video-transcriber)
// Used by: electron/main.ts, electron/preload.ts, src/hooks/useTranscription.ts

import { z } from 'zod';

// Example: Transcription request from renderer to main
export const TranscriptionRequestSchema = z.object({
  url: z.string().url(),
  language: z.string().optional(),
  model: z.string().optional(),
  outputFormat: z.enum(['srt', 'txt', 'vtt']).optional(),
});
export type TranscriptionRequest = z.infer<typeof TranscriptionRequestSchema>;

// Example: Transcription result from main to renderer
export const TranscriptionResultSchema = z.object({
  filePath: z.string(),
  duration: z.number(),
  transcript: z.string(),
});
export type TranscriptionResult = z.infer<typeof TranscriptionResultSchema>;

// Add more IPC contract types as needed for your app's API surface
