import { useState, useCallback, useRef } from 'react';
import type { 
  TranscriptionState, 
  TranscriptionStatus, 
  TranscriptionResult,
  DownloadProgress,
  TranscriptionProgress 
} from '../types';

interface UseTranscriptionOptions {
  onProgress?: (progress: number, message: string) => void;
  onComplete?: (result: TranscriptionResult) => void;
  onError?: (error: string) => void;
}

interface TranscriptionActions {
  startTranscription: (url: string) => Promise<void>;
  reset: () => void;
  updateProgress: (progress: number, message: string) => void;
  setStatus: (status: TranscriptionStatus) => void;
}

export function useTranscriptionEnhanced(options: UseTranscriptionOptions = {}): TranscriptionState & TranscriptionActions {
  const [state, setState] = useState<TranscriptionState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const listenersRef = useRef<{
    download?: (progress: DownloadProgress) => void;
    transcription?: (progress: TranscriptionProgress) => void;
  }>({});

  const updateProgress = useCallback((progress: number, message: string) => {
    setState(prev => ({ ...prev, progress, message }));
    options.onProgress?.(progress, message);
  }, [options.onProgress]);

  const setStatus = useCallback((status: TranscriptionStatus) => {
    setState(prev => ({ ...prev, status }));
  }, []);

  const startTranscription = useCallback(async (url: string) => {
    if (!window.electronAPI) {
      const error = 'Electron API not available';
      setState({
        status: 'error',
        progress: 0,
        message: 'Error occurred',
        error,
      });
      options.onError?.(error);
      return;
    }

    try {
      setState({
        status: 'downloading',
        progress: 0,
        message: 'Downloading video...',
      });

      // Set up progress listeners with proper cleanup
      listenersRef.current.download = (progress: DownloadProgress) => {
        updateProgress(progress.percent || 0, `Downloading: ${progress.downloaded || ''} / ${progress.total || ''}`);
      };

      window.electronAPI.onDownloadProgress(listenersRef.current.download);

      // Download video
      const downloadResult = await window.electronAPI.downloadVideo(url);
      if (!downloadResult.success) {
        throw new Error(downloadResult.error || 'Download failed');
      }

      setState(prev => ({
        ...prev,
        status: 'extracting',
        progress: 25,
        message: 'Extracting audio...',
      }));

      // Extract audio
      const audioResult = await window.electronAPI.extractAudio(
        downloadResult.videoPath!, 
        downloadResult.sessionId!
      );
      if (!audioResult.success) {
        throw new Error(audioResult.error || 'Audio extraction failed');
      }

      setState(prev => ({
        ...prev,
        status: 'transcribing',
        progress: 30,
        message: 'Transcribing audio...',
      }));

      // Get settings for model
      const settings = await window.electronAPI.getSettings();

      // Set up transcription progress listener
      listenersRef.current.transcription = (progress: TranscriptionProgress) => {
        const baseProgress = 30;
        const progressRange = 50; // 30-80%
        const adjustedProgress = baseProgress + (progress.percent / 100) * progressRange;
        updateProgress(adjustedProgress, `Transcribing: ${progress.status || ''}`);
      };

      window.electronAPI.onTranscribeProgress(listenersRef.current.transcription);

      // Transcribe
      const transcribeResult = await window.electronAPI.transcribeAudio(
        audioResult.audioPath!,
        settings.whisperModel
      );
      if (!transcribeResult.success) {
        throw new Error(transcribeResult.error || 'Transcription failed');
      }

      setState(prev => ({
        ...prev,
        status: 'processing',
        progress: 80,
        message: '✨ Transcription complete! Creating social media content...',
      }));

      // Process with Ollama for social media content (optional)
      let socialContent: TranscriptionResult['socialContent'];
      
      try {
        const ollamaResult = await window.electronAPI.processWithOllama(
          transcribeResult.transcript!,
          settings.ollamaModel
        );
        if (ollamaResult.success && ollamaResult.socialContent) {
          socialContent = ollamaResult.socialContent;
        }
      } catch (ollamaError) {
        console.warn('Ollama processing failed, continuing without social content:', ollamaError);
      }

      const result: TranscriptionResult = {
        transcript: transcribeResult.transcript!,
        transcriptWithTimestamps: transcribeResult.transcriptWithTimestamps!,
        socialContent,
        title: downloadResult.title || 'Untitled',
        videoPath: downloadResult.videoPath,
        audioPath: audioResult.audioPath,
        ollamaModel: settings.ollamaModel,
        whisperModel: settings.whisperModel,
      };

      setState({
        status: 'complete',
        progress: 100,
        message: '🎉 Complete!',
        result,
      });

      options.onComplete?.(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({
        status: 'error',
        progress: 0,
        message: 'Error occurred',
        error: errorMessage,
      });
      options.onError?.(errorMessage);
    } finally {
      // Clean up listeners
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('download:progress');
        window.electronAPI.removeAllListeners('transcribe:progress');
      }
      listenersRef.current = {};
    }
  }, [updateProgress, options]);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      progress: 0,
      message: '',
    });
  }, []);

  return {
    ...state,
    startTranscription,
    reset,
    updateProgress,
    setStatus,
  };
}
