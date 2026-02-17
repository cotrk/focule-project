import { SessionRecoveryError, ErrorSeverity } from '../utils/errorHandling';
import { RecoveryService } from './RecoveryService';
import { EnhancedErrorRecoveryService } from './EnhancedErrorRecoveryService';
import type { SocialContent } from '../types';

// ============================================================================
// Session Recovery Service
// ============================================================================

export interface SessionState {
  sessionId: string;
  url?: string;
  status: 'downloading' | 'extracting' | 'transcribing' | 'processing' | 'completed' | 'failed' | 'interrupted';
  progress: number;
  startTime: number;
  lastUpdate: number;
  videoPath?: string;
  audioPath?: string;
  transcript?: string;
  socialContent?: SocialContent;
  error?: string;
  metadata?: {
    title?: string;
    duration?: number;
    fileSize?: number;
    quality?: string;
    model?: string;
  };
}

export interface RecoveryOptions {
  maxRecoveryAttempts?: number;
  recoveryTimeout?: number;
  preserveProgress?: boolean;
  skipCompletedSteps?: boolean;
}

export interface RecoveryResult {
  success: boolean;
  sessionState?: SessionState;
  recoveredSteps: string[];
  failedSteps: string[];
  error?: Error;
}

export class SessionRecoveryService {
  private static instance: SessionRecoveryService;
  private recoveryService: RecoveryService;
  private activeSessions: Map<string, SessionState> = new Map();
  private sessionHistory: Map<string, SessionState[]> = new Map();
  private updateLocks: Map<string, Promise<void>> = new Map();

  private constructor() {
    this.recoveryService = RecoveryService.getInstance();
    this.loadPersistedSessions();
  }

  public static getInstance(): SessionRecoveryService {
    if (!SessionRecoveryService.instance) {
      SessionRecoveryService.instance = new SessionRecoveryService();
    }
    return SessionRecoveryService.instance;
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  public createSession(sessionId: string, url?: string): SessionState {
    const session: SessionState = {
      sessionId,
      url,
      status: 'downloading',
      progress: 0,
      startTime: Date.now(),
      lastUpdate: Date.now()
    };

    this.activeSessions.set(sessionId, session);
    this.persistSession(session);
    
    return session;
  }

  public updateSession(sessionId: string, updates: Partial<SessionState>): void {
    this.withLock(sessionId, async () => {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new SessionRecoveryError(
          `Session ${sessionId} not found`,
          { operation: 'update_session', sessionId }
        );
      }

      Object.assign(session, updates, { lastUpdate: Date.now() });
      this.persistSession(session);
    }).catch(error => {
      console.error(`Failed to update session ${sessionId}:`, error);
    });
  }

  private async withLock(
    sessionId: string, 
    operation: () => Promise<void>
  ): Promise<void> {
    // Wait for existing lock to be released
    while (this.updateLocks.has(sessionId)) {
      await this.updateLocks.get(sessionId);
    }

    // Create new lock
    const lockPromise = operation().finally(() => {
      this.updateLocks.delete(sessionId);
    });

    this.updateLocks.set(sessionId, lockPromise);
    return lockPromise;
  }

  public getSession(sessionId: string): SessionState | undefined {
    return this.activeSessions.get(sessionId);
  }

  public getAllSessions(): SessionState[] {
    return Array.from(this.activeSessions.values());
  }

