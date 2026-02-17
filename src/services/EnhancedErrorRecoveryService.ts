import {
  TranscriptionError,
  ErrorSeverity,
  ErrorRecoverability,
  ErrorCategory,
  RecoveryStrategy
} from '../utils/errorHandling';
import { RecoveryService } from './RecoveryService';
import { ErrorClassificationService } from './ErrorClassificationService';

// ============================================================================
// Enhanced Error Recovery Service
// ============================================================================

export interface RecoveryAction {
  id: string;
  type: 'retry' | 'fallback' | 'skip' | 'abort' | 'user_action';
  description: string;
  execute: () => Promise<boolean>;
  estimatedTime?: number;
  userInteraction?: boolean;
}

export interface RecoveryPlan {
  errorId: string;
  error: TranscriptionError;
  actions: RecoveryAction[];
  currentActionIndex: number;
  startTime: number;
  estimatedCompletion?: number;
  userNotifications: string[];
}

export interface RecoveryMetrics {
  totalRecoveries: number;
  successfulRecoveries: number;
  averageRecoveryTime: number;
  recoveryRate: number;
  errorDistribution: Map<ErrorCategory, number>;
  strategyEffectiveness: Map<string, number>;
}

export class EnhancedErrorRecoveryService {
  private static instance: EnhancedErrorRecoveryService;
  private recoveryService: RecoveryService;
  private classificationService: ErrorClassificationService;
  private activeRecoveries: Map<string, RecoveryPlan> = new Map();
  private recoveryHistory: RecoveryPlan[] = [];
  private metrics: RecoveryMetrics;
  private userNotificationCallbacks: ((message: string) => void)[] = [];

  private constructor() {
    this.recoveryService = RecoveryService.getInstance();
    this.classificationService = ErrorClassificationService.getInstance();
    this.metrics = this.initializeMetrics();
  }

  public static getInstance(): EnhancedErrorRecoveryService {
    if (!EnhancedErrorRecoveryService.instance) {
      EnhancedErrorRecoveryService.instance = new EnhancedErrorRecoveryService();
    }
    return EnhancedErrorRecoveryService.instance;
  }

  private initializeMetrics(): RecoveryMetrics {
    return {
      totalRecoveries: 0,
      successfulRecoveries: 0,
      averageRecoveryTime: 0,
      recoveryRate: 0,
      errorDistribution: new Map(),
      strategyEffectiveness: new Map()
    };
  }

  // ============================================================================
  // Main Recovery Orchestration
  // ============================================================================

  public async handleError(
    error: Error | TranscriptionError,
    context?: { operation?: string; sessionId?: string }
  ): Promise<RecoveryPlan> {
    const startTime = Date.now();
    
    // Classify the error if not already a TranscriptionError
    const classifiedError = error instanceof TranscriptionError 
      ? error 
      : this.classificationService.classifyError(error, context).error;

    const errorId = this.generateErrorId(classifiedError);
    
    // Update metrics
    this.updateErrorDistribution(classifiedError.category);
    this.metrics.totalRecoveries++;

    // Create recovery plan
    const recoveryPlan = await this.createRecoveryPlan(errorId, classifiedError, context);
    
    // Store active recovery
    this.activeRecoveries.set(errorId, recoveryPlan);
    
    // Notify user
    this.notifyUser(`Attempting to recover from: ${classifiedError.message}`);

    // Execute recovery plan
    const success = await this.executeRecoveryPlan(recoveryPlan);
    
    // Update metrics
    const recoveryTime = Date.now() - startTime;
    this.updateMetrics(success, recoveryTime, recoveryPlan);
    
    // Clean up
    this.activeRecoveries.delete(errorId);
    this.recoveryHistory.push(recoveryPlan);

    return recoveryPlan;
  }

  private async createRecoveryPlan(
    errorId: string,
    error: TranscriptionError,
    context?: { operation?: string; sessionId?: string }
  ): Promise<RecoveryPlan> {
    const actions = await this.generateRecoveryActions(error, context);
    const estimatedTime = this.calculateEstimatedCompletion(actions);

    return {
      errorId,
      error,
      actions,
      currentActionIndex: 0,
      startTime: Date.now(),
      estimatedCompletion: Date.now() + estimatedTime,
      userNotifications: []
    };
  }

