import { RecoveryService } from './RecoveryService';
import { AdvancedRetryService } from './AdvancedRetryService';
import { VideoProcessingError, ErrorSeverity, ErrorCategory } from '../utils/errorHandling';

// ============================================================================
// Video Processing Fallback Service
// ============================================================================

export interface VideoProcessingOptions {
  quality: 'high' | 'medium' | 'low';
  format: 'mp4' | 'webm' | 'avi';
  resolution: '1080p' | '720p' | '480p' | '360p';
  audioOnly: boolean;
  codec: string;
}

export interface FallbackChain {
  primary: VideoProcessingOptions;
  fallbacks: VideoProcessingOptions[];
}

export interface ProcessingResult {
  success: boolean;
  outputPath?: string;
  duration?: number;
  quality?: string;
  format?: string;
  error?: Error;
  usedFallback?: boolean;
  fallbackLevel?: number;
}

export class VideoProcessingFallbackService {
  private static instance: VideoProcessingFallbackService;
  private recoveryService: RecoveryService;

  private constructor() {
    this.recoveryService = RecoveryService.getInstance();
  }

  public static getInstance(): VideoProcessingFallbackService {
    if (!VideoProcessingFallbackService.instance) {
      VideoProcessingFallbackService.instance = new VideoProcessingFallbackService();
    }
    return VideoProcessingFallbackService.instance;
  }

  // ============================================================================
  // Fallback Chain Generation
  // ============================================================================

  public generateFallbackChain(
    inputOptions: Partial<VideoProcessingOptions>
  ): FallbackChain {
    const primary: VideoProcessingOptions = {
      quality: inputOptions.quality || 'high',
      format: inputOptions.format || 'mp4',
      resolution: inputOptions.resolution || '1080p',
      audioOnly: inputOptions.audioOnly || false,
      codec: inputOptions.codec || 'h264'
    };

    const fallbacks: VideoProcessingOptions[] = [];

    // Generate quality fallbacks
    if (primary.quality === 'high') {
      fallbacks.push({ ...primary, quality: 'medium' });
      fallbacks.push({ ...primary, quality: 'low' });
    } else if (primary.quality === 'medium') {
      fallbacks.push({ ...primary, quality: 'low' });
    }

    // Generate resolution fallbacks
    if (primary.resolution === '1080p') {
      fallbacks.push({ ...primary, resolution: '720p' });
      fallbacks.push({ ...primary, resolution: '480p' });
      fallbacks.push({ ...primary, resolution: '360p' });
    } else if (primary.resolution === '720p') {
      fallbacks.push({ ...primary, resolution: '480p' });
      fallbacks.push({ ...primary, resolution: '360p' });
    } else if (primary.resolution === '480p') {
      fallbacks.push({ ...primary, resolution: '360p' });
    }

    // Generate format fallbacks
    if (primary.format === 'mp4') {
      fallbacks.push({ ...primary, format: 'webm' });
      fallbacks.push({ ...primary, format: 'avi' });
    } else if (primary.format === 'webm') {
      fallbacks.push({ ...primary, format: 'mp4' });
      fallbacks.push({ ...primary, format: 'avi' });
    }

    // Audio-only fallback
    if (!primary.audioOnly) {
      fallbacks.push({
        quality: 'medium',
        format: 'mp4',
        resolution: '720p',
        audioOnly: true,
        codec: 'aac'
      });
    }

    // Remove duplicates and limit to reasonable number
    const uniqueFallbacks = this.removeDuplicates(fallbacks).slice(0, 8);

    return { primary, fallbacks: uniqueFallbacks };
  }

  // ============================================================================
  // Processing with Fallbacks
  // ============================================================================

