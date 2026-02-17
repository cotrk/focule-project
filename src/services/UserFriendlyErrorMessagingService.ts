import {
  TranscriptionError,
  ErrorSeverity,
  ErrorRecoverability,
  ErrorCategory
} from '../utils/errorHandling';
import { EnhancedErrorRecoveryService } from './EnhancedErrorRecoveryService';

// ============================================================================
// User-Friendly Error Messaging Service
// ============================================================================

export interface ErrorMessage {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  actions?: ErrorAction[];
  details?: string;
  timestamp: number;
  dismissible: boolean;
  autoDismiss?: number;
}

export interface ErrorAction {
  id: string;
  label: string;
  action: 'retry' | 'fallback' | 'skip' | 'report' | 'help' | 'dismiss';
  style: 'primary' | 'secondary' | 'danger';
  callback?: () => Promise<void>;
  requiresUserInput?: boolean;
}

export interface ErrorNotificationConfig {
  showTechnicalDetails: boolean;
  enableAutoDismiss: boolean;
  enableSoundAlerts: boolean;
  enableDesktopNotifications: boolean;
  maxVisibleErrors: number;
  errorHistorySize: number;
}

export class UserFriendlyErrorMessagingService {
  private static instance: UserFriendlyErrorMessagingService;
  private recoveryService: EnhancedErrorRecoveryService;
  private errorMessages: Map<string, ErrorMessage> = new Map();
  private notificationCallbacks: ((message: ErrorMessage) => void)[] = [];
  private config: ErrorNotificationConfig;
  private errorHistory: ErrorMessage[] = [];

  private constructor() {
    this.recoveryService = EnhancedErrorRecoveryService.getInstance();
    this.config = this.getDefaultConfig();
    this.setupRecoveryNotifications();
  }

  public static getInstance(): UserFriendlyErrorMessagingService {
    if (!UserFriendlyErrorMessagingService.instance) {
      UserFriendlyErrorMessagingService.instance = new UserFriendlyErrorMessagingService();
    }
    return UserFriendlyErrorMessagingService.instance;
  }

  private getDefaultConfig(): ErrorNotificationConfig {
    return {
      showTechnicalDetails: false,
      enableAutoDismiss: true,
      enableSoundAlerts: false,
      enableDesktopNotifications: true,
      maxVisibleErrors: 5,
      errorHistorySize: 100
    };
  }

  private setupRecoveryNotifications(): void {
    this.recoveryService.subscribeToNotifications((message: string) => {
      this.showInfoMessage('Recovery Progress', message);
    });
  }

  // ============================================================================
  // Main Error Handling Interface
  // ============================================================================

  public async handleError(error: Error | TranscriptionError, context?: {
    operation?: string;
    userAction?: string;
    additionalInfo?: string;
  }): Promise<ErrorMessage> {
    const errorMessage = this.createUserFriendlyMessage(error, context);
    
    // Store error
    this.errorMessages.set(errorMessage.id, errorMessage);
    this.addToHistory(errorMessage);
    
    // Notify listeners
    this.notifyListeners(errorMessage);
    
    // Show desktop notification if enabled
    if (this.config.enableDesktopNotifications) {
      this.showDesktopNotification(errorMessage);
    }
    
    // Play sound if enabled and error is severe
    if (this.config.enableSoundAlerts && errorMessage.severity === 'critical') {
      this.playErrorSound();
    }
    
    return errorMessage;
  }

  private createUserFriendlyMessage(
    error: Error | TranscriptionError,
    context?: {
      operation?: string;
      userAction?: string;
      additionalInfo?: string;
    }
  ): ErrorMessage {
    const isTranscriptionError = error instanceof TranscriptionError;
    const errorId = this.generateErrorId();
    
    const baseMessage = this.getBaseErrorMessage(error, isTranscriptionError);
    const userFriendlyMessage = this.generateUserFriendlyMessage(error, isTranscriptionError, context);
    const actions = this.generateErrorActions(error, isTranscriptionError, context);
    
    return {
      id: errorId,
      title: baseMessage.title,
      message: userFriendlyMessage.message,
      severity: this.mapSeverity(isTranscriptionError ? error.severity : ErrorSeverity.MEDIUM),
      category: isTranscriptionError ? error.category : ErrorCategory.SYSTEM,
      actions,
      details: this.config.showTechnicalDetails ? error.stack : undefined,
      timestamp: Date.now(),
      dismissible: true,
      autoDismiss: this.shouldAutoDismiss(error, isTranscriptionError)
    };
  }

