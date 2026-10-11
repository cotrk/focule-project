import { useState, useCallback } from 'react';

export interface SocialContent {
  hooks: string[];
  description: string;
  hashtags: string[];
  keywords: string[];
  filenames: string[];
  imagePrompts: string[];
}

interface TranscriptionState {
  status: 'idle' | 'downloading' | 'extracting' | 'transcribing' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
  result?: {
    transcript: string;
    transcriptWithTimestamps: string;
    socialContent?: SocialContent;
    title: string;
    videoPath?: string;
    audioPath?: string;
    ollamaModel?: string;
    whisperModel?: string;
  };
  error?: string;
  warning?: string;
}

export function useTranscription() {
  const [state, setState] = useState<TranscriptionState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const startTranscription = useCallback(async (url: string) => {
    if (!window.electronAPI) {
      setState({
        status: 'error',
        progress: 0,
        message: 'Electron API not available',
        error: 'This app must be run in Electron',
      });
      return;
    }

    try {
      setState({
        status: 'downloading',
        progress: 0,
        message: 'Downloading video...',
      });

      // Set up progress listeners
      window.electronAPI.onDownloadProgress((progress: any) => {
        setState((prev) => ({
          ...prev,
          progress: progress.percent || 0,
          message: `Downloading: ${progress.downloaded || ''} / ${progress.total || ''}`,
        }));
      });

      // Download video
      const downloadResult = await window.electronAPI.downloadVideo(url);
      if (!downloadResult.success) {
        throw new Error(downloadResult.error || 'Download failed');
      }

      setState({
        status: 'extracting',
        progress: 25,
        message: 'Extracting audio...',
      });

      // Extract audio (pass sessionId for isolation)
      const audioResult = await window.electronAPI.extractAudio(downloadResult.videoPath, downloadResult.sessionId);
      if (!audioResult.success) {
        throw new Error(audioResult.error || 'Audio extraction failed');
      }

      setState({
        status: 'transcribing',
        progress: 30,
        message: 'Transcribing audio...',
      });

      // Get settings for model
      const settings = await window.electronAPI.getSettings();

      // Set up transcription progress listener
      window.electronAPI.onTranscribeProgress((progress: any) => {
        const baseProgress = 30;
        const progressRange = 50; // 30-80%
        const adjustedProgress = baseProgress + (progress.percent / 100) * progressRange;
        setState((prev) => ({
          ...prev,
          progress: adjustedProgress,
          message: `Transcribing: ${progress.status || ''}`,
        }));
      });

      // Transcribe
      const transcribeResult = await window.electronAPI.transcribeAudio(
        audioResult.audioPath,
        settings.whisperModel
      );
      if (!transcribeResult.success) {
        throw new Error(transcribeResult.error || 'Transcription failed');
      }

      setState({
        status: 'processing',
        progress: 80,
        message: '✨ Transcription complete! Creating social media content...',
      });

      // Process with Ollama for social media content (optional)
      let socialContent: SocialContent | undefined;
      let contentWarning: string | undefined;
      
      try {
        const ollamaResult = await window.electronAPI.processWithOllama(
          transcribeResult.transcript,
          settings.ollamaModel
        );
        if (ollamaResult.success && ollamaResult.socialContent) {
          socialContent = ollamaResult.socialContent;
        } else {
          throw new Error(ollamaResult.error || 'The local model did not return social media content.');
        }
      } catch (ollamaError) {
        contentWarning = ollamaError instanceof Error ? ollamaError.message : String(ollamaError);
        console.warn('Ollama processing failed, continuing with the transcript only:', contentWarning);
      }

      setState({
        status: 'complete',
        progress: 100,
        message: 'Complete',
        warning: contentWarning,
        result: {
          transcript: transcribeResult.transcript,
          transcriptWithTimestamps: transcribeResult.transcriptWithTimestamps,
          socialContent,
          title: downloadResult.title || 'Untitled',
          videoPath: downloadResult.videoPath,
          audioPath: audioResult.audioPath,
          ollamaModel: settings.ollamaModel,
          whisperModel: settings.whisperModel,
        },
      });
    } catch (error: any) {
      setState({
        status: 'error',
        progress: 0,
        message: 'Error occurred',
        error: error.message || 'Unknown error',
      });
    } finally {
      // Clean up listeners
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('download:progress');
        window.electronAPI.removeAllListeners('transcribe:progress');
      }
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      progress: 0,
      message: '',
    });
  }, []);

  return {
    state,
    startTranscription,
    reset,
  };
}
