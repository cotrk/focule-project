import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorDisplay } from './ErrorDisplay';
import { issueManager } from './GlobalIssueReporter';

interface TranscriptionErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface TranscriptionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class TranscriptionErrorBoundary extends Component<
  TranscriptionErrorBoundaryProps,
  TranscriptionErrorBoundaryState
> {
  constructor(props: TranscriptionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TranscriptionErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Report the error automatically
    issueManager.sendReport({
      type: 'ui_crash',
      severity: 'high',
      title: 'Transcription Component Error',
      description: `Error in transcription workflow: ${error.message}`,
      metadata: {
        componentStack: errorInfo.componentStack,
        errorStack: error.stack,
        errorBoundary: 'TranscriptionErrorBoundary'
      }
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--focule-bg-primary)]">
          <div className="max-w-lg w-full p-6 bg-[var(--focule-bg-secondary)] rounded-lg border border-[var(--focule-border)]">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-xl font-semibold text-[var(--focule-text-primary)] mb-2">
                Transcription Error
              </h2>
              <p className="text-[var(--focule-text-secondary)] mb-4">
                {this.state.error?.message || 'An error occurred during transcription'}
              </p>
              
              <ErrorDisplay
                error={this.state.error?.message || 'Unknown transcription error'}
                type="transcription"
                onRetry={() => window.location.reload()}
                showDetails={true}
              />
              
              <div className="mt-4 pt-4 border-t border-[var(--focule-border)]">
                <p className="text-xs text-[var(--focule-text-muted)]">
                  Error ID: {this.state.errorInfo?.componentStack?.split('\n')[1]?.trim() || 'unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
