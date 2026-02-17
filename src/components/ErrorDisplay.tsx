import React, { useState, useEffect } from 'react';
import { ErrorClassificationService } from '../services/ErrorClassificationService';
import { RecoveryService } from '../services/RecoveryService';
import { SessionRecoveryService } from '../services/SessionRecoveryService';
import { TranscriptionError, RecoveryStrategy } from '../utils/errorHandling';
import { useServiceCache } from '../hooks/useServiceCache';

interface ErrorDisplayProps {
  error: string | Error | TranscriptionError;
  type?: 'network' | 'validation' | 'system' | 'permission' | 'download' | 'transcription' | 'ai' | 'resource';
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  sessionId?: string;
  operationId?: string;
}

export function ErrorDisplay({ 
  error, 
  type = 'system', 
  onRetry, 
  onDismiss,
  showDetails = false,
  sessionId,
  operationId
}: ErrorDisplayProps): JSX.Element {
  const [classification, setClassification] = useState<{
    error: Error;
    recoveryStrategies: Array<{
      type: string;
      userMessage?: string;
      maxAttempts?: number;
      delay?: number;
      fallbackOptions?: string[];
      requiresUserAction?: boolean;
    }>;
    confidence: number;
    patterns: Array<{
      regex: RegExp;
      category: string;
      severity: string;
      recoverability: string;
      recoveryStrategies: unknown[];
      message?: string;
    }>;
    suggestions: string[];
  } | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState(0);
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);

  const services = useServiceCache();

  useEffect(() => {
    // Classify the error
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const result = services.errorClassificationService.classifyError(errorObj, { sessionId, operation: operationId });
    setClassification(result);
  }, [error, sessionId, operationId]);
  const getErrorConfig = () => {
    // Use classified error if available, otherwise fall back to type-based config
    if (classification?.error) {
      return getClassifiedErrorConfig(classification.error);
    }
    
    // Fallback to original type-based config
    switch (type) {
      case 'network':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Network Connection Error',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          suggestions: [
            'Check your internet connection',
            'Try refreshing the page',
            'Verify the video URL is accessible'
          ]
        };
      
      case 'validation':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Invalid Input',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          suggestions: [
            'Double-check the video URL format',
            'Ensure the URL is from YouTube or Twitch',
            'Try a different video link'
          ]
        };
      
      case 'permission':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
          title: 'Permission Denied',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20',
          suggestions: [
            'Check if the video is publicly accessible',
            'Verify you have the necessary permissions',
            'Try a different video URL'
          ]
        };
      
      case 'download':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          ),
          title: 'Download Failed',
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/20',
          suggestions: [
            'Check if the video is still available',
            'Try a shorter video (under 2 hours)',
            'Verify your internet connection is stable'
          ]
        };
      
      case 'transcription':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ),
          title: 'Transcription Error',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          suggestions: [
            'Check if the video has clear audio',
            'Try a video with better sound quality',
            'Ensure the video language is supported'
          ]
        };
      
      case 'ai':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
          title: 'AI Processing Error',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20',
          suggestions: [
            'AI model may be unavailable',
            'Try with a smaller AI model',
            'Check if AI service is running'
          ]
        };
      
      case 'resource':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
          title: 'Resource Error',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          suggestions: [
            'System resources are low',
            'Close other applications',
            'Try with a smaller file'
          ]
        };
      
      default:
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'System Error',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          suggestions: [
            'Try refreshing the page',
            'Restart the application',
            'Contact support if the issue persists'
          ]
        };
    }
  };

  const getClassifiedErrorConfig = (error: TranscriptionError) => {
    // Get base config based on error category instead of type
    let baseConfig;
    switch (error.category) {
      case 'network':
        baseConfig = {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Network Connection Error',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          suggestions: [
            'Check your internet connection',
            'Try refreshing the page',
            'Verify the video URL is accessible'
          ]
        };
        break;
      case 'processing':
        baseConfig = {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          ),
          title: 'Processing Error',
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/20',
          suggestions: [
            'Check if the video has clear audio',
            'Try a video with better sound quality',
            'Ensure the video language is supported'
          ]
        };
        break;
      case 'ai':
        baseConfig = {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
          title: 'AI Processing Error',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20',
          suggestions: [
            'AI model may be unavailable',
            'Try with a smaller AI model',
            'Check if AI service is running'
          ]
        };
        break;
      default:
        baseConfig = {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'System Error',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          suggestions: [
            'Try refreshing the page',
            'Restart the application',
            'Contact support if the issue persists'
          ]
        };
    }
    
    // Enhance with classification-specific information
    return {
      ...baseConfig,
      title: error.message || baseConfig.title,
      suggestions: [
        ...classification?.suggestions || [],
        ...baseConfig.suggestions
      ],
      recoveryStrategies: error.recoveryStrategies || []
    };
  };

  const handleRecovery = async (strategy: RecoveryStrategy) => {
    if (!sessionId && !operationId) {
      console.warn('No sessionId or operationId provided for recovery');
      return;
    }

    setIsRecovering(true);
    setRecoveryProgress(0);
    setRecoveryMessage('Starting recovery...');

    try {
      if (sessionId) {
        // Session recovery
        setRecoveryMessage('Recovering session...');
        setRecoveryProgress(25);
        
        const result = await services.sessionRecoveryService.recoverSession(sessionId);
        
        if (result.success) {
          setRecoveryProgress(100);
          setRecoveryMessage('Session recovered successfully!');
          setTimeout(() => {
            setIsRecovering(false);
            onRetry?.();
          }, 2000);
        } else {
          throw new Error(result.error?.message || 'Session recovery failed');
        }
      } else if (operationId) {
        // Operation recovery
        setRecoveryMessage('Retrying operation...');
        setRecoveryProgress(50);
        
        // Simulate operation retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setRecoveryProgress(100);
        setRecoveryMessage('Operation completed successfully!');
        setTimeout(() => {
          setIsRecovering(false);
          onRetry?.();
        }, 2000);
      }
    } catch (error) {
      setRecoveryMessage(`Recovery failed: ${error instanceof Error ? error.message : String(error)}`);
      setTimeout(() => {
        setIsRecovering(false);
        setRecoveryProgress(0);
      }, 3000);
    }
  };

  const errorMessage = typeof error === 'string' ? error : error.message;
  const config = getErrorConfig();
  const recoveryStrategies = classification?.error?.recoveryStrategies || [];

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} animate-fade-in`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${config.color}`}>
          {config.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-semibold text-[var(--focule-text-primary)] flex items-center gap-2`}>
              {config.title}
            </h3>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-[var(--focule-text-muted)] hover:text-[var(--focule-text-secondary)] transition-colors"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <p className="text-sm text-[var(--focule-text-secondary)] mb-3">
            {errorMessage}
          </p>
          
          {config.suggestions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-[var(--focule-text-muted)] mb-2">
                Suggestions:
              </p>
              <ul className="space-y-1">
                {config.suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="text-xs text-[var(--focule-text-secondary)] flex items-start gap-2">
                    <span className="text-[var(--focule-primary)] mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Recovery Progress */}
          {isRecovering && (
            <div className="mb-4">
              <p className="text-xs font-medium text-[var(--focule-text-muted)] mb-2">
                Recovery Progress:
              </p>
              <div className="w-full bg-[var(--focule-bg-secondary)] rounded-full h-2 mb-2">
                <div 
                  className="bg-[var(--focule-primary)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${recoveryProgress}%` }}
                />
              </div>
              <p className="text-xs text-[var(--focule-text-secondary)]">{recoveryMessage}</p>
            </div>
          )}
          
          {/* Recovery Options */}
          {recoveryStrategies.length > 0 && !isRecovering && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-[var(--focule-text-muted)]">
                  Recovery Options:
                </p>
                <button
                  onClick={() => setShowRecoveryOptions(!showRecoveryOptions)}
                  className="text-xs text-[var(--focule-primary)] hover:text-[var(--focule-primary-dark)] transition-colors"
                >
                  {showRecoveryOptions ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showRecoveryOptions && (
                <div className="space-y-2">
                  {recoveryStrategies.map((strategy: RecoveryStrategy, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleRecovery(strategy)}
                      className="w-full text-left px-3 py-2 text-xs bg-[var(--focule-bg-secondary)] rounded hover:bg-[var(--focule-bg-tertiary)] transition-colors"
                      disabled={isRecovering}
                    >
                      <div className="font-medium text-[var(--focule-text-primary)]">
                        {strategy.type === 'retry' ? '🔄 Retry Operation' : 
                         strategy.type === 'fallback' ? '⚡ Use Fallback' : 
                         strategy.type === 'skip' ? '⏭️ Skip Step' : '🛑 Abort'}
                      </div>
                      {strategy.userMessage && (
                        <div className="text-[var(--focule-text-secondary)] mt-1">
                          {strategy.userMessage}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {showDetails && (
            <details className="mb-3">
              <summary className="cursor-pointer text-xs text-[var(--focule-text-muted)] hover:text-[var(--focule-text-secondary)]">
                Technical Details
              </summary>
              <div className="mt-2 p-2 bg-[var(--focule-bg-secondary)] rounded text-xs font-mono text-[var(--focule-text-muted)]">
                {errorMessage}
                {classification && (
                  <div className="mt-2 pt-2 border-t border-[var(--focule-border)]">
                    <div>Confidence: {(classification.confidence * 100).toFixed(1)}%</div>
                    <div>Category: {classification.error?.category}</div>
                    <div>Severity: {classification.error?.severity}</div>
                    <div>Recoverability: {classification.error?.recoverability}</div>
                  </div>
                )}
              </div>
            </details>
          )}
          
          <div className="flex gap-2">
            {onRetry && !isRecovering && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 text-sm focule-btn rounded font-medium"
              >
                Try Again
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 text-sm focule-btn-secondary rounded font-medium"
                disabled={isRecovering}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
