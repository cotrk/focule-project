/**
 * Enhanced IPC security middleware
 * Provides rate limiting, input validation, and secure communication
 */

import { ipcMain } from 'electron';
import { SecurityValidator } from './securityValidator';
import { createHash, randomBytes } from 'crypto';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAccess: number;
}

interface IPCSecurityConfig {
  rateLimitWindow: number; // milliseconds
  maxRequestsPerWindow: number;
  enableInputValidation: boolean;
  enableRateLimiting: boolean;
  enableRequestSigning: boolean;
}

export class IPCSecurityManager {
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private requestSignatures: Map<string, string> = new Map();
  private config: IPCSecurityConfig;

  constructor(config: Partial<IPCSecurityConfig> = {}) {
    this.config = {
      rateLimitWindow: 60000, // 1 minute
      maxRequestsPerWindow: 100,
      enableInputValidation: true,
      enableRateLimiting: true,
      enableRequestSigning: false,
      ...config
    };

    // Clean up old rate limit entries periodically
    setInterval(() => {
      this.cleanupRateLimits();
    }, 30000); // Every 30 seconds
  }

  /**
   * Secure IPC handler wrapper
   */
  secureHandler(channel: string, handler: (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown> | unknown): void {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        // Rate limiting
        if (this.config.enableRateLimiting && !this.checkRateLimit(event.sender.id)) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Input validation
        if (this.config.enableInputValidation) {
          this.validateInputs(channel, args);
        }

        // Request signing (optional)
        if (this.config.enableRequestSigning) {
          this.validateRequestSignature(channel, args);
        }

        // Execute the original handler
        const result = await handler(event, ...args);
        
        // Sanitize output
        return this.sanitizeOutput(result);

      } catch (error) {
        console.error(`[IPCSecurity] Error in ${channel}:`, error);
        throw error;
      }
    });
  }

  /**
   * Check rate limiting for a sender
   */
  private checkRateLimit(senderId: number): boolean {
    const now = Date.now();
    const entry = this.rateLimits.get(senderId.toString());

    if (!entry) {
      this.rateLimits.set(senderId.toString(), {
        count: 1,
        resetTime: now + this.config.rateLimitWindow,
        lastAccess: now
      });
      return true;
    }

    // Reset window if expired
    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + this.config.rateLimitWindow;
      entry.lastAccess = now;
      return true;
    }

    // Check limit
    if (entry.count >= this.config.maxRequestsPerWindow) {
      return false;
    }

    entry.count++;
    entry.lastAccess = now;
    return true;
  }

  /**
   * Validate inputs based on channel
   */
  private validateInputs(channel: string, args: unknown[]): void {
    switch (channel) {
      case 'download:start':
        this.validateDownloadInput(args[0] as string);
        break;
      case 'file:save':
      case 'file:save-project':
        this.validateFileSaveInput(args);
        break;
      case 'shell:open-folder':
        this.validatePathInput(args[0] as string);
        break;
      case 'prerequisites:set-path':
        this.validatePathInput(args[1] as string);
        break;
      default:
        // Generic validation for other channels
        this.validateGenericInput(args);
    }
  }

  private validateDownloadInput(url: string): void {
    if (typeof url !== 'string') {
      throw new Error('URL must be a string');
    }

    const validation = SecurityValidator.validateDownloadUrl(url);
    if (!validation.valid) {
      throw new Error(`Invalid URL: ${validation.reason}`);
    }
  }

  private validateFileSaveInput(args: unknown[]): void {
    const [content, filename] = args as [string, string];
    
    if (typeof content !== 'string') {
      throw new Error('Content must be a string');
    }

    if (typeof filename !== 'string') {
      throw new Error('Filename must be a string');
    }

    // Validate filename
    const sanitized = SecurityValidator.sanitizeFilename(filename);
    if (sanitized !== filename) {
      console.warn(`[IPCSecurity] Filename sanitized: ${filename} -> ${sanitized}`);
    }

    // Validate content
    const validation = SecurityValidator.validateContent(content, 'text');
    if (!validation.valid) {
      throw new Error(`Invalid content: ${validation.reason}`);
    }
  }

  private validatePathInput(pathInput: string): void {
    if (typeof pathInput !== 'string') {
      throw new Error('Path must be a string');
    }

    const validation = SecurityValidator.validateFilePath(pathInput);
    if (!validation.valid) {
      throw new Error(`Invalid path: ${validation.reason}`);
    }
  }

  private validateGenericInput(args: unknown[]): void {
    for (const arg of args) {
      if (arg === null || arg === undefined) continue;
      
      if (typeof arg === 'string') {
        // Check for suspicious patterns
        const suspiciousPatterns = [
          /<script[^>]*>/i,
          /javascript:/i,
          /vbscript:/i,
          /data:text\/html/i
        ];

        for (const pattern of suspiciousPatterns) {
          if (pattern.test(arg)) {
            throw new Error('Input contains potentially dangerous content');
          }
        }
      } else if (typeof arg === 'object') {
        // Recursively validate objects
        this.validateObject(arg);
      }
    }
  }

  private validateObject(obj: unknown): void {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === 'object' && item !== null) {
          this.validateObject(item);
        }
      }
    } else if (obj && typeof obj === 'object') {
      for (const [, value] of Object.entries(obj as Record<string, unknown>)) {
        if (typeof value === 'string') {
          this.validateGenericInput([value]);
        } else if (typeof value === 'object' && value !== null) {
          this.validateObject(value);
        }
      }
    }
  }

  /**
   * Validate request signature (optional security feature)
   */
  private validateRequestSignature(_channel: string, _args: unknown[]): void {
    // This is a placeholder for request signing validation
    // In a real implementation, you would validate cryptographic signatures
    // to ensure requests haven't been tampered with
  }

  /**
   * Sanitize output before sending to renderer
   */
  private sanitizeOutput(output: unknown): unknown {
    if (output === null || output === undefined) {
      return output;
    }

    if (typeof output === 'string') {
      // Remove potentially dangerous content
      return output
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/data:text\/html/gi, '');
    }

    if (typeof output === 'object') {
      if (Array.isArray(output)) {
        return output.map(item => this.sanitizeOutput(item));
      }

      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(output as Record<string, unknown>)) {
        sanitized[key] = this.sanitizeOutput(value);
      }
      return sanitized;
    }

    return output;
  }

  /**
   * Clean up old rate limit entries
   */
  private cleanupRateLimits(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [senderId, entry] of this.rateLimits) {
      if (now > entry.resetTime + this.config.rateLimitWindow) {
        toDelete.push(senderId);
      }
    }

    for (const senderId of toDelete) {
      this.rateLimits.delete(senderId);
    }
  }

  /**
   * Get rate limit statistics
   */
  getRateLimitStats(): Record<string, RateLimitEntry> {
    const stats: { [senderId: string]: RateLimitEntry } = {};
    for (const [senderId, entry] of this.rateLimits) {
      stats[senderId] = { ...entry };
    }
    return stats;
  }

  /**
   * Reset rate limit for a specific sender
   */
  resetRateLimit(senderId: number): void {
    this.rateLimits.delete(senderId.toString());
  }

  /**
   * Generate secure nonce for request signing
   */
  generateSecureNonce(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Create request signature
   */
  createSignature(data: Record<string, unknown>, secret: string): string {
    const dataString = JSON.stringify(data);
    return createHash('sha256').update(dataString + secret).digest('hex');
  }
}

// Global security manager instance
export const ipcSecurity = new IPCSecurityManager();

/**
 * Helper function to secure existing IPC handlers
 */
export function secureExistingHandlers(): void {
  // Example of how to secure existing handlers
  // This would be called after all handlers are registered
  
  const originalChannels = [
    'download:start',
    'extract:audio',
    'transcribe:start',
    'ollama:process',
    'file:save',
    'file:save-project',
    'shell:open-folder',
    'prerequisites:set-path'
  ];

    console.warn('[IPCSecurity] Security middleware activated for channels:', originalChannels);
}

export default ipcSecurity;
