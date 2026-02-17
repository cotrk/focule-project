import {
  TranscriptionError,
  NetworkError,
  ValidationError,
  VideoProcessingError,
  AIModelError,
  ResourceExhaustionError,
  SessionRecoveryError,
  ElectronAPIError,
  ErrorSeverity,
  ErrorRecoverability,
  ErrorCategory,
  ErrorContext,
  RecoveryStrategy
} from '../utils/errorHandling';

// ============================================================================
// Error Classification Service
// ============================================================================

export interface ErrorPattern {
  regex: RegExp;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoverability: ErrorRecoverability;
  recoveryStrategies: RecoveryStrategy[];
  message?: string;
}

export interface ErrorClassificationResult {
  error: TranscriptionError;
  confidence: number;
  patterns: ErrorPattern[];
  suggestions: string[];
}

export class ErrorClassificationService {
  private static instance: ErrorClassificationService;
  private errorPatterns: ErrorPattern[];
  private errorHistory: Map<string, number> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: number; isOpen: boolean }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly MAX_HISTORY_ENTRIES = 1000;
  private readonly MAX_CIRCUIT_BREAKERS = 500;

  private constructor() {
    this.errorPatterns = this.initializeErrorPatterns();
    this.startPeriodicCleanup();
  }

  public static getInstance(): ErrorClassificationService {
    if (!ErrorClassificationService.instance) {
      ErrorClassificationService.instance = new ErrorClassificationService();
    }
    return ErrorClassificationService.instance;
  }

  private initializeErrorPatterns(): ErrorPattern[] {
    return [
      // Network Errors
      {
        regex: /network|connection|timeout|offline|unreachable/i,
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.HIGH,
        recoverability: ErrorRecoverability.AUTOMATIC,
        recoveryStrategies: [
          {
            type: 'retry',
            maxAttempts: 5,
            delay: 2000,
            userMessage: 'Network connection failed. Retrying with exponential backoff...'
          },
          {
            type: 'fallback',
            fallbackOptions: ['offline_mode', 'cached_content'],
            userMessage: 'Network unavailable. Using offline mode or cached content.'
          }
        ]
      },
      {
        regex: /http error 403|forbidden|blocked/i,
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.HIGH,
        recoverability: ErrorRecoverability.USER_ACTION,
        recoveryStrategies: [
          {
            type: 'retry',
            maxAttempts: 3,
            delay: 5000,
            userMessage: 'Access blocked. Waiting before retry...'
          },
          {
            type: 'fallback',
            fallbackOptions: ['alternative_source', 'different_format'],
            userMessage: 'Access blocked. Trying alternative sources...'
          }
        ],
        message: 'Access blocked. The service may be temporarily unavailable or require authentication.'
      },
      {
        regex: /http error 429|too many requests|rate limit/i,
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        recoverability: ErrorRecoverability.AUTOMATIC,
        recoveryStrategies: [
          {
            type: 'retry',
            maxAttempts: 3,
            delay: 10000,
            userMessage: 'Rate limit exceeded. Waiting before retry...'
          }
        ],
        message: 'Rate limit exceeded. Please wait before making more requests.'
      },

      // Video Processing Errors
      {
        regex: /ffmpeg|video processing|audio extraction|codec|format/i,
        category: ErrorCategory.PROCESSING,
        severity: ErrorSeverity.HIGH,
        recoverability: ErrorRecoverability.AUTOMATIC,
        recoveryStrategies: [
          {
            type: 'retry',
            maxAttempts: 3,
            delay: 1500,
            userMessage: 'Video processing failed. Retrying with different parameters...'
          },
          {
            type: 'fallback',
            fallbackOptions: ['lower_quality', 'audio_only'],
            userMessage: 'Processing failed. Trying with lower quality or audio-only mode.'
          }
        ]
      },
      {
        regex: /corrupted|invalid file|unsupported format/i,
        category: ErrorCategory.PROCESSING,
        severity: ErrorSeverity.HIGH,
        recoverability: ErrorRecoverability.USER_ACTION,
        recoveryStrategies: [
          {
            type: 'fallback',
            fallbackOptions: ['alternative_source', 'different_format'],
            userMessage: 'File appears corrupted. Trying alternative sources...'
          }
        ],
        message: 'The file may be corrupted or in an unsupported format.'
      },

      // AI Model Errors
      {
        regex: /whisper|transcription|ai model|ollama|llm/i,
        category: ErrorCategory.AI,
        severity: ErrorSeverity.HIGH,
        recoverability: ErrorRecoverability.AUTOMATIC,
        recoveryStrategies: [
          {
            type: 'fallback',
            fallbackOptions: ['smaller_model', 'alternative_model'],
            userMessage: 'AI model failed. Switching to a more reliable model...'
          },
          {
            type: 'retry',
            maxAttempts: 2,
            delay: 3000,
            userMessage: 'AI processing failed. Retrying with different settings...'
          }
        ]
      },
      {
        regex: /out of memory|memory|gpu|cuda/i,
        category: ErrorCategory.RESOURCE,
        severity: ErrorSeverity.HIGH,
        recoverability: ErrorRecoverability.USER_ACTION,
        recoveryStrategies: [
          {
            type: 'fallback',
            fallbackOptions: ['smaller_model', 'reduced_quality'],
            userMessage: 'Insufficient memory. Switching to resource-efficient mode...'
          },
          {
            type: 'skip',
            userMessage: 'Insufficient system resources. Please close other applications and try again.',
            requiresUserAction: true
          }
        ],
        message: 'Insufficient memory or system resources for AI processing.'
      },

      // System Errors
      {
        regex: /permission|access denied|unauthorized/i,
        category: ErrorCategory.PERMISSION,
        severity: ErrorSeverity.HIGH,
        recoverability: ErrorRecoverability.USER_ACTION,
        recoveryStrategies: [
          {
            type: 'skip',
            userMessage: 'Permission denied. Please check file permissions and try again.',
            requiresUserAction: true
          }
        ],
        message: 'Permission denied. Check file or directory permissions.'
      },
      {
        regex: /disk space|storage|no space/i,
        category: ErrorCategory.RESOURCE,
        severity: ErrorSeverity.CRITICAL,
        recoverability: ErrorRecoverability.USER_ACTION,
        recoveryStrategies: [
          {
            type: 'skip',
            userMessage: 'Insufficient disk space. Please free up space and try again.',
            requiresUserAction: true
          }
        ],
        message: 'Insufficient disk space for processing.'
      },

      // Validation Errors
      {
        regex: /invalid url|malformed|validation|required/i,
        category: ErrorCategory.USER_INPUT,
        severity: ErrorSeverity.MEDIUM,
        recoverability: ErrorRecoverability.USER_ACTION,
        recoveryStrategies: [
          {
            type: 'skip',
            userMessage: 'Invalid input detected. Please check your input and try again.',
            requiresUserAction: true
          }
        ],
        message: 'Invalid input. Please check the format and try again.'
      }
    ];
  }

  public classifyError(
    error: Error | string,
    context?: Partial<ErrorContext>
  ): ErrorClassificationResult {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;
    
    const matchedPatterns = this.findMatchingPatterns(errorMessage);
    const bestMatch = this.selectBestPattern(matchedPatterns, errorMessage);
    
    const classifiedError = this.createErrorFromPattern(
      bestMatch,
      errorMessage,
      context,
      errorStack
    );
    
    const confidence = this.calculateConfidence(bestMatch, errorMessage);
    const suggestions = this.generateSuggestions(bestMatch, classifiedError);
    
    // Track error for circuit breaker and analytics
    this.trackError(classifiedError);
    
    return {
      error: classifiedError,
      confidence,
      patterns: matchedPatterns,
      suggestions
    };
  }

  private findMatchingPatterns(errorMessage: string): ErrorPattern[] {
    return this.errorPatterns.filter(pattern => 
      pattern.regex.test(errorMessage)
    );
  }

  private selectBestPattern(patterns: ErrorPattern[], errorMessage: string): ErrorPattern | null {
    if (patterns.length === 0) {
      return null;
    }
    
    // Score patterns based on specificity and match quality
    const scoredPatterns = patterns.map(pattern => ({
      pattern,
      score: this.scorePattern(pattern, errorMessage)
    }));
    
    scoredPatterns.sort((a, b) => b.score - a.score);
    return scoredPatterns[0].pattern;
  }

  private scorePattern(pattern: ErrorPattern, errorMessage: string): number {
    let score = 0;
    
    // More specific patterns get higher scores
    const patternString = pattern.regex.source;
    score += patternString.length * 0.1;
    
    // Exact matches get higher scores
    if (pattern.regex.test(errorMessage.toLowerCase())) {
      score += 5;
    }
    
    // Severity weighting
    switch (pattern.severity) {
      case ErrorSeverity.CRITICAL:
        score += 3;
        break;
      case ErrorSeverity.HIGH:
        score += 2;
        break;
      case ErrorSeverity.MEDIUM:
        score += 1;
        break;
    }
    
    return score;
  }

  private createErrorFromPattern(
    pattern: ErrorPattern | null,
    errorMessage: string,
    context?: Partial<ErrorContext>,
    stackTrace?: string
  ): TranscriptionError {
    const fullContext = { ...context, stackTrace };
    
    if (!pattern) {
      // Default error classification
      return new TranscriptionError(
        'UNKNOWN_ERROR',
        errorMessage,
        ErrorSeverity.MEDIUM,
        ErrorRecoverability.USER_ACTION,
        ErrorCategory.SYSTEM,
        fullContext
      );
    }

    const message = pattern.message || errorMessage;
    
    // Create error based on category with proper constructor signature
    switch (pattern.category) {
      case ErrorCategory.NETWORK:
        return new NetworkError(message, fullContext, pattern.recoveryStrategies);
      case ErrorCategory.PROCESSING:
        return new VideoProcessingError(message, fullContext, pattern.recoveryStrategies);
      case ErrorCategory.AI:
        return new AIModelError(message, fullContext, pattern.recoveryStrategies);
      case ErrorCategory.RESOURCE:
        return new ResourceExhaustionError(message, fullContext, pattern.recoveryStrategies);
      case ErrorCategory.PERMISSION:
        return new ElectronAPIError(message, fullContext, pattern.recoveryStrategies);
      case ErrorCategory.USER_INPUT:
        return new ValidationError(message, fullContext, pattern.recoveryStrategies);
      default:
        return new TranscriptionError(
          'UNKNOWN_ERROR',
          message,
          pattern.severity,
          pattern.recoverability,
          pattern.category,
          fullContext,
          pattern.recoveryStrategies
        );
    }
  }


  private calculateConfidence(pattern: ErrorPattern | null, errorMessage: string): number {
    if (!pattern) return 0.1; // Low confidence for unknown errors
    
    const patternString = pattern.regex.source;
    const messageLength = errorMessage.length;
    const patternLength = patternString.length;
    
    // Higher confidence for more specific patterns
    let confidence = Math.min(patternLength / messageLength, 0.8);
    
    // Boost confidence for exact word matches
    const words = errorMessage.toLowerCase().split(/\s+/);
    const patternWords = patternString.toLowerCase().split(/\s+/);
    const matchingWords = words.filter(word => 
      patternWords.some(pWord => pWord.includes(word) || word.includes(pWord))
    );
    
    confidence += (matchingWords.length / words.length) * 0.2;
    
    return Math.min(confidence, 1.0);
  }

  private generateSuggestions(pattern: ErrorPattern | null, error: TranscriptionError): string[] {
    const suggestions: string[] = [];
    
    if (pattern) {
      suggestions.push(...pattern.recoveryStrategies.map(s => s.userMessage || ''));
    }
    
    // Add category-specific suggestions
    switch (error.category) {
      case ErrorCategory.NETWORK:
        suggestions.push('Check your internet connection');
        suggestions.push('Try using a VPN if the issue persists');
        break;
      case ErrorCategory.PROCESSING:
        suggestions.push('Try with a different video format');
        suggestions.push('Ensure the video file is not corrupted');
        break;
      case ErrorCategory.AI:
        suggestions.push('Try with a smaller AI model');
        suggestions.push('Check if the audio quality is clear');
        break;
      case ErrorCategory.RESOURCE:
        suggestions.push('Close other applications to free up resources');
        suggestions.push('Try with a smaller file or lower quality');
        break;
    }
    
    return suggestions.filter(s => s.length > 0);
  }

  private trackError(error: TranscriptionError): void {
    const key = `${error.category}_${error.code}`;
    const count = this.errorHistory.get(key) || 0;
    this.errorHistory.set(key, count + 1);
    
    // Update circuit breaker
    const circuitBreaker = this.circuitBreakers.get(key) || {
      failures: 0,
      lastFailure: 0,
      isOpen: false
    };
    
    circuitBreaker.failures++;
    circuitBreaker.lastFailure = Date.now();
    
    // Open circuit breaker if too many failures
    if (circuitBreaker.failures >= 5) {
      circuitBreaker.isOpen = true;
    }
    
    // Reset circuit breaker after cooldown period
    if (circuitBreaker.isOpen && Date.now() - circuitBreaker.lastFailure > 300000) { // 5 minutes
      circuitBreaker.isOpen = false;
      circuitBreaker.failures = 0;
    }
    
    this.circuitBreakers.set(key, circuitBreaker);
  }

  public isCircuitBreakerOpen(category: ErrorCategory, code: string): boolean {
    const key = `${category}_${code}`;
    const circuitBreaker = this.circuitBreakers.get(key);
    return circuitBreaker?.isOpen || false;
  }

  public getErrorStatistics(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    this.errorHistory.forEach((count, key) => {
      stats[key] = count;
    });
    return stats;
  }

  public resetErrorHistory(): void {
    this.errorHistory.clear();
    this.circuitBreakers.clear();
  }

  public addCustomPattern(pattern: ErrorPattern): void {
    this.errorPatterns.push(pattern);
  }

  public removePattern(index: number): void {
    if (index >= 0 && index < this.errorPatterns.length) {
      this.errorPatterns.splice(index, 1);
    }
  }

  public getPatterns(): ErrorPattern[] {
    return [...this.errorPatterns];
  }

  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldEntries();
    }, 600000); // 10 minutes
  }

  private cleanupOldEntries(): void {
    const cutoff = Date.now() - 3600000; // 1 hour ago
    
    // Clean up old circuit breakers
    for (const [key, breaker] of this.circuitBreakers.entries()) {
      if (breaker.lastFailure < cutoff) {
        this.circuitBreakers.delete(key);
      }
    }
    
    // Limit size of maps
    if (this.errorHistory.size > this.MAX_HISTORY_ENTRIES) {
      const entries = Array.from(this.errorHistory.entries());
      entries.sort((a, b) => a[1] - b[1]); // Sort by count (ascending)
      const toDelete = entries.slice(0, entries.length - this.MAX_HISTORY_ENTRIES);
      toDelete.forEach(([key]) => this.errorHistory.delete(key));
    }
    
    if (this.circuitBreakers.size > this.MAX_CIRCUIT_BREAKERS) {
      const entries = Array.from(this.circuitBreakers.entries());
      entries.sort((a, b) => a[1].lastFailure - b[1].lastFailure); // Sort by last failure (ascending)
      const toDelete = entries.slice(0, entries.length - this.MAX_CIRCUIT_BREAKERS);
      toDelete.forEach(([key]) => this.circuitBreakers.delete(key));
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.errorHistory.clear();
    this.circuitBreakers.clear();
  }
}