  private getBaseErrorMessage(error: Error | TranscriptionError, isTranscriptionError: boolean): {
    title: string;
    category: string;
  } {
    if (!isTranscriptionError) {
      return {
        title: 'Unexpected Error',
        category: 'system'
      };
    }

    const transcriptionError = error as TranscriptionError;
    
    switch (transcriptionError.category) {
      case ErrorCategory.NETWORK:
        return {
          title: 'Connection Problem',
          category: 'network'
        };
      case ErrorCategory.PROCESSING:
        return {
          title: 'Processing Issue',
          category: 'processing'
        };
      case ErrorCategory.AI:
        return {
          title: 'AI Service Issue',
          category: 'ai'
        };
      case ErrorCategory.RESOURCE:
        return {
          title: 'Resource Limitation',
          category: 'resource'
        };
      case ErrorCategory.PERMISSION:
        return {
          title: 'Access Denied',
          category: 'permission'
        };
      case ErrorCategory.USER_INPUT:
        return {
          title: 'Invalid Input',
          category: 'input'
        };
      default:
        return {
          title: 'System Error',
          category: 'system'
        };
    }
  }

  private generateUserFriendlyMessage(
    error: Error | TranscriptionError,
    isTranscriptionError: boolean,
    context?: {
      operation?: string;
      userAction?: string;
      additionalInfo?: string;
    }
  ): { message: string; suggestions: string[] } {
    const baseMessage = isTranscriptionError 
      ? (error as TranscriptionError).message 
      : error.message;
    
    let userMessage = '';
    const suggestions: string[] = [];

    if (isTranscriptionError) {
      const transcriptionError = error as TranscriptionError;
      
      switch (transcriptionError.category) {
        case ErrorCategory.NETWORK:
          userMessage = 'Unable to connect to the internet. Please check your network connection and try again.';
          suggestions.push('Check your internet connection');
          suggestions.push('Try using a different network');
          suggestions.push('Disable VPN or proxy if enabled');
          break;
          
        case ErrorCategory.PROCESSING:
          userMessage = 'Video processing encountered an issue. We\'re trying alternative methods to complete your request.';
          suggestions.push('Try with a different video format');
          suggestions.push('Ensure the video file is not corrupted');
          suggestions.push('Try processing a shorter segment');
          break;
          
        case ErrorCategory.AI:
          userMessage = 'AI service is temporarily unavailable. We\'re switching to alternative models to continue processing.';
          suggestions.push('Try with a smaller AI model');
          suggestions.push('Check if the audio quality is clear');
          suggestions.push('Ensure sufficient system resources');
          break;
          
        case ErrorCategory.RESOURCE:
          userMessage = 'System resources are running low. Please close other applications to free up memory and processing power.';
          suggestions.push('Close other applications');
          suggestions.push('Try with a smaller file');
          suggestions.push('Restart the application');
          break;
          
        case ErrorCategory.PERMISSION:
          userMessage = 'Permission denied. Please check file or directory permissions and try again.';
          suggestions.push('Check file permissions');
          suggestions.push('Run as administrator if needed');
          suggestions.push('Choose a different output location');
          break;
          
        case ErrorCategory.USER_INPUT:
          userMessage = 'The input provided is invalid. Please check your input and try again.';
          suggestions.push('Verify the input format');
          suggestions.push('Check for missing required fields');
          suggestions.push('Review the input guidelines');
          break;
          
        default:
          userMessage = 'An unexpected error occurred. The system is attempting to recover automatically.';
          suggestions.push('Try the operation again');
          suggestions.push('Restart the application');
          suggestions.push('Contact support if the issue persists');
      }
    } else {
      userMessage = 'An unexpected error occurred. Please try again or contact support if the problem continues.';
      suggestions.push('Try the operation again');
      suggestions.push('Restart the application');
      suggestions.push('Check the application logs for details');
    }

    // Add context-specific information
    if (context?.operation) {
      userMessage = `Error during ${context.operation}: ${userMessage}`;
    }
    
    if (context?.additionalInfo) {
      userMessage += ` ${context.additionalInfo}`;
    }

    return { message: userMessage, suggestions };
  }

