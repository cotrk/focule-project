/**
 * Enhanced main process integration with security middleware
 * Add this to your existing main.ts file
 */

import { ipcMain, app } from 'electron';
import { ipcSecurity } from './services/ipcSecurity';
import { processPool } from './services/processPool';
import { SecurityValidator } from './services/securityValidator';

// Apply security middleware to existing handlers
function enhanceSecurity() {
  // Wrap existing handlers with security
  const originalHandler = ipcMain.handle;
  
  ipcMain.handle = (channel: string, listener: (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown> | unknown) => {
    // Apply security wrapper to sensitive channels
    const sensitiveChannels = [
      'download:start',
      'file:save', 
      'file:save-project',
      'shell:open-folder',
      'prerequisites:set-path'
    ];
    
    if (sensitiveChannels.includes(channel)) {
      return ipcSecurity.secureHandler(channel, listener);
    }
    
    return originalHandler.call(ipcMain, channel, listener);
  };
  
  console.warn('[Security] Enhanced IPC security activated');
}

// Enhanced download service with process pool
async function enhancedDownloadVideo(url: string, _onProgress?: (progress: unknown) => void): Promise<unknown> {
  // Validate URL first
  const urlValidation = SecurityValidator.validateDownloadUrl(url);
  if (!urlValidation.valid) {
    throw new Error(`Invalid URL: ${urlValidation.reason}`);
  }
  
  // Use process pool for yt-dlp execution
  return processPool.execute('yt-dlp', 'yt-dlp', [url], {
    cwd: app.getPath('temp'),
    timeout: 300000
  });
}

// Initialize security enhancements
enhanceSecurity();

// Graceful shutdown
app.on('before-quit', () => {
  processPool.shutdown();
});

export { enhancedDownloadVideo };
