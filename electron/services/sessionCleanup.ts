/**
 * Session cleanup service for managing temporary directories and preventing contamination
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

interface SessionInfo {
  sessionId: string;
  createdAt: number;
  lastAccessed: number;
  isComplete: boolean;
}

const SESSION_REGISTRY_FILE = path.join(app.getPath('userData'), 'session_registry.json');
const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
const MAX_INCOMPLETE_SESSION_AGE = 2 * 60 * 60 * 1000; // 2 hours for incomplete sessions

/**
 * Load session registry from disk
 */
function loadSessionRegistry(): Map<string, SessionInfo> {
  try {
    if (fs.existsSync(SESSION_REGISTRY_FILE)) {
      const data = fs.readFileSync(SESSION_REGISTRY_FILE, 'utf-8');
      const sessions = JSON.parse(data);
      return new Map(Object.entries(sessions));
    }
  } catch (error) {
    console.warn('[SessionCleanup] Failed to load session registry:', error);
  }
  return new Map();
}

/**
 * Save session registry to disk
 */
function saveSessionRegistry(registry: Map<string, SessionInfo>): void {
  try {
    const data = Object.fromEntries(registry);
    fs.writeFileSync(SESSION_REGISTRY_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn('[SessionCleanup] Failed to save session registry:', error);
  }
}

/**
 * Register a new session
 */
export function registerSession(sessionId: string): void {
  const registry = loadSessionRegistry();
  const now = Date.now();
  
  registry.set(sessionId, {
    sessionId,
    createdAt: now,
    lastAccessed: now,
    isComplete: false,
  });
  
  saveSessionRegistry(registry);
}

/**
 * Mark session as complete (can be kept longer)
 */
export function completeSession(sessionId: string): void {
  const registry = loadSessionRegistry();
  const session = registry.get(sessionId);
  
  if (session) {
    session.isComplete = true;
    session.lastAccessed = Date.now();
    saveSessionRegistry(registry);
  }
}

/**
 * Update session access time
 */
export function touchSession(sessionId: string): void {
  const registry = loadSessionRegistry();
  const session = registry.get(sessionId);
  
  if (session) {
    session.lastAccessed = Date.now();
    saveSessionRegistry(registry);
  }
}

/**
 * Remove a specific session and all its files
 */
export function removeSession(sessionId: string): void {
  const registry = loadSessionRegistry();
  const sessionDir = path.join(app.getPath('userData'), 'sessions', sessionId);
  
  // Remove session directory
  if (fs.existsSync(sessionDir)) {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log(`[SessionCleanup] Removed session directory: ${sessionId}`);
    } catch (error) {
      console.warn(`[SessionCleanup] Failed to remove session directory ${sessionId}:`, error);
    }
  }
  
  // Remove from registry
  registry.delete(sessionId);
  saveSessionRegistry(registry);
}

/**
 * Clean up old sessions
 */
export function cleanupOldSessions(): void {
  const registry = loadSessionRegistry();
  const now = Date.now();
  const sessionsToRemove: string[] = [];
  
  for (const [sessionId, session] of registry) {
    const age = now - session.createdAt;
    const maxAge = session.isComplete ? MAX_SESSION_AGE : MAX_INCOMPLETE_SESSION_AGE;
    
    if (age > maxAge) {
      sessionsToRemove.push(sessionId);
    }
  }
  
  // Remove old sessions
  for (const sessionId of sessionsToRemove) {
    removeSession(sessionId);
  }
  
  if (sessionsToRemove.length > 0) {
    console.log(`[SessionCleanup] Cleaned up ${sessionsToRemove.length} old sessions`);
  }
}

/**
 * Get session information
 */
export function getSessionInfo(sessionId: string): SessionInfo | null {
  const registry = loadSessionRegistry();
  return registry.get(sessionId) || null;
}

/**
 * List all active sessions
 */
export function listActiveSessions(): SessionInfo[] {
  const registry = loadSessionRegistry();
  return Array.from(registry.values());
}

// Run cleanup on service import
cleanupOldSessions();
