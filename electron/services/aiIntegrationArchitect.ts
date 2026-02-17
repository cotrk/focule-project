/**
 * AI Integration Architect - Intelligent Model Selection & Optimization
 * Implements smart Whisper and Ollama model selection with performance optimization
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// Whisper Intelligence Types
// ============================================================================

export interface AudioFileAnalysis {
  fileSize: number;
  duration: number;
  sampleRate: number;
  channels: number;
  bitrate: number;
  format: string;
  quality: 'low' | 'medium' | 'high';
}

export interface WhisperModelRecommendation {
  model: 'tiny' | 'base' | 'small' | 'medium' | 'large' | 'large-v2' | 'large-v3';
  reason: string;
  estimatedTime: number;
  accuracyScore: number;
  memoryUsage: number;
  gpuRequired: boolean;
}

export interface TranscriptionQualityMetrics {
  confidence: number;
  wordsPerMinute: number;
  silenceRatio: number;
  clarityScore: number;
  languageDetection: string;
  backgroundNoiseLevel: 'low' | 'medium' | 'high';
}

// ============================================================================
// Ollama Intelligence Types
// ============================================================================

export interface ContentGenerationRequest {
  transcript: string;
  contentType: 'social' | 'summary' | 'analysis' | 'blog' | 'newsletter';
  tone: 'professional' | 'casual' | 'engaging' | 'technical' | 'creative';
  length: 'short' | 'medium' | 'long';
  targetPlatform: 'youtube' | 'twitter' | 'linkedin' | 'instagram' | 'blog';
}

export interface OllamaModelRecommendation {
  model: string;
  tier: 'lightweight' | 'balanced' | 'performance';
  reasoning: string;
  estimatedTime: number;
  qualityScore: number;
  vramRequired: number;
  bestFor: string[];
}

export interface PromptOptimization {
  basePrompt: string;
  contextEnhancers: string[];
  qualityGuards: string[];
  outputFormat: string;
  examples: string[];
}

// ============================================================================
// System Intelligence
// ============================================================================

export interface SystemCapabilities {
  hasGPU: boolean;
  gpuMemory: number;
  systemMemory: number;
  cpuCores: number;
  platform: string;
  pythonVersion: string;
  whisperInstalled: boolean;
  ollamaAvailable: boolean;
}

// ============================================================================
// Audio Analysis Engine
// ============================================================================

export class AudioAnalysisEngine {
  static async analyzeAudioFile(filePath: string): Promise<AudioFileAnalysis> {
    try {
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // Basic file analysis - in production, use ffprobe for detailed analysis
      const extension = path.extname(filePath).toLowerCase();
      const format = extension.replace('.', '');

      // Estimate duration based on file size (rough approximation)
      // MP3: ~1MB per minute at 128kbps, WAV: ~10MB per minute at 44.1kHz
      const estimatedDuration = format === 'wav' 
        ? fileSize / (10 * 1024 * 1024) * 60  // WAV: ~10MB/min
        : fileSize / (1 * 1024 * 1024) * 60;  // MP3: ~1MB/min

      // Determine quality based on file characteristics
      let quality: 'low' | 'medium' | 'high' = 'medium';
      if (fileSize < 5 * 1024 * 1024) quality = 'low';      // < 5MB
      else if (fileSize > 50 * 1024 * 1024) quality = 'high'; // > 50MB

      return {
        fileSize,
        duration: Math.max(1, estimatedDuration),
        sampleRate: 44100, // Default assumption
        channels: 2,       // Default assumption
        bitrate: format === 'wav' ? 1411 : 128, // Default assumptions
        format,
        quality
      };
    } catch (error) {
      console.error('[AudioAnalysis] Failed to analyze file:', error);
      throw new Error('Unable to analyze audio file');
    }
  }

  static assessTranscriptionQuality(transcript: string, audioAnalysis: AudioFileAnalysis): TranscriptionQualityMetrics {
    const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const estimatedDuration = audioAnalysis.duration;
    
    // Calculate metrics
    const wordsPerMinute = wordCount / Math.max(1, estimatedDuration / 60);
    const silenceRatio = this.estimateSilenceRatio(transcript);
    const clarityScore = this.calculateClarityScore(transcript);
    
    // Detect language (simplified - in production use language detection library)
    const languageDetection = this.detectLanguage(transcript);
    
    // Estimate background noise level based on transcript patterns
    const backgroundNoiseLevel = this.estimateNoiseLevel(transcript);

    // Calculate overall confidence
    const confidence = this.calculateConfidence(
      wordsPerMinute,
      clarityScore,
      silenceRatio,
      backgroundNoiseLevel
    );

    return {
      confidence,
      wordsPerMinute,
      silenceRatio,
      clarityScore,
      languageDetection,
      backgroundNoiseLevel
    };
  }

  private static estimateSilenceRatio(transcript: string): number {
    // Look for long pauses or incomplete sentences
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((acc, s) => acc + s.length, 0) / sentences.length;
    
    // Higher silence ratio if sentences are very short (indicating pauses)
    return Math.max(0, Math.min(1, (50 - avgSentenceLength) / 50));
  }

  private static calculateClarityScore(transcript: string): number {
    // Check for clear indicators: complete sentences, proper punctuation, no filler words
    const fillerWords = /\b(um|uh|like|you know|actually|basically)\b/gi;
    const fillerCount = (transcript.match(fillerWords) || []).length;
    const words = transcript.split(/\s+/).length;
    
    const fillerRatio = fillerCount / Math.max(1, words);
    const clarityScore = Math.max(0, 1 - (fillerRatio * 2)); // Penalize filler words
    
    return clarityScore;
  }

  private static detectLanguage(transcript: string): string {
    // Simplified language detection based on character patterns
    const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/i;
    const matches = (transcript.match(englishWords) || []).length;
    const words = transcript.split(/\s+/).length;
    
    return (matches / words) > 0.1 ? 'english' : 'unknown';
  }

  private static estimateNoiseLevel(transcript: string): 'low' | 'medium' | 'high' {
    // Look for indicators of poor transcription quality
    const unclearPatterns = /\[.*?\]|\(.*?\)|\.{3,}|INAUDIBLE/gi;
    const unclearCount = (transcript.match(unclearPatterns) || []).length;
    const words = transcript.split(/\s+/).length;
    
    const unclearRatio = unclearCount / Math.max(1, words);
    
    if (unclearRatio > 0.05) return 'high';
    if (unclearRatio > 0.02) return 'medium';
    return 'low';
  }

  private static calculateConfidence(
    wordsPerMinute: number,
    clarityScore: number,
    silenceRatio: number,
    noiseLevel: string
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Adjust based on words per minute (normal speech: 120-160 WPM)
    if (wordsPerMinute >= 120 && wordsPerMinute <= 160) {
      confidence += 0.2;
    } else if (wordsPerMinute >= 80 && wordsPerMinute <= 200) {
      confidence += 0.1;
    }
    
    // Adjust based on clarity
    confidence += clarityScore * 0.2;
    
    // Adjust based on silence ratio
    confidence += (1 - silenceRatio) * 0.1;
    
    // Adjust based on noise level
    switch (noiseLevel) {
      case 'low': confidence += 0.2; break;
      case 'medium': confidence += 0.1; break;
      case 'high': confidence -= 0.2; break;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }
}

// ============================================================================
// Whisper Model Intelligence
// ============================================================================

export class WhisperModelIntelligence {
  private static readonly MODEL_SPECS = {
    'tiny': { 
      accuracy: 0.60, 
      speed: 9, 
      memory: 100, 
      gpuRequired: false,
      description: 'Fastest, lowest accuracy - good for quick drafts'
    },
    'base': { 
      accuracy: 0.75, 
      speed: 7, 
      memory: 140, 
      gpuRequired: false,
      description: 'Good balance of speed and accuracy'
    },
    'small': { 
      accuracy: 0.85, 
      speed: 5, 
      memory: 466, 
      gpuRequired: true,
      description: 'Better accuracy, requires more resources'
    },
    'medium': { 
      accuracy: 0.92, 
      speed: 3, 
      memory: 1429, 
      gpuRequired: true,
      description: 'High accuracy, slower processing'
    },
    'large': { 
      accuracy: 0.96, 
      speed: 1, 
      memory: 2894, 
      gpuRequired: true,
      description: 'Best accuracy, slowest processing'
    },
    'large-v2': { 
      accuracy: 0.97, 
      speed: 1, 
      memory: 2894, 
      gpuRequired: true,
      description: 'Improved large model v2'
    },
    'large-v3': { 
      accuracy: 0.98, 
      speed: 1, 
      memory: 2894, 
      gpuRequired: true,
      description: 'Latest large model v3'
    }
  };

  static selectOptimalModel(
    audioAnalysis: AudioFileAnalysis,
    accuracyRequirement: 'low' | 'medium' | 'high',
    systemCapabilities: SystemCapabilities
  ): WhisperModelRecommendation {
    const candidates = Object.entries(this.MODEL_SPECS)
      .filter(([_, specs]) => {
        // Filter by accuracy requirement
        if (accuracyRequirement === 'low' && specs.accuracy < 0.60) return false;
        if (accuracyRequirement === 'medium' && specs.accuracy < 0.75) return false;
        if (accuracyRequirement === 'high' && specs.accuracy < 0.90) return false;
        
        // Filter by system capabilities
        if (specs.gpuRequired && !systemCapabilities.hasGPU) return false;
        if (specs.memory > systemCapabilities.systemMemory) return false;
        
        return true;
      })
      .map(([model, specs]) => ({
        model: model as keyof typeof WhisperModelIntelligence.MODEL_SPECS,
        specs
      }));

    if (candidates.length === 0) {
      // Fallback to base model if no candidates meet requirements
      return this.createRecommendation('base', audioAnalysis, systemCapabilities);
    }

    // Score candidates based on multiple factors
    const scored = candidates.map(({ model, specs }) => {
      let score = 0;
      
      // Accuracy score (40% weight)
      const accuracyWeight = 0.4;
      score += specs.accuracy * accuracyWeight;
      
      // Speed score (30% weight) - faster is better
      const speedWeight = 0.3;
      score += (specs.speed / 9) * speedWeight;
      
      // Resource efficiency (20% weight) - lower memory usage is better
      const memoryWeight = 0.2;
      score += (1 - (specs.memory / 3000)) * memoryWeight;
      
      // File size appropriateness (10% weight)
      const sizeWeight = 0.1;
      const sizeScore = this.calculateSizeScore(model, audioAnalysis);
      score += sizeScore * sizeWeight;

      return { model, score, specs };
    });

    // Select best candidate
    const best = scored.reduce((prev, curr) => curr.score > prev.score ? curr : prev);
    
    return this.createRecommendation(best.model, audioAnalysis, systemCapabilities);
  }

  private static calculateSizeScore(
    model: keyof typeof WhisperModelIntelligence.MODEL_SPECS,
    audioAnalysis: AudioFileAnalysis
  ): number {
    const fileSize = audioAnalysis.fileSize;
    const duration = audioAnalysis.duration;
    
    // For large files, prefer more accurate models
    if (fileSize > 100 * 1024 * 1024) { // > 100MB
      return model === 'large' || model === 'large-v2' || model === 'large-v3' ? 1 : 0.5;
    }
    
    // For small files, faster models are fine
    if (fileSize < 10 * 1024 * 1024) { // < 10MB
      return model === 'tiny' || model === 'base' ? 1 : 0.7;
    }
    
    // Medium files - balanced approach
    return model === 'small' || model === 'medium' ? 1 : 0.8;
  }

  private static createRecommendation(
    model: keyof typeof WhisperModelIntelligence.MODEL_SPECS,
    audioAnalysis: AudioFileAnalysis,
    systemCapabilities: SystemCapabilities
  ): WhisperModelRecommendation {
    const specs = this.MODEL_SPECS[model];
    const duration = audioAnalysis.duration;
    
    // Estimate processing time based on model speed and audio duration
    const estimatedTime = duration / specs.speed;
    
    return {
      model,
      reason: specs.description,
      estimatedTime,
      accuracyScore: specs.accuracy,
      memoryUsage: specs.memory,
      gpuRequired: specs.gpuRequired
    };
  }

  static getAvailableModels(systemCapabilities: SystemCapabilities): string[] {
    return Object.entries(this.MODEL_SPECS)
      .filter(([_, specs]) => {
        if (specs.gpuRequired && !systemCapabilities.hasGPU) return false;
        if (specs.memory > systemCapabilities.systemMemory) return false;
        return true;
      })
      .map(([model]) => model);
  }
}

// ============================================================================
// Ollama Model Intelligence
// ============================================================================

export class OllamaModelIntelligence {
  private static readonly CONTENT_TYPE_PROMPTS: Record<string, PromptOptimization> = {
    social: {
      basePrompt: "Create engaging social media content from this transcript",
      contextEnhancers: [
        "Focus on viral potential and shareability",
        "Include trending hashtags and hooks",
        "Optimize for short attention spans"
      ],
      qualityGuards: [
        "Ensure content is platform-appropriate",
        "Include clear call-to-action",
        "Maintain authentic voice"
      ],
      outputFormat: "JSON with hooks, description, hashtags, keywords",
      examples: ["Hook: 'I built something amazing...', Description: 'Watch how I...', Hashtags: '#tech #build #DIY'"]
    },
    summary: {
      basePrompt: "Create a concise summary of this transcript",
      contextEnhancers: [
        "Extract key insights and takeaways",
        "Maintain logical flow and structure",
        "Highlight important details"
      ],
      qualityGuards: [
        "Keep it comprehensive yet brief",
        "Preserve essential information",
        "Use clear, professional language"
      ],
      outputFormat: "Structured summary with bullet points",
      examples: ["• Key finding: ... • Main point: ... • Conclusion: ..."]
    },
    analysis: {
      basePrompt: "Provide detailed analysis of this transcript",
      contextEnhancers: [
        "Identify patterns and trends",
        "Extract actionable insights",
        "Consider multiple perspectives"
      ],
      qualityGuards: [
        "Support claims with evidence",
        "Provide balanced viewpoint",
        "Include recommendations"
      ],
      outputFormat: "Comprehensive analysis with sections",
      examples: ["Analysis: ... | Evidence: ... | Recommendations: ..."]
    }
  };

  static selectOptimalModel(
    request: ContentGenerationRequest,
    availableModels: string[],
    systemCapabilities: SystemCapabilities
  ): OllamaModelRecommendation {
    // Categorize available models
    const categorized = this.categorizeModels(availableModels);
    
    // Select based on content type and requirements
    let targetTier: 'lightweight' | 'balanced' | 'performance';
    
    switch (request.contentType) {
      case 'social':
        targetTier = request.length === 'short' ? 'lightweight' : 'balanced';
        break;
      case 'summary':
        targetTier = 'balanced';
        break;
      case 'analysis':
        targetTier = request.length === 'long' ? 'performance' : 'balanced';
        break;
      default:
        targetTier = 'balanced';
    }

    // Get best model from target tier
    const candidates = categorized[targetTier];
    if (candidates.length === 0 && targetTier !== 'balanced') {
      // Fallback to balanced tier
      return this.selectFromTier(categorized.balanced, request, systemCapabilities);
    }

    return this.selectFromTier(candidates, request, systemCapabilities);
  }

  private static categorizeModels(models: string[]): Record<string, string[]> {
    const categorized = {
      lightweight: [] as string[],
      balanced: [] as string[],
      performance: [] as string[]
    };

    for (const model of models) {
      const params = this.extractParams(model);
      if (params < 8) categorized.lightweight.push(model);
      else if (params <= 20) categorized.balanced.push(model);
      else categorized.performance.push(model);
    }

    return categorized;
  }

  private static extractParams(modelName: string): number {
    const match = modelName.match(/(\d+\.?\d*)b/i);
    return match ? parseFloat(match[1]) : 0;
  }

  private static selectFromTier(
    models: string[],
    request: ContentGenerationRequest,
    systemCapabilities: SystemCapabilities
  ): OllamaModelRecommendation {
    if (models.length === 0) {
      // Default fallback
      return {
        model: 'llama3.2:3b',
        tier: 'lightweight',
        reasoning: 'Default fallback model',
        estimatedTime: 30,
        qualityScore: 0.7,
        vramRequired: 4,
        bestFor: ['basic content generation']
      };
    }

    // Prioritize known good models
    const priorityModels = ['mistral', 'llama', 'qwen', 'gemma'];
    let selected = models[0];

    for (const priority of priorityModels) {
      const match = models.find(m => m.toLowerCase().includes(priority));
      if (match) {
        selected = match;
        break;
      }
    }

    const params = this.extractParams(selected);
    const tier = params < 8 ? 'lightweight' : params <= 20 ? 'balanced' : 'performance';

    return {
      model: selected,
      tier,
      reasoning: `Optimal for ${request.contentType} content generation`,
      estimatedTime: this.estimateProcessingTime(selected, request),
      qualityScore: this.estimateQualityScore(selected, request),
      vramRequired: this.estimateVRAM(selected),
      bestFor: [request.contentType, request.tone]
    };
  }

  private static estimateProcessingTime(model: string, request: ContentGenerationRequest): number {
    const params = this.extractParams(model);
    const baseTime = params * 2; // Base time per parameter
    
    // Adjust for content length
    const lengthMultiplier = request.length === 'short' ? 0.5 : 
                            request.length === 'medium' ? 1 : 1.5;
    
    return Math.round(baseTime * lengthMultiplier);
  }

  private static estimateQualityScore(model: string, request: ContentGenerationRequest): number {
    const params = this.extractParams(model);
    let score = Math.min(0.9, params / 70); // Scale with parameter count
    
    // Adjust for content type suitability
    if (request.contentType === 'social' && params > 8) score += 0.1;
    if (request.contentType === 'analysis' && params > 20) score += 0.1;
    
    return Math.min(0.95, score);
  }

  private static estimateVRAM(model: string): number {
    const params = this.extractParams(model);
    if (params < 8) return 4;
    if (params <= 20) return 12;
    return 24;
  }

  static generateOptimizedPrompt(request: ContentGenerationRequest): string {
    const promptTemplate = this.CONTENT_TYPE_PROMPTS[request.contentType] || this.CONTENT_TYPE_PROMPTS.social;
    
    let prompt = promptTemplate.basePrompt;
    
    // Add context enhancers
    if (promptTemplate.contextEnhancers.length > 0) {
      prompt += '\n\nConsider the following:\n';
      prompt += promptTemplate.contextEnhancers.map(e => `• ${e}`).join('\n');
    }
    
    // Add tone specification
    prompt += `\n\nTone: ${request.tone}`;
    prompt += `\nLength: ${request.length}`;
    prompt += `\nPlatform: ${request.targetPlatform}`;
    
    // Add quality guards
    if (promptTemplate.qualityGuards.length > 0) {
      prompt += '\n\nRequirements:\n';
      prompt += promptTemplate.qualityGuards.map(g => `• ${g}`).join('\n');
    }
    
    // Add output format
    prompt += `\n\nOutput Format: ${promptTemplate.outputFormat}`;
    
    return prompt;
  }
}

// ============================================================================
// System Capabilities Detector
// ============================================================================

export class SystemCapabilitiesDetector {
  static async detectCapabilities(): Promise<SystemCapabilities> {
    const platform = os.platform();
    const systemMemory = os.totalmem() / (1024 * 1024 * 1024); // GB
    const cpuCores = os.cpus().length;
    
    // Detect GPU (simplified - in production use GPU detection libraries)
    const hasGPU = await this.detectGPU();
    const gpuMemory = hasGPU ? await this.detectGPUMemory() : 0;
    
    // Detect Python and Whisper
    const pythonVersion = await this.detectPythonVersion();
    const whisperInstalled = await this.checkWhisperInstallation();
    
    // Check Ollama
    const ollamaAvailable = await this.checkOllamaAvailability();

    return {
      hasGPU,
      gpuMemory,
      systemMemory,
      cpuCores,
      platform,
      pythonVersion,
      whisperInstalled,
      ollamaAvailable
    };
  }

  private static async detectGPU(): Promise<boolean> {
    // Simplified GPU detection - in production use nvidia-smi or similar
    return process.platform === 'win32' || process.platform === 'linux';
  }

  private static async detectGPUMemory(): Promise<number> {
    // Simplified - return estimated VRAM based on common configurations
    return 8; // Assume 8GB as default
  }

  private static async detectPythonVersion(): Promise<string> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync('python --version 2>&1 || python3 --version 2>&1');
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  private static async checkWhisperInstallation(): Promise<boolean> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      await execAsync('python -c "import whisper" 2>&1 || python3 -c "import whisper" 2>&1');
      return true;
    } catch {
      return false;
    }
  }

  private static async checkOllamaAvailability(): Promise<boolean> {
    try {
      const http = require('http');
      
      return new Promise<boolean>((resolve) => {
        const req = http.get('http://127.0.0.1:11434/api/tags', (res: any) => {
          resolve(res.statusCode === 200);
        });
        
        req.on('error', () => resolve(false));
        req.setTimeout(3000, () => {
          req.destroy();
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }
}

// ============================================================================
// AI Performance Monitor
// ============================================================================

export class AIPerformanceMonitor {
  private static metrics: Map<string, any[]> = new Map();

  static recordPerformance(
    model: string,
    operation: string,
    duration: number,
    quality: number,
    metadata?: any
  ): void {
    const key = `${model}-${operation}`;
    const existing = this.metrics.get(key) || [];
    
    existing.push({
      timestamp: Date.now(),
      duration,
      quality,
      metadata
    });

    // Keep only last 100 entries per key
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }

    this.metrics.set(key, existing);
  }

  static getPerformanceStats(model: string, operation: string): any {
    const key = `${model}-${operation}`;
    const data = this.metrics.get(key) || [];
    
    if (data.length === 0) return null;

    const durations = data.map(d => d.duration);
    const qualities = data.map(d => d.quality);

    return {
      count: data.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      avgQuality: qualities.reduce((a, b) => a + b, 0) / qualities.length,
      lastUpdated: Math.max(...data.map(d => d.timestamp))
    };
  }

  static getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [key] of this.metrics) {
      const [model, operation] = key.split('-');
      stats[key] = this.getPerformanceStats(model, operation);
    }
    
    return stats;
  }

  static clearStats(): void {
    this.metrics.clear();
  }
}

// ============================================================================
// Export Main Integration Class
// ============================================================================

export class AIIntegrationArchitect {
  private systemCapabilities: SystemCapabilities | null = null;

  async initialize(): Promise<void> {
    this.systemCapabilities = await SystemCapabilitiesDetector.detectCapabilities();
    console.log('[AI Architect] System capabilities detected:', this.systemCapabilities);
  }

  async optimizeWhisperSelection(
    audioPath: string,
    accuracyRequirement: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<WhisperModelRecommendation> {
    if (!this.systemCapabilities) {
      await this.initialize();
    }

    const audioAnalysis = await AudioAnalysisEngine.analyzeAudioFile(audioPath);
    const recommendation = WhisperModelIntelligence.selectOptimalModel(
      audioAnalysis,
      accuracyRequirement,
      this.systemCapabilities!
    );

    console.log('[AI Architect] Whisper recommendation:', recommendation);
    return recommendation;
  }

  async optimizeOllamaSelection(
    request: ContentGenerationRequest,
    availableModels: string[]
  ): Promise<OllamaModelRecommendation> {
    if (!this.systemCapabilities) {
      await this.initialize();
    }

    const recommendation = OllamaModelIntelligence.selectOptimalModel(
      request,
      availableModels,
      this.systemCapabilities!
    );

    console.log('[AI Architect] Ollama recommendation:', recommendation);
    return recommendation;
  }

  generateOptimizedPrompt(request: ContentGenerationRequest): string {
    return OllamaModelIntelligence.generateOptimizedPrompt(request);
  }

  assessTranscriptionQuality(transcript: string, audioPath: string): TranscriptionQualityMetrics {
    // For demo, create basic audio analysis
    const stats = fs.statSync(audioPath);
    const audioAnalysis: AudioFileAnalysis = {
      fileSize: stats.size,
      duration: 60, // Default 1 minute
      sampleRate: 44100,
      channels: 2,
      bitrate: 128,
      format: path.extname(audioPath).replace('.', ''),
      quality: 'medium'
    };

    return AudioAnalysisEngine.assessTranscriptionQuality(transcript, audioAnalysis);
  }

  recordPerformance(model: string, operation: string, duration: number, quality: number): void {
    AIPerformanceMonitor.recordPerformance(model, operation, duration, quality);
  }

  getPerformanceStats(): Record<string, any> {
    return AIPerformanceMonitor.getAllStats();
  }
}

// Export singleton instance
export const aiIntegrationArchitect = new AIIntegrationArchitect();
