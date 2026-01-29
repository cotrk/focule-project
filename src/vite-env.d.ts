/// <reference types="vite/client" />

// Re-export the type-safe Electron API
import type { ElectronAPI } from './types/electron';

interface Window {
  electronAPI: ElectronAPI;
}