  private async generateRecoveryActions(
    error: TranscriptionError,
    context?: { operation?: string; sessionId?: string }
  ): Promise<RecoveryAction[]> {
    const actions: RecoveryAction[] = [];

    // Generate actions based on error recovery strategies
    for (const strategy of error.recoveryStrategies) {
      const action = await this.createActionFromStrategy(strategy, error, context);
      if (action) {
        actions.push(action);
      }
    }

    // Add category-specific actions
    const categoryActions = await this.getCategorySpecificActions(error, context);
    actions.push(...categoryActions);

    // Add user action as last resort
    if (error.recoverability === ErrorRecoverability.USER_ACTION) {
      actions.push(this.createUserActionAction(error));
    }

    return actions;
  }

  private async createActionFromStrategy(
    strategy: RecoveryStrategy,
    error: TranscriptionError,
    context?: { operation?: string; sessionId?: string }
  ): Promise<RecoveryAction | null> {
    const baseAction = {
      id: this.generateActionId(),
      description: strategy.userMessage || 'Recovery action',
      estimatedTime: strategy.delay || 1000,
      userInteraction: strategy.requiresUserAction || false
    };

    switch (strategy.type) {
      case 'retry':
        return {
          ...baseAction,
          type: 'retry',
          execute: () => this.executeRetry(error, strategy, context)
        };

      case 'fallback':
        return {
          ...baseAction,
          type: 'fallback',
          execute: () => this.executeFallback(error, strategy, context)
        };

      case 'skip':
        return {
          ...baseAction,
          type: 'skip',
          execute: () => this.executeSkip(error, context)
        };

      case 'abort':
        return {
          ...baseAction,
          type: 'abort',
          execute: () => this.executeAbort(error, context)
        };

      default:
        return null;
    }
  }

  private async getCategorySpecificActions(
    error: TranscriptionError,
    context?: { operation?: string; sessionId?: string }
  ): Promise<RecoveryAction[]> {
    const actions: RecoveryAction[] = [];

    switch (error.category) {
      case ErrorCategory.NETWORK:
        actions.push(
          {
            id: this.generateActionId(),
            type: 'retry',
            description: 'Check network connectivity',
            execute: () => this.checkNetworkConnectivity(),
            estimatedTime: 2000
          },
          {
            id: this.generateActionId(),
            type: 'fallback',
            description: 'Switch to offline mode',
            execute: () => this.switchToOfflineMode(),
            estimatedTime: 1000
          }
        );
        break;

      case ErrorCategory.PROCESSING:
        actions.push(
          {
            id: this.generateActionId(),
            type: 'fallback',
            description: 'Reduce processing quality',
            execute: () => this.reduceProcessingQuality(),
            estimatedTime: 500
          },
          {
            id: this.generateActionId(),
            type: 'retry',
            description: 'Restart processing pipeline',
            execute: () => this.restartProcessingPipeline(),
            estimatedTime: 3000
          }
        );
        break;

      case ErrorCategory.AI:
        actions.push(
          {
            id: this.generateActionId(),
            type: 'fallback',
            description: 'Switch to smaller AI model',
            execute: () => this.switchToSmallerModel(),
            estimatedTime: 2000
          },
          {
            id: this.generateActionId(),
            type: 'retry',
            description: 'Clear AI model cache',
            execute: () => this.clearAIModelCache(),
            estimatedTime: 1000
          }
        );
        break;

      case ErrorCategory.RESOURCE:
        actions.push(
          {
            id: this.generateActionId(),
            type: 'fallback',
            description: 'Free system resources',
            execute: () => this.freeSystemResources(),
            estimatedTime: 5000
          },
          {
            id: this.generateActionId(),
            type: 'user_action',
            description: 'Request user to close applications',
            execute: () => this.requestUserCloseApps(),
            estimatedTime: 10000,
            userInteraction: true
          }
        );
        break;
    }

    return actions;
  }

  private createUserActionAction(error: TranscriptionError): RecoveryAction {
    return {
      id: this.generateActionId(),
      type: 'user_action',
      description: 'Manual intervention required',
      execute: () => this.requestManualIntervention(error),
      estimatedTime: 30000,
      userInteraction: true
    };
  }

