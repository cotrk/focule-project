import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorDisplay } from './ErrorDisplay';
import { issueManager } from './GlobalIssueReporter';
import { TranscriptionError, ErrorLogger } from '../utils/errorHandling';
import type { ErrorSeverity, ErrorCategory } from '../utils/errorHandling';

// ============================================================================
// Unified Error Boundary Props and State
// ============================================================================

export interface UnifiedErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string;
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  enableReporting?: boolean;
  showRetry?: boolean;
  showDetails?: boolean;
  customMessage?: string;
}

interface UnifiedErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

// ============================================================================
// Unified Error Boundary Component
// ============================================================================

export class UnifiedErrorBoundary extends Component<
  UnifiedErrorBoundaryProps,
  UnifiedErrorBoundaryState
> {
  constructor(props: UnifiedErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): UnifiedErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // Log the error
    ErrorLogger.log(error, this.props.context || 'Unknown');

    // Create enhanced error for reporting
    const enhancedError = new TranscriptionError(
      'REACT_COMPONENT_ERROR',
      error.message,
      this.props.severity || 'medium',
      'user_action',
      this.props.category || 'system',
      {
        operation: this.props.context || 'component_render',
        componentStack: errorInfo.componentStack,
        errorBoundary: 'UnifiedErrorBoundary',
        metadata: {
          context: this.props.context,
          severity: this.props.severity,
          category: this.props.category
        }
      },
      [],
      errorInfo
    );

    // Report the error if enabled
    if (this.props.enableReporting !== false) {
      issueManager.sendReport({
        type: 'ui_crash',
        severity: this.props.severity || 'medium',
        title: `${this.props.context || 'Component'} Error`,
        description: enhancedError.message,
        metadata: {
          componentStack: errorInfo.componentStack,
          errorStack: error.stack,
          errorBoundary: 'UnifiedErrorBoundary',
          context: this.props.context,
          errorId: this.state.errorId
        }
      });
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined 
    });
  };

  handleRetry = (): void => {
    this.handleReset();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use ErrorDisplay component for consistent UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--focule-bg-primary)]">
          <div className="max-w-lg w-full p-6 bg-[var(--focule-bg-secondary)] rounded-lg border border-[var(--focule-border)]">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-xl font-semibold text-[var(--focule-text-primary)] mb-2">
                {this.props.customMessage || 'Component Error'}
              </h2>
              <p className="text-[var(--focule-text-secondary)] mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              <ErrorDisplay
                error={this.state.error?.message || 'Unknown error'}
                type={this.props.context || 'general'}
                onRetry={this.props.showRetry !== false ? this.handleRetry : undefined}
                showDetails={this.props.showDetails !== false}
              />
              
              <div className="mt-4 pt-4 border-t border-[var(--focule-border)]">
                <p className="text-xs text-[var(--focule-text-muted)]">
                  Error ID: {this.state.errorId || 'unknown'}
                  {this.props.context && ` | Context: ${this.props.context}`}
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

// ============================================================================
// Specialized Error Boundary Components
// ============================================================================

export function TranscriptionErrorBoundary(props: Omit<UnifiedErrorBoundaryProps, 'context' | 'category'>) {
  return (
    <UnifiedErrorBoundary
      context="transcription"
      category="processing"
      severity="high"
      enableReporting={true}
      showRetry={true}
      showDetails={true}
      {...props}
    />
  );
}

export function UIErrorBoundary(props: Omit<UnifiedErrorBoundaryProps, 'context' | 'category'>) {
  return (
    <UnifiedErrorBoundary
      context="ui"
      category="system"
      severity="medium"
      enableReporting={true}
      showRetry={true}
      showDetails={false}
      {...props}
    />
  );
}

export function SettingsErrorBoundary(props: Omit<UnifiedErrorBoundaryProps, 'context' | 'category'>) {
  return (
    <UnifiedErrorBoundary
      context="settings"
      category="user_input"
      severity="low"
      enableReporting={false}
      showRetry={true}
      showDetails={false}
      customMessage="Settings Error"
      {...props}
    />
  );
}

export function NetworkErrorBoundary(props: Omit<UnifiedErrorBoundaryProps, 'context' | 'category'>) {
  return (
    <UnifiedErrorBoundary
      context="network"
      category="network"
      severity="high"
      enableReporting={true}
      showRetry={true}
      showDetails={true}
      customMessage="Network Error"
      {...props}
    />
  );
}

// ============================================================================
// Error Boundary Hook for Functional Components
// ============================================================================

export function useErrorBoundary() {
  const handleError = React.useCallback((error: Error, context?: string) => {
    ErrorLogger.log(error, context || 'Unknown');
    
    // You could also trigger a toast notification here
    // ToastManager.error('Error', error.message);
    
    // Or send to error reporting service
    if (context) {
      issueManager.sendReport({
        type: 'manual_error',
        severity: 'medium',
        title: `Manual Error Report: ${context}`,
        description: error.message,
        metadata: {
          stack: error.stack,
          context,
          timestamp: new Date().toISOString()
        }
      });
    }
  }, []);

  return { handleError };
}

// ============================================================================
// Higher-Order Component for Error Boundaries
// ============================================================================

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<UnifiedErrorBoundaryProps>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <UnifiedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </UnifiedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