  public completeSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.progress = 100;
      session.lastUpdate = Date.now();
      this.persistSession(session);
      this.archiveSession(session);
    }
  }

  public failSession(sessionId: string, error: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'failed';
      session.error = error;
      session.lastUpdate = Date.now();
      this.persistSession(session);
      this.archiveSession(session);
    }
  }

  public interruptSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'interrupted';
      session.lastUpdate = Date.now();
      this.persistSession(session);
    }
  }

  // ============================================================================
  // Session Recovery
  // ============================================================================

  public async recoverSession(
    sessionId: string,
    options: RecoveryOptions = {}
  ): Promise<RecoveryResult> {
    const {
      maxRecoveryAttempts = 3,
      recoveryTimeout = 300000, // 5 minutes
      preserveProgress = true,
      skipCompletedSteps = true
    } = options;

    const session = this.activeSessions.get(sessionId);
    if (!session) {
      // Try to load from persisted storage
      const persistedSession = this.loadPersistedSession(sessionId);
      if (!persistedSession) {
        return {
          success: false,
          recoveredSteps: [],
          failedSteps: [],
          error: new SessionRecoveryError(
            `Session ${sessionId} not found`,
            { operation: 'recover_session', sessionId }
          )
        };
      }
      
      this.activeSessions.set(sessionId, persistedSession);
      return this.recoverSession(sessionId, options);
    }

    if (session.status === 'completed') {
      return {
        success: true,
        sessionState: session,
        recoveredSteps: [],
        failedSteps: []
      };
    }

    const recoveredSteps: string[] = [];
    const failedSteps: string[] = [];

    try {
      // Mark session as recovering
      session.status = 'downloading'; // Reset to start
      this.updateSession(sessionId, { status: 'downloading' });

      // Recover based on last known state
      const recoveryPlan = await this.createRecoveryPlan(session, skipCompletedSteps);
      
      for (const step of recoveryPlan) {
        try {
          const stepResult = await this.executeRecoveryStep(sessionId, step, preserveProgress);
          if (stepResult.success) {
            recoveredSteps.push(step.name);
            this.updateSession(sessionId, { 
              status: step.nextStatus || session.status,
              progress: step.progress || session.progress
            });
          } else {
            failedSteps.push(step.name);
            if (step.critical) {
              throw stepResult.error || new Error(`Critical step ${step.name} failed`);
            }
          }
        } catch (error) {
          failedSteps.push(step.name);
          if (step.critical) {
            throw error;
          }
        }
      }

      return {
        success: failedSteps.length === 0,
        sessionState: session,
        recoveredSteps,
        failedSteps
      };

    } catch (error) {
      this.failSession(sessionId, error instanceof Error ? error.message : String(error));
      return {
        success: false,
        sessionState: session,
        recoveredSteps,
        failedSteps,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  // ============================================================================
  // Recovery Planning
  // ============================================================================

  private async createRecoveryPlan(
    session: SessionState,
    skipCompleted: boolean
  ): Promise<RecoveryStep[]> {
    const plan: RecoveryStep[] = [];

    // Determine what needs to be recovered based on session state
    if (session.status === 'interrupted' || session.status === 'failed') {
      // Check what was completed and what needs to be redone
      if (!session.videoPath || !(await this.fileExists(session.videoPath))) {
        plan.push({
          name: 'download',
          critical: true,
          progress: 10,
          nextStatus: 'extracting',
          execute: async (sessionId: string) => this.recoverDownload(sessionId)
        });
      }

      if (!session.audioPath || !(await this.fileExists(session.audioPath))) {
        plan.push({
          name: 'extract_audio',
          critical: true,
          progress: 30,
          nextStatus: 'transcribing',
          execute: async (sessionId: string) => this.recoverAudioExtraction(sessionId)
        });
      }

      if (!session.transcript) {
        plan.push({
          name: 'transcribe',
          critical: true,
          progress: 80,
          nextStatus: 'processing',
          execute: async (sessionId: string) => this.recoverTranscription(sessionId)
        });
      }

      if (!session.socialContent) {
        plan.push({
          name: 'process_social_content',
          critical: false, // Non-critical, can be skipped
          progress: 95,
          nextStatus: 'completed',
          execute: async (sessionId: string) => this.recoverSocialContent(sessionId)
        });
      }
    }

    return plan;
  }

  // ============================================================================
  // Recovery Step Execution
  // ============================================================================

  private async executeRecoveryStep(
    sessionId: string,
    step: RecoveryStep,
    preserveProgress: boolean
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      await step.execute(sessionId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  // ============================================================================
  // Specific Recovery Methods
  // ============================================================================

  private async recoverDownload(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session?.url) {
      throw new SessionRecoveryError(
        'Cannot recover download: no URL available',
        { operation: 'recover_download', sessionId }
      );
    }

    // This would integrate with the actual download service
    console.log(`Recovering download for session ${sessionId}`);
    
    // Simulate recovery
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.updateSession(sessionId, {
      videoPath: `/recovered/videos/${sessionId}.mp4`,
      metadata: {
        ...session.metadata,
        title: 'Recovered Video',
        duration: 300
      }
    });
  }

  private async recoverAudioExtraction(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session?.videoPath) {
      throw new SessionRecoveryError(
        'Cannot recover audio extraction: no video available',
        { operation: 'recover_audio', sessionId }
      );
    }

    console.log(`Recovering audio extraction for session ${sessionId}`);
    
    // Simulate recovery
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    this.updateSession(sessionId, {
      audioPath: `/recovered/audio/${sessionId}.wav`
    });
  }

  private async recoverTranscription(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session?.audioPath) {
      throw new SessionRecoveryError(
        'Cannot recover transcription: no audio available',
        { operation: 'recover_transcription', sessionId }
      );
    }

    console.log(`Recovering transcription for session ${sessionId}`);
    
    // Simulate recovery
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    this.updateSession(sessionId, {
      transcript: 'This is a recovered transcript...'
    });
  }

  private async recoverSocialContent(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session?.transcript) {
      throw new SessionRecoveryError(
        'Cannot recover social content: no transcript available',
        { operation: 'recover_social_content', sessionId }
      );
    }

    console.log(`Recovering social content for session ${sessionId}`);
    
    // Simulate recovery
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.updateSession(sessionId, {
      socialContent: {
        hooks: ['Recovered hook 1', 'Recovered hook 2'],
        description: 'Recovered description',
        hashtags: ['#recovered', '#content']
      }
    });
  }

  // ============================================================================
  // Session Persistence
  // ============================================================================

  private persistSession(session: SessionState): void {
    try {
      // This would integrate with actual persistence (localStorage, file system, etc.)
      const key = `session_${session.sessionId}`;
      localStorage.setItem(key, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to persist session:', error);
    }
  }

  private loadPersistedSession(sessionId: string): SessionState | null {
    try {
      const key = `session_${sessionId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load persisted session:', error);
      return null;
    }
  }

  private loadPersistedSessions(): void {
    try {
      // Load all persisted sessions
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('session_')) {
          const sessionId = key.replace('session_', '');
          const session = this.loadPersistedSession(sessionId);
          if (session && session.status !== 'completed' && session.status !== 'failed') {
            this.activeSessions.set(sessionId, session);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted sessions:', error);
    }
  }

  private archiveSession(session: SessionState): void {
    const history = this.sessionHistory.get(session.sessionId) || [];
    history.push(session);
    
    // Keep only last 10 states per session
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
    
    this.sessionHistory.set(session.sessionId, history);
    
    // Remove from active sessions if completed/failed
    if (session.status === 'completed' || session.status === 'failed') {
      this.activeSessions.delete(session.sessionId);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private async fileExists(path: string): Promise<boolean> {
    try {
      // Use Electron API for actual file system checks
      if (window.electronAPI && window.electronAPI.fileExists) {
        return await window.electronAPI.fileExists(path);
      }
      
      // Fallback for non-Electron environments (basic check)
      // This is a simplified fallback - in production, always use Electron API
      return false; // Default to false for safety
    } catch (error) {
      console.warn('Failed to check file existence:', error);
      return false;
    }
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  public getInterruptedSessions(): SessionState[] {
    return this.getAllSessions().filter(session => 
      session.status === 'interrupted' || session.status === 'failed'
    );
  }

  public getSessionHistory(sessionId: string): SessionState[] {
    return this.sessionHistory.get(sessionId) || [];
  }

  public cleanupOldSessions(maxAge: number = 86400000): void { // 24 hours
    const cutoff = Date.now() - maxAge;
    
    this.activeSessions.forEach((session, sessionId) => {
      if (session.lastUpdate < cutoff) {
        this.activeSessions.delete(sessionId);
        try {
          localStorage.removeItem(`session_${sessionId}`);
        } catch (error) {
          console.warn('Failed to cleanup session:', error);
        }
      }
    });
  }

  public getRecoveryStatistics(): {
    totalSessions: number;
    activeSessions: number;
    interruptedSessions: number;
    completedSessions: number;
    averageRecoveryTime: number;
  } {
    const allSessions = this.getAllSessions();
    const interrupted = this.getInterruptedSessions();
    
    return {
      totalSessions: allSessions.length,
      activeSessions: allSessions.filter(s => s.status !== 'completed' && s.status !== 'failed').length,
      interruptedSessions: interrupted.length,
      completedSessions: allSessions.filter(s => s.status === 'completed').length,
      averageRecoveryTime: 0 // Would calculate from actual recovery times
    };
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface RecoveryStep {
  name: string;
  critical: boolean;
  progress?: number;
  nextStatus?: SessionState['status'];
  execute: (sessionId: string) => Promise<void>;
}
