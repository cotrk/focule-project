import { useState, useCallback } from 'react';
import { ErrorClassificationService } from '../services/ErrorClassificationService';
import { logger } from '../utils/logger';
import { 
  handleServiceResult,
  createProgressUpdater,
  withProgressTracking,
  validateVideoURL,
  getErrorMessage,
  createSessionContext,
  ERROR_MESSAGES
} from '../utils/serviceHelpers';
import { 
  TranscriptionError,
  ElectronAPIError,
  VideoProcessingError,
  AIModelError
} from '../utils/errorHandling';
import type { 
  SocialContent, 
  TranscriptionState, 
  DownloadVideoResult, 
  DownloadProgress, 
  TranscriptionProgress 
} from '../types';

export function useTranscription() {
  const [state, setState] = useState<TranscriptionState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const classificationService = ErrorClassificationService.getInstance();

  const startTranscription = useCallback(async (url: string) => {
    // Validate input URL first
    const urlValidation = validateVideoURL(url);
    if (!urlValidation.isValid) {
      setState({
        status: 'error',
        progress: 0,
        message: urlValidation.error || ERROR_MESSAGES.INVALID_URL,
        error: urlValidation.error || ERROR_MESSAGES.INVALID_URL,
      });
      return;
    }

    if (!window.electronAPI) {
      const error = new ElectronAPIError(ERROR_MESSAGES.ELECTRON_API_UNAVAILABLE);
      setState({
        status: 'error',
        progress: 0,
        message: error.message,
        error: error.message,
      });
      return;
    }

    // Create session context for tracking
    const sessionContext = createSessionContext();
    let downloadResult: DownloadVideoResult | null = null;

    try {
      // Set up progress tracking
      const updateProgress = createProgressUpdater(
        (update) => setState(prev => ({ ...prev, ...update })),
        0, // Base progress
        25 // Progress range for download (0-25%)
      );

      // Set up progress listeners
      window.electronAPI.onDownloadProgress((progress: DownloadProgress) => {
        updateProgress(
          progress.percent || 0,
          `Downloading: ${progress.downloaded || ''} / ${progress.total || ''}`,
          progress.speed ? `Speed: ${progress.speed}` : undefined
        );
      });

      // Download video with enhanced error handling
      setState({
        status: 'downloading',
        progress: 0,
        message: 'Downloading video...',
      });

      downloadResult = await withProgressTracking(
        () => window.electronAPI.downloadVideo(url),
        (update) => setState(prev => ({ ...prev, ...update })),
        'Initializing download...',
        'Download completed successfully'
      );
      
      if (!downloadResult.success) {
        throw new VideoProcessingError(
          downloadResult.error || ERROR_MESSAGES.DOWNLOAD_FAILED,
          { operation: 'download', sessionId: sessionContext.sessionId }
        );
      }

      // Extract audio with enhanced error handling
      const audioUpdateProgress = createProgressUpdater(
        (update) => setState(prev => ({ ...prev, ...update })),
        25, // Base progress after download
        5 // Progress range for extraction (25-30%)
      );

      setState({
        status: 'extracting',
        progress: 25,
        message: 'Extracting audio...',
      });

      if (!downloadResult.videoPath || !downloadResult.sessionId) {
        throw new VideoProcessingError(
          'Download result missing required video path or session ID',
          { operation: 'audio_extraction', sessionId: sessionContext.sessionId },
          { videoPath: downloadResult.videoPath, sessionId: downloadResult.sessionId }
        );
      }
      
      const audioResult = await withProgressTracking(
        () => window.electronAPI.extractAudio(
          downloadResult.videoPath!, 
          downloadResult.sessionId!
        ),
        audioUpdateProgress,
        'Preparing audio extraction...',
        'Audio extraction completed'
      );
      
      if (!audioResult.success) {
        throw new VideoProcessingError(
          audioResult.error || ERROR_MESSAGES.AUDIO_EXTRACTION_FAILED,
          { operation: 'audio_extraction', sessionId: sessionContext.sessionId }
        );
      }

      // Transcribe with enhanced error handling
      const transcribeUpdateProgress = createProgressUpdater(
        (update) => setState(prev => ({ ...prev, ...update })),
        30, // Base progress after extraction
        50 // Progress range for transcription (30-80%)
      );

      setState({
        status: 'transcribing',
        progress: 30,
        message: 'Transcribing audio...',
      });

      // Get settings for model
      const settings = await window.electronAPI.getSettings();

      // Set up transcription progress listener
      window.electronAPI.onTranscribeProgress((progress: TranscriptionProgress) => {
        transcribeUpdateProgress(
          progress.percent || 0,
          `Transcribing: ${progress.status || ''}`,
          progress.current && progress.total 
            ? `Progress: ${progress.current}/${progress.total}`
            : undefined
        );
      });

      const transcribeResult = await withProgressTracking(
        () => window.electronAPI.transcribeAudio(
          audioResult.audioPath || '',
          settings.whisperModel || ''
        ),
        transcribeUpdateProgress,
        'Initializing transcription...',
        'Transcription completed successfully'
      );
      
      if (!transcribeResult.success) {
        throw new TranscriptionError(
          'TRANSCRIPTION_FAILED',
          transcribeResult.error || ERROR_MESSAGES.TRANSCRIPTION_FAILED,
          'high' as const,
          'user_action' as const,
          'processing' as const,
          { operation: 'transcription', sessionId: sessionContext.sessionId }
        );
      }

      setState({
        status: 'processing',
        progress: 80,
        message: '✨ Transcription complete! Creating social media content...',
      });

      // Process with Ollama for social media content (optional)
      let socialContent: SocialContent | undefined;
      
      if (settings.ollamaModel) {
        try {
          const ollamaResult = await withProgressTracking(
            () => window.electronAPI.processWithOllama(
              transcribeResult.transcript,
              settings.ollamaModel!
            ),
            (update) => setState(prev => ({ ...prev, ...update })),
            'Generating AI content...',
            'AI content generated successfully'
          );
          
          if (ollamaResult.success && ollamaResult.socialContent) {
            socialContent = ollamaResult.socialContent;
          }
        } catch (ollamaError: Error | unknown) {
          // Log AI processing error but don't fail the entire transcription
          const error = ollamaError instanceof Error ? ollamaError : new Error(String(ollamaError));
          logger.warn('Ollama processing failed, continuing without social content', 'transcription', {
            error: error.message,
            stack: error.stack,
            sessionId: sessionContext.sessionId
          });
          
          // Optionally show a toast notification to user
          // ToastManager.warning('AI Content Generation', 'Social content generation failed, but transcription completed successfully.');
        }
      }

      setState({
        status: 'complete',
        progress: 100,
        message: '🎉 Complete!',
        result: {
          transcript: transcribeResult.transcript,
          transcriptWithTimestamps: transcribeResult.transcriptWithTimestamps,
          socialContent,
          title: downloadResult.title ?? 'Untitled',
          videoPath: downloadResult.videoPath,
          audioPath: audioResult.audioPath,
          ollamaModel: settings.ollamaModel || '',
          whisperModel: settings.whisperModel || '',
        },
      });
    } catch (error: Error | unknown) {
      // Enhanced error classification and handling
      const appError = error instanceof Error ? error : new Error(String(error));
      
      // Classify error for better handling
      const classification = classificationService.classifyError(
        appError, 
        {
          operation: 'transcription',
          sessionId: downloadResult?.sessionId || sessionContext.sessionId,
          url,
          platform: urlValidation.platform
        }
      );

      // Use recovery strategies from classification
      const recoveryStrategies = classification.error?.recoveryStrategies || [];
      const hasRetryStrategy = recoveryStrategies.some(s => s.type === 'retry');
      const hasFallbackStrategy = recoveryStrategies.some(s => s.type === 'fallback');

      // Create user-friendly error message using standardized messages
      let userMessage = getErrorMessage(appError, classification.error?.message);
      
      // Add recovery suggestions to message
      if (hasRetryStrategy || hasFallbackStrategy) {
        userMessage += '\n\nYou can try again or use a different approach.';
      }

      // Log the error with enhanced context
      logger.error('Transcription failed', 'transcription', {
        error: appError.message,
        stack: appError.stack,
        sessionId: sessionContext.sessionId,
        url,
        platform: urlValidation.platform,
        classification: classification.error?.code,
        recoveryStrategies: recoveryStrategies.map(s => s.type)
      });

      setState({
        status: 'error',
        progress: 0,
        message: userMessage,
        error: userMessage,
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
    retry: () => {
      if (state.status === 'error' && urlValidation?.url) {
        // Clear error and retry with same URL
        setState({
          status: 'idle',
          progress: 0,
          message: '',
          error: undefined,
        });
        // Auto-start transcription after a short delay
        setTimeout(() => {
          startTranscription(urlValidation.url);
        }, 500);
      }
    },
  };
}