  public async processVideoWithFallbacks(
    inputPath: string,
    outputPath: string,
    options: Partial<VideoProcessingOptions>
  ): Promise<ProcessingResult> {
    const chain = this.generateFallbackChain(options);
    const operations = [
      () => this.processVideo(inputPath, outputPath, chain.primary),
      ...chain.fallbacks.map(fallback => 
        () => this.processVideo(inputPath, outputPath, fallback)
      )
    ];

    const result = await this.recoveryService.executeWithFallback(
      operations[0],
      operations.slice(1),
      `video_processing_${this.getOperationId(inputPath)}`,
      {
        maxAttempts: 2,
        baseDelay: 1000,
        onRetry: (attempt, error) => {
          console.warn(`Video processing attempt ${attempt} failed:`, error.message);
        }
      }
    );

    if (result.success && result.result) {
      return {
        ...result.result,
        usedFallback: result.recoveryStrategy?.type === 'fallback',
        fallbackLevel: this.getFallbackLevel(chain, result.recoveryStrategy)
      };
    }

    return {
      success: false,
      error: result.error
    };
  }

  // ============================================================================
  // Audio Extraction with Fallbacks
  // ============================================================================

  public async extractAudioWithFallbacks(
    videoPath: string,
    audioPath: string,
    options: {
      sampleRate?: number;
      bitrate?: number;
      format?: string;
    } = {}
  ): Promise<ProcessingResult> {
    const audioOptions = [
      {
        sampleRate: options.sampleRate || 16000,
        bitrate: options.bitrate || 128,
        format: options.format || 'wav'
      },
      {
        sampleRate: 16000,
        bitrate: 96,
        format: 'wav'
      },
      {
        sampleRate: 16000,
        bitrate: 64,
        format: 'mp3'
      },
      {
        sampleRate: 8000,
        bitrate: 32,
        format: 'wav'
      }
    ];

    const operations = audioOptions.map(opts => 
      () => this.extractAudio(videoPath, audioPath, opts)
    );

    const result = await this.recoveryService.executeWithFallback(
      operations[0],
      operations.slice(1),
      `audio_extraction_${this.getOperationId(videoPath)}`,
      {
        maxAttempts: 3,
        baseDelay: 1500
      }
    );

    if (result.success && result.result) {
      return {
        ...result.result,
        usedFallback: result.recoveryStrategy?.type === 'fallback'
      };
    }

    return {
      success: false,
      error: result.error
    };
  }

  // ============================================================================
  // FFmpeg Command Generation with Fallbacks
  // ============================================================================

  public generateFFmpegCommand(
    inputPath: string,
    outputPath: string,
    options: VideoProcessingOptions
  ): string[] {
    const args = ['-i', inputPath];

    // Video codec and quality settings
    if (!options.audioOnly) {
      switch (options.codec) {
        case 'h264':
          args.push('-c:v', 'libx264');
          break;
        case 'h265':
          args.push('-c:v', 'libx265');
          break;
        case 'vp9':
          args.push('-c:v', 'libvpx-vp9');
          break;
        default:
          args.push('-c:v', 'libx264');
      }

      // Quality settings
      switch (options.quality) {
        case 'high':
          args.push('-crf', '18');
          break;
        case 'medium':
          args.push('-crf', '23');
          break;
        case 'low':
          args.push('-crf', '28');
          break;
      }

      // Resolution settings
      switch (options.resolution) {
        case '1080p':
          args.push('-vf', 'scale=1920:1080');
          break;
        case '720p':
          args.push('-vf', 'scale=1280:720');
          break;
        case '480p':
          args.push('-vf', 'scale=854:480');
          break;
        case '360p':
          args.push('-vf', 'scale=640:360');
          break;
      }
    } else {
      // Audio only - disable video
      args.push('-vn');
    }

    // Audio settings
    args.push('-c:a', 'aac');
    args.push('-ar', '16000');
    args.push('-b:a', '128k');

    // Format settings
    args.push('-f', options.format);
    args.push('-y'); // Overwrite output
    args.push(outputPath);

    return args;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async processVideo(
    inputPath: string,
    outputPath: string,
    options: VideoProcessingOptions
  ): Promise<ProcessingResult> {
    try {
      // This would integrate with the actual FFmpeg service
      const args = this.generateFFmpegCommand(inputPath, outputPath, options);
      
      // Simulate processing (replace with actual FFmpeg call)
      console.log(`Processing video with options:`, options);
      console.log(`FFmpeg args:`, args.join(' '));
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        outputPath,
        quality: options.quality,
        format: options.format,
        duration: 0 // Would be extracted from actual processing
      };
    } catch (error) {
      throw new VideoProcessingError(
        `Video processing failed: ${error instanceof Error ? error.message : String(error)}`,
        { operation: 'process_video', metadata: { inputPath, outputPath, options } }
      );
    }
  }