  private generateErrorActions(
    error: Error | TranscriptionError,
    isTranscriptionError: boolean,
    context?: {
      operation?: string;
      userAction?: string;
      additionalInfo?: string;
    }
  ): ErrorAction[] {
    const actions: ErrorAction[] = [];

    // Always add dismiss action
    actions.push({
      id: 'dismiss',
      label: 'Dismiss',
      action: 'dismiss',
      style: 'secondary'
    });

    // Add help action
    actions.push({
      id: 'help',
      label: 'Get Help',
      action: 'help',
      style: 'secondary'
    });

    // Add report action
    actions.push({
      id: 'report',
      label: 'Report Issue',
      action: 'report',
      style: 'secondary'
    });

    if (isTranscriptionError) {
      const transcriptionError = error as TranscriptionError;
      
      // Add retry action for recoverable errors
      if (transcriptionError.recoverability !== ErrorRecoverability.MANUAL) {
        actions.push({
          id: 'retry',
          label: 'Retry',
          action: 'retry',
          style: 'primary',
          callback: async () => {
            await this.retryOperation(transcriptionError, context);
          }
        });
      }

      // Add fallback actions if available
      const hasFallbacks = transcriptionError.recoveryStrategies.some(s => s.type === 'fallback');
      if (hasFallbacks) {
        actions.push({
          id: 'fallback',
          label: 'Try Alternative',
          action: 'fallback',
          style: 'primary',
          callback: async () => {
            await this.executeFallback(transcriptionError, context);
          }
        });
      }

      // Add skip action for non-critical errors
      if (transcriptionError.severity !== ErrorSeverity.CRITICAL) {
        actions.push({
          id: 'skip',
          label: 'Skip',
          action: 'skip',
          style: 'secondary',
          callback: async () => {
            await this.skipOperation(transcriptionError, context);
          }
        });
      }
    }

    return actions;
  }