  // ============================================================================
  // Recovery Action Implementations
  // ============================================================================

  private async executeRetry(
    error: TranscriptionError,
    strategy: RecoveryStrategy,
    context?: { operation?: string; sessionId?: string }
  ): Promise<boolean> {
    try {
      const maxAttempts = strategy.maxAttempts || 3;
      const delay = strategy.delay || 1000;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        this.notifyUser(`Retry attempt ${attempt}/${maxAttempts}...`);
        
        // Simulate retry logic - in real implementation, this would retry the actual operation
        await this.delay(delay);
        
        // For demonstration, we'll simulate success on final attempt
        if (attempt === maxAttempts) {
          return true;
        }
      }
      
      return false;
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      return false;
    }
  }

  private async executeFallback(
    error: TranscriptionError,
    strategy: RecoveryStrategy,
    context?: { operation?: string; sessionId?: string }
  ): Promise<boolean> {
    try {
      const fallbackOptions = strategy.fallbackOptions || [];
      
      for (const option of fallbackOptions) {
        this.notifyUser(`Trying fallback: ${option}...`);
        
        // Simulate fallback execution
        const success = await this.executeFallbackOption(option);
        if (success) {
          return true;
        }
      }
      
      return false;
    } catch (fallbackError) {
      console.error('Fallback failed:', fallbackError);
      return false;
    }
  }

  private async executeSkip(
    error: TranscriptionError,
    context?: { operation?: string; sessionId?: string }
  ): Promise<boolean> {
    this.notifyUser('Skipping operation due to unrecoverable error');
    // In real implementation, this would skip the current operation
    return true;
  }

  private async executeAbort(
    error: TranscriptionError,
    context?: { operation?: string; sessionId?: string }
  ): Promise<boolean> {
    this.notifyUser('Aborting operation due to critical error');
    // In real implementation, this would abort the entire process
    return false;
  }

  // ============================================================================
  // Category-Specific Recovery Actions
  // ============================================================================

  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // Simulate network check
      await this.delay(2000);
      // In real implementation, this would check actual connectivity
      return Math.random() > 0.3; // 70% success rate for demo
    } catch {
      return false;
    }
  }

  private async switchToOfflineMode(): Promise<boolean> {
    this.notifyUser('Switching to offline mode...');
    await this.delay(1000);
    return true;
  }

  private async reduceProcessingQuality(): Promise<boolean> {
    this.notifyUser('Reducing processing quality for stability...');
    await this.delay(500);
    return true;
  }

  private async restartProcessingPipeline(): Promise<boolean> {
    this.notifyUser('Restarting processing pipeline...');
    await this.delay(3000);
    return true;
  }

  private async switchToSmallerModel(): Promise<boolean> {
    this.notifyUser('Switching to smaller AI model...');
    await this.delay(2000);
    return true;
  }

  private async clearAIModelCache(): Promise<boolean> {
    this.notifyUser('Clearing AI model cache...');
    await this.delay(1000);
    return true;
  }

  private async freeSystemResources(): Promise<boolean> {
    this.notifyUser('Freeing system resources...');
    await this.delay(5000);
    return true;
  }

  private async requestUserCloseApps(): Promise<boolean> {
    this.notifyUser('Please close other applications to free up resources');
    await this.delay(10000);
    return true;
  }

  private async requestManualIntervention(error: TranscriptionError): Promise<boolean> {
    this.notifyUser(`Manual intervention required: ${error.message}`);
    await this.delay(30000);
    return false; // Requires manual action
  }

  private async executeFallbackOption(option: string): Promise<boolean> {
    // Simulate different fallback options
    await this.delay(1000);
    
    switch (option) {
      case 'smaller_model':
      case 'alternative_model':
      case 'offline_mode':
      case 'cached_content':
        return Math.random() > 0.2; // 80% success rate
      case 'lower_quality':
      case 'audio_only':
      case 'reduced_quality':
        return Math.random() > 0.1; // 90% success rate
      default:
        return Math.random() > 0.5; // 50% success rate
    }
  }

  // ============================================================================
  // Recovery Plan Execution
  // ============================================================================

  private async executeRecoveryPlan(plan: RecoveryPlan): Promise<boolean> {
    for (let i = 0; i < plan.actions.length; i++) {
      const action = plan.actions[i];
      plan.currentActionIndex = i;
      
      this.notifyUser(`Executing: ${action.description}`);
      
      try {
        const success = await action.execute();
        
        if (success) {
          plan.userNotifications.push(`✓ ${action.description} - Success`);
          return true;
        } else {
          plan.userNotifications.push(`✗ ${action.description} - Failed`);
          
          // If user action failed, don't continue
          if (action.type === 'user_action' || action.type === 'abort') {
            return false;
          }
        }
      } catch (actionError) {
        plan.userNotifications.push(`✗ ${action.description} - Error: ${actionError}`);
        console.error(`Recovery action failed:`, actionError);
      }
    }
    
    return false;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private generateErrorId(error: TranscriptionError): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private calculateEstimatedCompletion(actions: RecoveryAction[]): number {
    return actions.reduce((total, action) => total + (action.estimatedTime || 1000), 0);
  }

  private updateErrorDistribution(category: ErrorCategory): void {
    const current = this.metrics.errorDistribution.get(category) || 0;
    this.metrics.errorDistribution.set(category, current + 1);
  }

  private updateMetrics(success: boolean, recoveryTime: number, plan: RecoveryPlan): void {
    if (success) {
      this.metrics.successfulRecoveries++;
    }
    
    // Update average recovery time
    const totalRecoveries = this.metrics.totalRecoveries;
    const currentAverage = this.metrics.averageRecoveryTime;
    this.metrics.averageRecoveryTime = 
      (currentAverage * (totalRecoveries - 1) + recoveryTime) / totalRecoveries;
    
    // Update recovery rate
    this.metrics.recoveryRate = (this.metrics.successfulRecoveries / totalRecoveries) * 100;
    
    // Update strategy effectiveness
    for (const action of plan.actions) {
      const strategy = action.type;
      const current = this.metrics.strategyEffectiveness.get(strategy) || 0;
      this.metrics.strategyEffectiveness.set(strategy, current + (success ? 1 : 0));
    }
  }

  private notifyUser(message: string): void {
    console.log(`[Recovery] ${message}`);
    this.userNotificationCallbacks.forEach(callback => callback(message));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // Public API
  // ============================================================================

  public getActiveRecoveries(): Map<string, RecoveryPlan> {
    return new Map(this.activeRecoveries);
  }

  public getRecoveryHistory(): RecoveryPlan[] {
    return [...this.recoveryHistory];
  }

  public getMetrics(): RecoveryMetrics {
    return { ...this.metrics };
  }

  public subscribeToNotifications(callback: (message: string) => void): () => void {
    this.userNotificationCallbacks.push(callback);
    return () => {
      this.userNotificationCallbacks = this.userNotificationCallbacks.filter(cb => cb !== callback);
    };
  }

  public resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.recoveryHistory = [];
  }

  public getRecoveryRecommendations(error: TranscriptionError): string[] {
    const recommendations: string[] = [];
    
    // Add strategy-based recommendations
    for (const strategy of error.recoveryStrategies) {
      if (strategy.userMessage) {
        recommendations.push(strategy.userMessage);
      }
    }
    
    // Add category-specific recommendations
    switch (error.category) {
      case ErrorCategory.NETWORK:
        recommendations.push('Check your internet connection');
        recommendations.push('Try using a different network');
        recommendations.push('Disable VPN or proxy if enabled');
        break;
      case ErrorCategory.PROCESSING:
        recommendations.push('Try with a different video format');
        recommendations.push('Ensure the video file is not corrupted');
        recommendations.push('Try processing a shorter segment first');
        break;
      case ErrorCategory.AI:
        recommendations.push('Try with a smaller AI model');
        recommendations.push('Check if the audio quality is clear');
        recommendations.push('Ensure sufficient system resources are available');
        break;
      case ErrorCategory.RESOURCE:
        recommendations.push('Close other applications to free up resources');
        recommendations.push('Try with a smaller file or lower quality');
        recommendations.push('Restart the application to clear memory');
        break;
    }
    
    return recommendations;
  }
}
