/**
 * Security validation service for enhanced desktop security
 * Validates file paths, commands, and inputs to prevent security vulnerabilities
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export class SecurityValidator {
  private static readonly DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.ps1', '.sh', '.py', '.pl', '.rb', '.php', '.asp', '.jsp'
  ];

  private static readonly DANGEROUS_COMMANDS = [
    'del', 'delete', 'rm', 'rmdir', 'format', 'fdisk', 'mkfs',
    'shutdown', 'reboot', 'halt', 'poweroff', 'sudo', 'su',
    'net user', 'net localgroup', 'reg add', 'reg delete'
  ];

  private static readonly ALLOWED_PATHS = [
    app.getPath('userData'),
    app.getPath('downloads'),
    app.getPath('temp'),
    app.getPath('desktop')
  ];

  /**
   * Validate file path is safe and within allowed directories
   */
  static validateFilePath(filePath: string): { valid: boolean; reason?: string } {
    try {
      // Normalize path
      const normalizedPath = path.resolve(filePath);
      
      // Check for path traversal attempts
      if (filePath.includes('..') || filePath.includes('~')) {
        return { valid: false, reason: 'Path contains potentially dangerous traversal' };
      }

      // Check if path is within allowed directories
      const isAllowed = this.ALLOWED_PATHS.some(allowedPath => 
        normalizedPath.startsWith(path.resolve(allowedPath))
      );

      if (!isAllowed) {
        return { valid: false, reason: 'Path is outside of allowed directories' };
      }

      // Check file extension
      const ext = path.extname(normalizedPath).toLowerCase();
      if (this.DANGEROUS_EXTENSIONS.includes(ext)) {
        return { valid: false, reason: `Dangerous file extension: ${ext}` };
      }

      return { valid: true };
    } catch {
      return { valid: false, reason: 'Invalid path format' };
    }
  }

  /**
   * Validate command is safe to execute
   */
  static validateCommand(command: string, args: string[]): { valid: boolean; reason?: string } {
    const fullCommand = `${command} ${args.join(' ')}`.toLowerCase();

    // Check for dangerous commands
    for (const dangerous of this.DANGEROUS_COMMANDS) {
      if (fullCommand.includes(dangerous)) {
        return { valid: false, reason: `Command contains dangerous instruction: ${dangerous}` };
      }
    }

    // Check for shell metacharacters that could lead to injection
    const dangerousChars = ['|', '&', ';', '<', '>', '`', '$', '(', ')', '{', '}'];
    for (const char of dangerousChars) {
      if (fullCommand.includes(char) && !this.isAllowedContext(fullCommand, char)) {
        return { valid: false, reason: `Command contains potentially dangerous character: ${char}` };
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /curl\s+.*http/i,
      /wget\s+.*http/i,
      /powershell.*-enc/i,
      /cmd.*\/c/i,
      /bash.*-c/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fullCommand)) {
        return { valid: false, reason: 'Command matches suspicious pattern' };
      }
    }

    return { valid: true };
  }

  /**
   * Check if a dangerous character is allowed in the current context
   */
  private static isAllowedContext(command: string, char: string): boolean {
    // Allow certain characters in specific contexts
    const allowedContexts = [
      { char: '>', pattern: /ffmpeg.*-i.*>.*\.log/i }, // FFmpeg output redirection
      { char: '<', pattern: /ffmpeg.*-i.*<.*input/i },  // FFmpeg input redirection
      { char: '(', pattern: /python.*-c\s*".*\(.*\)/i }, // Python function calls
      { char: ')', pattern: /python.*-c\s*".*\(.*\)/i }, // Python function calls
    ];

    return allowedContexts.some(ctx => ctx.char === char && ctx.pattern.test(command));
  }

  /**
   * Validate URL is safe for downloading
   */
  static validateDownloadUrl(url: string): { valid: boolean; reason?: string } {
    try {
      const parsedUrl = new URL(url);
      
      // Only allow HTTP/HTTPS
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { valid: false, reason: 'Only HTTP and HTTPS URLs are allowed' };
      }

      // Block private/internal IPs
      const hostname = parsedUrl.hostname;
      if (this.isPrivateIP(hostname)) {
        return { valid: false, reason: 'Private IP addresses are not allowed' };
      }

      // Check for suspicious patterns in URL
      const suspiciousPatterns = [
        /file:\/\//i,
        /ftp:\/\//i,
        /javascript:/i,
        /data:/i,
        /vbscript:/i
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
          return { valid: false, reason: 'URL contains suspicious protocol' };
        }
      }

      return { valid: true };
    } catch {
      return { valid: false, reason: 'Invalid URL format' };
    }
  }

  /**
   * Check if hostname is a private IP
   */
  private static isPrivateIP(hostname: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^localhost$/i,
      /^0\./,
      /^169\.254\./ // Link-local
    ];

    return privateRanges.some(range => range.test(hostname));
  }

  /**
   * Sanitize filename for safe storage
   */
  static sanitizeFilename(filename: string): string {
    // Remove dangerous characters
    let sanitized = filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\.\./g, '_')
      .replace(/^\./, '_') // Don't start with dot
      .replace(/\s+/g, '_')
      .substring(0, 255); // Limit length

    // Ensure it has a safe extension
    const ext = path.extname(sanitized);
    if (this.DANGEROUS_EXTENSIONS.includes(ext.toLowerCase())) {
      sanitized = sanitized.replace(ext, '.txt');
    }

    return sanitized || 'unnamed_file';
  }

  /**
   * Validate content for potential security issues
   */
  static validateContent(content: string, type: 'text' | 'json' | 'script'): { valid: boolean; reason?: string } {
    switch (type) {
      case 'script':
        return this.validateScriptContent(content);
      case 'json':
        return this.validateJsonContent(content);
      case 'text':
      default:
        return this.validateTextContent(content);
    }
  }

  private static validateScriptContent(content: string): { valid: boolean; reason?: string } {
    const dangerousPatterns = [
      /eval\s*\(/i,
      /exec\s*\(/i,
      /system\s*\(/i,
      /subprocess\.(call|run|Popen)/i,
      /os\.system/i,
      /require\s*\(\s*['"`]child_process['"`]/i,
      /import\s+subprocess/i,
      /__import__\s*\(/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return { valid: false, reason: 'Script contains potentially dangerous function calls' };
      }
    }

    return { valid: true };
  }

  private static validateJsonContent(content: string): { valid: boolean; reason?: string } {
    try {
      JSON.parse(content);
      return { valid: true };
    } catch {
      return { valid: false, reason: 'Invalid JSON format' };
    }
  }

  private static validateTextContent(content: string): { valid: boolean; reason?: string } {
    // Check for extremely long content that might cause issues
    if (content.length > 10 * 1024 * 1024) { // 10MB
      return { valid: false, reason: 'Content too large' };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /data:text\/html/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return { valid: false, reason: 'Text contains potentially dangerous content' };
      }
    }

    return { valid: true };
  }

  /**
   * Create secure temporary directory
   */
  static createSecureTempDir(prefix: string = 'focule'): string {
    const tempDir = path.join(app.getPath('temp'), `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    try {
      fs.mkdirSync(tempDir, { recursive: true, mode: 0o700 }); // Restricted permissions
      return tempDir;
    } catch {
      throw new Error(`Failed to create secure temp directory`);
    }
  }

  /**
   * Securely remove directory and contents
   */
  static secureRemove(dirPath: string): void {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch {
      console.warn(`Failed to securely remove directory ${dirPath}`);
    }
  }
}

export default SecurityValidator;
