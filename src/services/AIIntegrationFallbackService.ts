import { RecoveryService } from './RecoveryService';
import { AdvancedRetryService } from './AdvancedRetryService';
import { AIModelError, ErrorSeverity, ErrorCategory } from '../utils/errorHandling';
import type { TranscriptionResult, SocialContent } from '../types';

// ============================================================================
// AI Integration Fallback Service
// ============================================================================

export interface AIModelConfig {
  name: string;
  type: 'whisper' | 'ollama';
  size: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  provider: string;
  endpoint?: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
  priority: number; // Lower number = higher priority
}

export interface TranscriptionOptions {
  language?: string;
  model?: string;
  quality: 'high' | 'medium' | 'low';
  enableTimestamps: boolean;
  enableDiarization: boolean;
}

export interface AIProcessingResult {
  success: boolean;
  result?: Partial<TranscriptionResult>;
  modelUsed?: string;
  quality?: string;
  processingTime?: number;
  error?: Error;
  usedFallback?: boolean;
  fallbackLevel?: number;
}

export class AIIntegrationFallbackService {
  private static instance: AIIntegrationFallbackService;
  private recoveryService: RecoveryService;
  private availableModels: AIModelConfig[];
  private modelHealth: Map<string, ModelHealthStatus> = new Map();

  private constructor() {
    this.recoveryService = RecoveryService.getInstance();
    this.availableModels = this.initializeModels();
    this.startHealthMonitoring();
  }

  public static getInstance(): AIIntegrationFallbackService {
    if (!AIIntegrationFallbackService.instance) {
      AIIntegrationFallbackService.instance = new AIIntegrationFallbackService();
    }
    return AIIntegrationFallbackService.instance;
  }

  // ============================================================================
  // Model Configuration
  // ============================================================================

  private initializeModels(): AIModelConfig[] {
    return [
      // Whisper Models (Transcription)
      {
        name: 'whisper-large-v3',
        type: 'whisper',
        size: 'large',
        provider: 'openai',
        priority: 1,
        maxTokens: 100000
      },
      {
        name: 'whisper-medium',
        type: 'whisper',
        size: 'medium',
        provider: 'openai',
        priority: 2,
        maxTokens: 50000
      },
      {
        name: 'whisper-base',
        type: 'whisper',
        size: 'base',
        provider: 'openai',
        priority: 3,
        maxTokens: 25000
      },
      {
        name: 'whisper-tiny',
        type: 'whisper',
        size: 'tiny',
        provider: 'openai',
        priority: 4,
        maxTokens: 10000
      },

      // Ollama Models (Social Content Generation)
      {
        name: 'llama3.1:8b',
        type: 'ollama',
        size: 'medium',
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
        priority: 1,
        maxTokens: 8000,
        temperature: 0.7
      },
      {
        name: 'llama3.1:7b',
        type: 'ollama',
        size: 'medium',
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
        priority: 2,
        maxTokens: 7000,
        temperature: 0.7
      },
      {
        name: 'mistral:7b',
        type: 'ollama',
        size: 'medium',
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
        priority: 3,
        maxTokens: 7000,
        temperature: 0.6
      },
      {
        name: 'phi3:mini',
        type: 'ollama',
        size: 'small',
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
        priority: 4,
        maxTokens: 4000,
        temperature: 0.5
      }
    ];
  }

  // ============================================================================
  // Transcription with Fallbacks
  // ============================================================================

