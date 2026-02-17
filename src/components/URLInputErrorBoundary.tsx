import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorDisplay } from './ErrorDisplay';
import { issueManager } from './GlobalIssueReporter';

interface URLInputErrorBoundaryProps {
  children: ReactNode;
  onValidationError?: (error: Error) => void;
}

interface URLInputErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class URLInputErrorBoundary extends Component<
  URLInputErrorBoundaryProps,
  URLInputErrorBoundaryState
> {
  constructor(props: URLInputErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): URLInputErrorBoundaryState {
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

    // Report validation errors specifically
    issueManager.sendReport({
      type: 'user_input' as 'user_input' | 'system_error' | 'performance_issue' | 'bug_report',
      severity: 'medium',
      title: 'URL Input Error',
      description: `Error in URL input: ${error.message}`,
      metadata: {
        componentStack: errorInfo.componentStack,
        errorStack: error.stack,
        errorBoundary: 'URLInputErrorBoundary'
      }
    });

    // Call custom validation error handler
    this.props.onValidationError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-red-800 mb-1">
                URL Input Error
              </h3>
              <p className="text-sm text-red-600 mb-3">
                {this.state.error?.message || 'Invalid URL provided'}
              </p>
              
              <ErrorDisplay
                error={this.state.error?.message || 'URL validation error'}
                type="validation"
                onRetry={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                showDetails={false}
              />
              
              <div className="mt-3 text-xs text-red-500">
                Please check the URL format and try again.
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
