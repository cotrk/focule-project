/**
 * Optimized IPC communication with caching and throttling
 * Reduces main/renderer process communication overhead
 */

import { ipcRenderer, ipcMain } from 'electron';
import { FileOperationManager } from '../utils/memoryManager';

interface IPCRequest {
  id: string;
  channel: string;
  data?: unknown;
  timestamp: number;
}

interface IPCResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

class IPCOptimizer {
  private static instance: IPCOptimizer;
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private pendingRequests = new Map<string, Promise<unknown>>();
  private readonly CACHE_TTL = 5000; // 5 seconds
  private readonly THROTTLE_INTERVAL = 100; // 100ms

  static getInstance(): IPCOptimizer {
    if (!IPCOptimizer.instance) {
      IPCOptimizer.instance = new IPCOptimizer();
    }
    return IPCOptimizer.instance;
  }

  // Renderer process methods
  async invoke<T = unknown>(channel: string, data?: unknown, options: {
    cache?: boolean;
    cacheKey?: string;
    priority?: 'high' | 'medium' | 'low';
  } = {}): Promise<T> {
    const { cache = false, cacheKey, priority = 'medium' } = options;
    
    // Check cache first
    if (cache) {
      const key = cacheKey || `${channel}:${JSON.stringify(data)}`;
      const cached = this.getCachedData(key);
      if (cached !== null) {
        return cached as T;
      }
    }

    // Check for existing pending request
    const requestKey = `${channel}:${JSON.stringify(data)}`;
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey) as Promise<T>;
    }

    // Create new request
    const request = this.createRequest<T>(channel, data, cache ? cacheKey || requestKey : null);
    this.pendingRequests.set(requestKey, request);

    try {
      const result = await request;
      
      // Cache successful results
      if (cache && cacheKey) {
        this.setCachedData(cacheKey, result);
      }
      
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  private async createRequest<T>(channel: string, data: unknown, cacheKey: string | null): Promise<T> {
    const requestId = this.generateRequestId();
    const request: IPCRequest = {
      id: requestId,
      channel,
      data,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`IPC request timeout: ${channel}`));
      }, 30000); // 30 second timeout

      const responseHandler = (_event: any, response: IPCResponse) => {
        if (response.id === requestId) {
          clearTimeout(timeout);
          ipcRenderer.removeListener(`${channel}:response`, responseHandler);
          
          if (response.success) {
            resolve(response.data as T);
          } else {
            reject(new Error(response.error || 'IPC request failed'));
          }
        }
      };

      ipcRenderer.on(`${channel}:response`, responseHandler);
      ipcRenderer.send(channel, request);
    });
  }

  // Main process methods
  setupHandler(channel: string, handler: (data: unknown) => Promise<unknown>) {
    ipcMain.on(channel, async (event, request: IPCRequest) => {
      try {
        const result = await handler(request.data);
        
        const response: IPCResponse = {
          id: request.id,
          success: true,
          data: result,
        };
        
        event.reply(`${channel}:response`, response);
      } catch (error) {
        const response: IPCResponse = {
          id: request.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        
        event.reply(`${channel}:response`, response);
      }
    });
  }

  private getCachedData(key: string): unknown | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCachedData(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Optimized settings handler with caching
export class OptimizedSettings {
  private static readonly CACHE_KEY = 'app_settings';
  private static cache: { data: unknown; timestamp: number } | null = null;
  private static readonly CACHE_TTL = 30000; // 30 seconds

  static async get(): Promise<unknown> {
    // Check cache first
    if (this.cache && (Date.now() - this.cache.timestamp) < this.CACHE_TTL) {
      return this.cache.data;
    }

    try {
      const data = await FileOperationManager.readFileWithCache('settings.json');
      this.cache = { data, timestamp: Date.now() };
      return data;
    } catch (error) {
      // Return default settings if file doesn't exist
      const defaultSettings = {
        outputPath: require('electron').app.getPath('downloads') + '/Focule',
        whisperModel: 'base',
        ollamaModel: 'llama3',
      };
      this.cache = { data: defaultSettings, timestamp: Date.now() };
      return defaultSettings;
    }
  }

  static async set(settings: unknown): Promise<void> {
    await FileOperationManager.writeFileAtomic('settings.json', settings);
    this.cache = { data: settings, timestamp: Date.now() };
  }

  static clearCache(): void {
    this.cache = null;
  }
}

// Throttled progress updates
export class ProgressThrottler {
  private static intervals = new Map<string, NodeJS.Timeout>();
  private static pendingUpdates = new Map<string, unknown>();

  static throttle(channel: string, data: unknown, interval: number = 100): void {
    // Store latest update
    this.pendingUpdates.set(channel, data);

    // Clear existing interval
    const existing = this.intervals.get(channel);
    if (existing) {
      clearInterval(existing);
    }

    // Set new interval
    const timeout = setTimeout(() => {
      const latestData = this.pendingUpdates.get(channel);
      if (latestData) {
        ipcRenderer.send(channel, latestData);
        this.pendingUpdates.delete(channel);
      }
      this.intervals.delete(channel);
    }, interval);

    this.intervals.set(channel, timeout);
  }

  static clear(channel?: string): void {
    if (channel) {
      const interval = this.intervals.get(channel);
      if (interval) {
        clearTimeout(interval);
        this.intervals.delete(channel);
      }
      this.pendingUpdates.delete(channel);
    } else {
      // Clear all
      this.intervals.forEach(interval => clearTimeout(interval));
      this.intervals.clear();
      this.pendingUpdates.clear();
    }
  }
}

export const ipcOptimizer = IPCOptimizer.getInstance();