  private mapSeverity(severity: ErrorSeverity): 'info' | 'warning' | 'error' | 'critical' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'info';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.CRITICAL:
        return 'critical';
      default:
        return 'warning';
    }
  }

  private shouldAutoDismiss(error: Error | TranscriptionError, isTranscriptionError: boolean): number | undefined {
    if (!this.config.enableAutoDismiss) {
      return undefined;
    }

    if (!isTranscriptionError) {
      return 10000; // 10 seconds for unknown errors
    }

    const transcriptionError = error as TranscriptionError;
    
    switch (transcriptionError.severity) {
      case ErrorSeverity.LOW:
        return 5000; // 5 seconds
      case ErrorSeverity.MEDIUM:
        return 10000; // 10 seconds
      case ErrorSeverity.HIGH:
        return undefined; // No auto-dismiss
      case ErrorSeverity.CRITICAL:
        return undefined; // No auto-dismiss
      default:
        return 8000; // 8 seconds
    }
  }

  // ============================================================================
  // Action Handlers
  // ============================================================================

  private async retryOperation(error: TranscriptionError, context?: any): Promise<void> {
    try {
      await this.recoveryService.handleError(error, context);
    } catch (retryError) {
      this.showError('Retry Failed', 'The retry operation failed. Please try a different approach.');
    }
  }

  private async executeFallback(error: TranscriptionError, context?: any): Promise<void> {
    try {
      await this.recoveryService.handleError(error, context);
    } catch (fallbackError) {
      this.showError('Fallback Failed', 'The fallback operation failed. Please try manual intervention.');
    }
  }

  private async skipOperation(error: TranscriptionError, context?: any): Promise<void> {
    this.showInfoMessage('Operation Skipped', 'The current operation has been skipped. You can try again later.');
  }

  // ============================================================================
  // Notification Methods
  // ============================================================================

  public showError(title: string, message: string, actions?: ErrorAction[]): string {
    const errorMessage: ErrorMessage = {
      id: this.generateErrorId(),
      title,
      message,
      severity: 'error',
      category: 'user',
      actions: actions || [
        {
          id: 'dismiss',
          label: 'Dismiss',
          action: 'dismiss',
          style: 'secondary'
        }
      ],
      timestamp: Date.now(),
      dismissible: true,
      autoDismiss: 8000
    };

    return this.addErrorMessage(errorMessage);
  }

  public showWarning(title: string, message: string, actions?: ErrorAction[]): string {
    const errorMessage: ErrorMessage = {
      id: this.generateErrorId(),
      title,
      message,
      severity: 'warning',
      category: 'user',
      actions: actions || [
        {
          id: 'dismiss',
          label: 'Dismiss',
          action: 'dismiss',
          style: 'secondary'
        }
      ],
      timestamp: Date.now(),
      dismissible: true,
      autoDismiss: 6000
    };

    return this.addErrorMessage(errorMessage);
  }

  public showInfoMessage(title: string, message: string, actions?: ErrorAction[]): string {
    const errorMessage: ErrorMessage = {
      id: this.generateErrorId(),
      title,
      message,
      severity: 'info',
      category: 'user',
      actions: actions || [
        {
          id: 'dismiss',
          label: 'Dismiss',
          action: 'dismiss',
          style: 'secondary'
        }
      ],
      timestamp: Date.now(),
      dismissible: true,
      autoDismiss: 4000
    };

    return this.addErrorMessage(errorMessage);
  }

  public showSuccess(title: string, message: string, actions?: ErrorAction[]): string {
    const errorMessage: ErrorMessage = {
      id: this.generateErrorId(),
      title,
      message,
      severity: 'info',
      category: 'success',
      actions: actions || [
        {
          id: 'dismiss',
          label: 'Dismiss',
          action: 'dismiss',
          style: 'secondary'
        }
      ],
      timestamp: Date.now(),
      dismissible: true,
      autoDismiss: 3000
    };

    return this.addErrorMessage(errorMessage);
  }

  private addErrorMessage(errorMessage: ErrorMessage): string {
    this.errorMessages.set(errorMessage.id, errorMessage);
    this.addToHistory(errorMessage);
    this.notifyListeners(errorMessage);
    
    if (this.config.enableDesktopNotifications) {
      this.showDesktopNotification(errorMessage);
    }
    
    return errorMessage.id;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private generateErrorId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToHistory(errorMessage: ErrorMessage): void {
    this.errorHistory.push(errorMessage);
    
    // Limit history size
    if (this.errorHistory.length > this.config.errorHistorySize) {
      this.errorHistory.splice(0, this.errorHistory.length - this.config.errorHistorySize);
    }
  }

  private notifyListeners(errorMessage: ErrorMessage): void {
    this.notificationCallbacks.forEach(callback => callback(errorMessage));
  }

  private showDesktopNotification(errorMessage: ErrorMessage): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(errorMessage.title, {
        body: errorMessage.message,
        icon: '/favicon.ico',
        tag: errorMessage.id
      });
    }
  }

  private playErrorSound(): void {
    // Play a sound effect for critical errors
    try {
      const audio = new Audio('/sounds/error.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors playing sound
      });
    } catch {
      // Ignore audio errors
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  public subscribe(callback: (message: ErrorMessage) => void): () => void {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  public dismissMessage(messageId: string): void {
    const message = this.errorMessages.get(messageId);
    if (message) {
      this.errorMessages.delete(messageId);
      this.notifyListeners({ ...message, actions: [] }); // Notify of dismissal
    }
  }

  public dismissAllMessages(): void {
    this.errorMessages.clear();
    this.notifyListeners({
      id: 'clear_all',
      title: '',
      message: '',
      severity: 'info',
      category: 'system',
      actions: [],
      timestamp: Date.now(),
      dismissible: true
    });
  }

  public getActiveMessages(): ErrorMessage[] {
    return Array.from(this.errorMessages.values());
  }

  public getErrorHistory(): ErrorMessage[] {
    return [...this.errorHistory];
  }

  public updateConfig(newConfig: Partial<ErrorNotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): ErrorNotificationConfig {
    return { ...this.config };
  }

  public requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      return Notification.requestPermission().then(permission => 
        permission === 'granted'
      );
    }
    return Promise.resolve(false);
  }

  public getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Map<string, number>;
    errorsBySeverity: Map<string, number>;
    recentErrors: number;
  } {
    const errorsByCategory = new Map<string, number>();
    const errorsBySeverity = new Map<string, number>();
    const recentTime = Date.now() - 3600000; // Last hour
    let recentErrors = 0;

    this.errorHistory.forEach(error => {
      // Count by category
      const categoryCount = errorsByCategory.get(error.category) || 0;
      errorsByCategory.set(error.category, categoryCount + 1);

      // Count by severity
      const severityCount = errorsBySeverity.get(error.severity) || 0;
      errorsBySeverity.set(error.severity, severityCount + 1);

      // Count recent errors
      if (error.timestamp > recentTime) {
        recentErrors++;
      }
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors
    };
  }
}
