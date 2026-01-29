interface ErrorDisplayProps {
  error: string;
  type?: 'network' | 'validation' | 'system' | 'permission' | 'download' | 'transcription';
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

export function ErrorDisplay({ 
  error, 
  type = 'system', 
  onRetry, 
  onDismiss,
  showDetails = false 
}: ErrorDisplayProps): JSX.Element {
  const getErrorConfig = () => {
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

  const config = getErrorConfig();

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
            {error}
          </p>
          
          {config.suggestions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-[var(--focule-text-muted)] mb-2">
                Suggestions:
              </p>
              <ul className="space-y-1">
                {config.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-xs text-[var(--focule-text-secondary)] flex items-start gap-2">
                    <span className="text-[var(--focule-primary)] mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {showDetails && (
            <details className="mb-3">
              <summary className="cursor-pointer text-xs text-[var(--focule-text-muted)] hover:text-[var(--focule-text-secondary)]">
                Technical Details
              </summary>
              <div className="mt-2 p-2 bg-[var(--focule-bg-secondary)] rounded text-xs font-mono text-[var(--focule-text-muted)]">
                {error}
              </div>
            </details>
          )}
          
          <div className="flex gap-2">
            {onRetry && (
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