  private async extractAudio(
    videoPath: string,
    audioPath: string,
    options: {
      sampleRate: number;
      bitrate: number;
      format: string;
    }
  ): Promise<ProcessingResult> {
    try {
      // This would integrate with the actual audio extraction service
      console.log(`Extracting audio with options:`, options);
      
      // Simulate extraction time
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        outputPath: audioPath,
        quality: `${options.sampleRate}Hz_${options.bitrate}kbps`,
        format: options.format
      };
    } catch (error) {
      throw new VideoProcessingError(
        `Audio extraction failed: ${error instanceof Error ? error.message : String(error)}`,
        { operation: 'extract_audio', metadata: { videoPath, audioPath, options } }
      );
    }
  }

  private removeDuplicates<T>(array: T[]): T[] {
    return array.filter((item, index) => 
      array.findIndex(i => JSON.stringify(i) === JSON.stringify(item)) === index
    );
  }

  private getOperationId(inputPath: string): string {
    return inputPath.split(/[/\\\\]/).pop()?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
  }

  private getFallbackLevel(
    chain: FallbackChain,
    strategy?: { fallbackOptions?: string[] }
  ): number | undefined {
    if (!strategy?.fallbackOptions || strategy.fallbackOptions.length === 0) {
      return 0; // Primary
    }
    
    const fallbackName = strategy.fallbackOptions[0];
    const match = fallbackName.match(/fallback_(\\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  public getOptimalSettings(
    fileSize: number,
    duration: number,
    availableSpace: number
  ): VideoProcessingOptions {
    // Calculate optimal settings based on file constraints
    const fileSizeMB = fileSize / (1024 * 1024);
    const durationMinutes = duration / 60;
    const spaceMB = availableSpace / (1024 * 1024);

    let settings: VideoProcessingOptions = {
      quality: 'medium',
      format: 'mp4',
      resolution: '720p',
      audioOnly: false,
      codec: 'h264'
    };

    // Adjust based on file size
    if (fileSizeMB > 500) {
      settings.quality = 'low';
      settings.resolution = '480p';
    } else if (fileSizeMB < 50) {
      settings.quality = 'high';
      settings.resolution = '1080p';
    }

    // Adjust based on available space
    if (spaceMB < fileSizeMB * 2) {
      settings.audioOnly = true;
      settings.quality = 'low';
    }

    // Adjust based on duration
    if (durationMinutes > 60) {
      settings.quality = 'low';
      settings.resolution = '480p';
    }

    return settings;
  }

  public validateProcessingRequirements(
    inputPath: string,
    options: VideoProcessingOptions
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check file existence
    // This would integrate with actual file system checks
    
    // Check format compatibility
    const supportedFormats = ['mp4', 'webm', 'avi', 'mov'];
    if (!supportedFormats.includes(options.format)) {
      issues.push(`Unsupported format: ${options.format}`);
    }

    // Check resolution constraints
    const resolutions = ['1080p', '720p', '480p', '360p'];
    if (!resolutions.includes(options.resolution)) {
      issues.push(`Unsupported resolution: ${options.resolution}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}