  public async transcribeWithFallbacks(
    audioPath: string,
    options: TranscriptionOptions = {
      quality: 'high',
      enableTimestamps: true,
      enableDiarization: false
    }
  ): Promise<AIProcessingResult> {
    const preferredModels = this.getModelsByType('whisper');
    const qualityFilteredModels = this.filterModelsByQuality(preferredModels, options.quality);
    const sortedModels = qualityFilteredModels.sort((a, b) => a.priority - b.priority);

    const operations = sortedModels.map(model => 
      () => this.transcribeWithModel(audioPath, model, options)
    );

    const result = await this.recoveryService.executeWithFallback(
      operations[0],
      operations.slice(1),
      `transcription_${this.getOperationId(audioPath)}`,
      {
        maxAttempts: 2,
        baseDelay: 2000,
        onRetry: (attempt, error) => {
          console.warn(`Transcription attempt ${attempt} failed:`, error.message);
        }
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
  // Social Content Generation with Fallbacks
  // ============================================================================

  public async generateSocialContentWithFallbacks(
    transcript: string,
    options: {
      tone?: 'professional' | 'casual' | 'humorous';
      platform?: 'twitter' | 'linkedin' | 'instagram';
      maxLength?: number;
    } = {}
  ): Promise<AIProcessingResult> {
    const preferredModels = this.getModelsByType('ollama');
    const healthyModels = this.getHealthyModels(preferredModels);
    const sortedModels = healthyModels.sort((a, b) => a.priority - b.priority);

    const operations = sortedModels.map(model => 
      () => this.generateSocialContentWithModel(transcript, model, options)
    );

    const result = await this.recoveryService.executeWithFallback(
      operations[0],
      operations.slice(1),
      `social_content_${this.generateOperationId()}`,
      {
        maxAttempts: 3,
        baseDelay: 1500,
        onRetry: (attempt, error) => {
          console.warn(`Social content generation attempt ${attempt} failed:`, error.message);
        }
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
  // Model-Specific Processing Methods
  // ============================================================================

  private async transcribeWithModel(
    audioPath: string,
    model: AIModelConfig,
    options: TranscriptionOptions
  ): Promise<AIProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Check model health first
      const health = await this.checkModelHealth(model);
      if (!health.isHealthy) {
        throw new AIModelError(
          `Model ${model.name} is unhealthy: ${health.reason}`,
          { operation: 'transcribe', metadata: { model: model.name, audioPath } }
        );
      }

      console.log(`Transcribing with model: ${model.name}`);
      
      // This would integrate with actual transcription service
      const result = await this.performTranscription(audioPath, model, options);
      
      return {
        success: true,
        result,
        modelUsed: model.name,
        quality: this.assessTranscriptionQuality(result),
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      // Update model health status
      this.updateModelHealth(model.name, false, error instanceof Error ? error.message : String(error));
      
      throw new AIModelError(
        `Transcription failed with model ${model.name}: ${error instanceof Error ? error.message : String(error)}`,
        { operation: 'transcribe', metadata: { model: model.name, audioPath } }
      );
    }
  }

  private async generateSocialContentWithModel(
    transcript: string,
    model: AIModelConfig,
    options: {
      tone?: string;
      platform?: string;
      maxLength?: number;
    }
  ): Promise<AIProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Check model health first
      const health = await this.checkModelHealth(model);
      if (!health.isHealthy) {
        throw new AIModelError(
          `Model ${model.name} is unhealthy: ${health.reason}`,
          { operation: 'generate_social_content', metadata: { model: model.name } }
        );
      }

      console.log(`Generating social content with model: ${model.name}`);
      
      // This would integrate with actual Ollama service
      const result = await this.performSocialContentGeneration(transcript, model, options);
      
      return {
        success: true,
        result,
        modelUsed: model.name,
        quality: this.assessContentQuality(result),
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      // Update model health status
      this.updateModelHealth(model.name, false, error instanceof Error ? error.message : String(error));
      
      throw new AIModelError(
        `Social content generation failed with model ${model.name}: ${error instanceof Error ? error.message : String(error)}`,
        { operation: 'generate_social_content', metadata: { model: model.name } }
      );
    }
  }

  // ============================================================================
  // Model Health Monitoring
  // ============================================================================

  private async checkModelHealth(model: AIModelConfig): Promise<ModelHealthStatus> {
    const cached = this.modelHealth.get(model.name);
    if (cached && Date.now() - cached.lastCheck < 60000) { // 1 minute cache
      return cached;
    }

    try {
      // This would perform actual health check
      const isHealthy = await this.performHealthCheck(model);
      
      const status: ModelHealthStatus = {
        isHealthy,
        lastCheck: Date.now(),
        consecutiveFailures: isHealthy ? 0 : (cached?.consecutiveFailures || 0) + 1,
        reason: isHealthy ? undefined : 'Health check failed'
      };
      
      this.modelHealth.set(model.name, status);
      return status;
    } catch (error) {
      const status: ModelHealthStatus = {
        isHealthy: false,
        lastCheck: Date.now(),
        consecutiveFailures: (cached?.consecutiveFailures || 0) + 1,
        reason: error instanceof Error ? error.message : String(error)
      };
      
      this.modelHealth.set(model.name, status);
      return status;
    }
  }

  private async performHealthCheck(model: AIModelConfig): Promise<boolean> {
    // Simulate health check (replace with actual implementation)
    if (model.type === 'ollama') {
      try {
        // Check if Ollama is running and model is available
        const response = await fetch(`${model.endpoint}/api/tags`);
        return response.ok;
      } catch {
        return false;
      }
    } else if (model.type === 'whisper') {
      // Check Whisper availability (would integrate with actual service)
      return true; // Simplified
    }
    
    return false;
  }

  private updateModelHealth(modelName: string, isHealthy: boolean, reason?: string): void {
    const current = this.modelHealth.get(modelName) || {
      isHealthy: true,
      lastCheck: Date.now(),
      consecutiveFailures: 0
    };
    
    this.modelHealth.set(modelName, {
      isHealthy,
      lastCheck: Date.now(),
      consecutiveFailures: isHealthy ? 0 : current.consecutiveFailures + 1,
      reason: isHealthy ? undefined : reason
    });
  }

  private startHealthMonitoring(): void {
    // Monitor model health every 5 minutes
    setInterval(() => {
      this.availableModels.forEach(async (model) => {
        await this.checkModelHealth(model);
      });
    }, 300000);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getModelsByType(type: 'whisper' | 'ollama'): AIModelConfig[] {
    return this.availableModels.filter(model => model.type === type);
  }

  private filterModelsByQuality(models: AIModelConfig[], quality: string): AIModelConfig[] {
    const sizeMap = {
      'high': ['large', 'medium'],
      'medium': ['medium', 'base', 'small'],
      'low': ['base', 'small', 'tiny']
    };
    
    const allowedSizes = sizeMap[quality as keyof typeof sizeMap] || ['medium'];
    return models.filter(model => allowedSizes.includes(model.size));
  }

  private getHealthyModels(models: AIModelConfig[]): AIModelConfig[] {
    return models.filter(model => {
      const health = this.modelHealth.get(model.name);
      return !health || health.isHealthy || health.consecutiveFailures < 3;
    });
  }

  private async performTranscription(
    audioPath: string,
    model: AIModelConfig,
    options: TranscriptionOptions
  ): Promise<{
    text: string;
    timestamps?: Array<{ start: number; end: number; text: string }>;
    language: string;
    confidence: number;
  }> {
    // Simulate transcription (replace with actual implementation)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    return {
      text: `This is a simulated transcription from ${model.name}`,
      timestamps: options.enableTimestamps ? [
        { start: 0, end: 5, text: 'First segment' },
        { start: 5, end: 10, text: 'Second segment' }
      ] : undefined,
      language: options.language || 'en',
      confidence: 0.85 + Math.random() * 0.1
    };
  }

  private async performSocialContentGeneration(
    transcript: string,
    model: AIModelConfig,
    options: {
      tone?: string;
      platform?: string;
      maxLength?: number;
    }
  ): Promise<Partial<SocialContent>> {
    // Simulate content generation (replace with actual implementation)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return {
      hooks: [
        `Generated hook from ${model.name}`,
        'Another engaging hook'
      ],
      description: `Generated description using ${options.tone || 'professional'} tone`,
      hashtags: ['#video', '#content', '#ai'],
      keywords: ['transcription', 'ai', 'content'],
      imagePrompts: ['Professional thumbnail design', 'Engaging social media graphic']
    };
  }

  private assessTranscriptionQuality(result: {
    text: string;
    timestamps?: Array<{ start: number; end: number; text: string }>;
    language: string;
    confidence: number;
  }): string {
    const confidence = result.confidence || 0;
    if (confidence > 0.9) return 'high';
    if (confidence > 0.7) return 'medium';
    return 'low';
  }

  private assessContentQuality(result: Partial<SocialContent>): string {
    // Assess quality based on content length, structure, etc.
    const hasHooks = result.hooks && result.hooks.length > 0;
    const hasDescription = result.description && result.description.length > 50;
    
    if (hasHooks && hasDescription) return 'high';
    if (hasHooks || hasDescription) return 'medium';
    return 'low';
  }

  private getOperationId(audioPath: string): string {
    return audioPath.split(/[/\\\\]/).pop()?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  public getAvailableModels(type?: 'whisper' | 'ollama'): AIModelConfig[] {
    return type 
      ? this.getModelsByType(type)
      : [...this.availableModels];
  }

  public getModelHealth(modelName: string): ModelHealthStatus | undefined {
    return this.modelHealth.get(modelName);
  }

  public getAllModelHealth(): Map<string, ModelHealthStatus> {
    return new Map(this.modelHealth);
  }

  public addCustomModel(model: AIModelConfig): void {
    this.availableModels.push(model);
  }

  public removeModel(modelName: string): void {
    const index = this.availableModels.findIndex(m => m.name === modelName);
    if (index !== -1) {
      this.availableModels.splice(index, 1);
    }
  }

  public getOptimalModel(
    type: 'whisper' | 'ollama',
    quality: 'high' | 'medium' | 'low' = 'medium'
  ): AIModelConfig | null {
    const models = this.getModelsByType(type);
    const qualityFiltered = this.filterModelsByQuality(models, quality);
    const healthy = this.getHealthyModels(qualityFiltered);
    
    return healthy.sort((a, b) => a.priority - b.priority)[0] || null;
  }

  public getAIStatistics(): {
    totalModels: number;
    healthyModels: number;
    whisperModels: number;
    ollamaModels: number;
    averageProcessingTime: number;
  } {
    const healthy = Array.from(this.modelHealth.values()).filter(h => h.isHealthy).length;
    
    return {
      totalModels: this.availableModels.length,
      healthyModels: healthy,
      whisperModels: this.getModelsByType('whisper').length,
      ollamaModels: this.getModelsByType('ollama').length,
      averageProcessingTime: 0 // Would calculate from actual processing times
    };
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface ModelHealthStatus {
  isHealthy: boolean;
  lastCheck: number;
  consecutiveFailures: number;
  reason?: string;
}
