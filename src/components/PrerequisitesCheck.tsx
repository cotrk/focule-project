import { useState, useEffect } from 'react';

interface PrerequisiteStatus {
  name: string;
  installed: boolean;
  version?: string;
  path?: string;
  customPath?: string;
  downloadUrl?: string;
  installCommand?: string;
  checkCommand?: string;
  category: 'required' | 'optional';
  note?: string;
}

interface PrerequisitesCheckProps {
  onComplete?: (allInstalled: boolean) => void;
}

// Minimal flat icons
const Icons = {
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  folder: (
    <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  terminal: (
    <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
};

export function PrerequisitesCheck({ onComplete }: PrerequisitesCheckProps) {
  const [prerequisites, setPrerequisites] = useState<PrerequisiteStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [allInstalled, setAllInstalled] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkPrerequisites();
    loadCustomPaths();
  }, []);

  const loadCustomPaths = async () => {
    if (!window.electronAPI?.prerequisites) return;
    
    try {
      const settings = await window.electronAPI.getSettings();
      if (settings.customPaths) {
        for (const [toolName, toolPath] of Object.entries(settings.customPaths)) {
          await window.electronAPI.prerequisites.setPath(toolName, toolPath as string);
        }
      }
    } catch (error) {
      console.error('Failed to load custom paths:', error);
    }
  };

  const checkPrerequisites = async () => {
    if (!window.electronAPI?.prerequisites) {
      setLoading(false);
      setPrerequisites([
        { name: 'Runtime Environment', installed: true, version: 'v20.x', category: 'required' },
        { name: 'Script Engine', installed: true, version: '3.11', category: 'required' },
        { name: 'Media Processor', installed: false, category: 'required', downloadUrl: 'https://ffmpeg.org/download.html' },
        { name: 'Video Downloader', installed: false, category: 'required', downloadUrl: 'https://github.com/yt-dlp/yt-dlp', installCommand: 'pip install yt-dlp' },
        { name: 'Voice Recognition', installed: false, category: 'required', installCommand: 'pip install openai-whisper' },
        { name: 'AI Engine', installed: false, category: 'required', downloadUrl: 'https://ollama.ai/' },
      ]);
      setAllInstalled(false);
      onComplete?.(false);
      return;
    }
    
    setLoading(true);
    setChecking(true);
    try {
      const result = await window.electronAPI.prerequisites.check();
      if (result.success) {
        setPrerequisites(result.prerequisites || []);
        setAllInstalled(result.allRequiredInstalled || false);
        onComplete?.(result.allRequiredInstalled || false);
      }
    } catch (error) {
      console.error('Failed to check prerequisites:', error);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  const handleBrowsePath = async (toolName: string) => {
    if (!window.electronAPI?.prerequisites) return;
    
    try {
      const result = await window.electronAPI.prerequisites.browsePath(toolName);
      if (result.success && result.path) {
        await checkPrerequisites();
      }
    } catch (error) {
      console.error('Failed to browse path:', error);
    }
  };

  if (loading && !checking) {
    return (
      <div className="focule-card rounded-2xl p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--focule-border)] border-t-[var(--focule-primary)]"></div>
          <span className="mt-4 text-[var(--focule-text-secondary)] text-sm">Checking system requirements...</span>
        </div>
      </div>
    );
  }

  const installedCount = prerequisites.filter(p => p.installed && p.category === 'required').length;
  const requiredCount = prerequisites.filter(p => p.category === 'required').length;

  return (
    <div className="focule-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[var(--focule-border)]">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-[var(--focule-heading)]" style={{ letterSpacing: '-0.02em' }}>
              System Requirements
            </h2>
            <p className="text-sm text-[var(--focule-text-muted)] mt-1">
              {installedCount} of {requiredCount} required components ready
            </p>
          </div>
          <button
            onClick={checkPrerequisites}
            disabled={checking}
            className={`p-2.5 rounded-lg focule-btn-secondary flex items-center gap-2 text-sm ${checking ? 'opacity-50' : ''}`}
          >
            <span className={checking ? 'animate-spin' : ''}>{Icons.refresh}</span>
            Recheck
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-[var(--focule-bg-secondary)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[var(--focule-primary)] to-[var(--focule-accent)] transition-all duration-500"
            style={{ width: `${(installedCount / requiredCount) * 100}%` }}
          />
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-[var(--focule-border-subtle)]">
        {prerequisites.map((prereq) => (
          <div
            key={prereq.name}
            className="p-4 flex items-center gap-4 hover:bg-[var(--focule-bg-secondary)]/50 transition-colors"
          >
            {/* Status Icon */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              prereq.installed 
                ? 'bg-green-500/10 text-green-400' 
                : 'bg-red-500/10 text-red-400'
            }`}>
              {prereq.installed ? Icons.check : Icons.x}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--focule-text-primary)]">{prereq.name}</span>
                {prereq.category === 'required' && !prereq.installed && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded font-medium uppercase tracking-wide">
                    Required
                  </span>
                )}
              </div>
              {prereq.installed ? (
                <div className="flex items-center gap-3 mt-0.5">
                  {prereq.version && (
                    <span className="text-xs text-[var(--focule-text-muted)]">{prereq.version}</span>
                  )}
                  {prereq.path && prereq.path !== prereq.name.toLowerCase() && (
                    <span className="text-xs text-[var(--focule-text-muted)] truncate max-w-[200px] flex items-center gap-1" title={prereq.path}>
                      {Icons.folder} {prereq.path.split(/[/\\]/).pop()}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-[var(--focule-text-muted)]">Not installed</span>
              )}
            </div>

            {/* Actions */}
            {!prereq.installed && (
              <div className="flex items-center gap-2">
                {(prereq.name === 'Media Processor' || prereq.name === 'Video Downloader') && (
                  <button
                    onClick={() => handleBrowsePath(prereq.name)}
                    className="px-3 py-1.5 text-xs focule-btn-secondary rounded-lg flex items-center gap-1.5"
                  >
                    {Icons.folder}
                    Locate
                  </button>
                )}
                {prereq.downloadUrl && (
                  <a
                    href={prereq.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs focule-btn rounded-lg flex items-center gap-1.5"
                  >
                    {Icons.download}
                    Download
                  </a>
                )}
                {prereq.installCommand && !prereq.downloadUrl && (
                  <code className="px-2 py-1 text-xs bg-[var(--focule-bg-secondary)] text-[var(--focule-primary-light)] rounded font-mono">
                    {prereq.installCommand}
                  </code>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {allInstalled ? (
        <div className="p-4 bg-green-500/5 border-t border-green-500/20">
          <p className="text-sm text-green-400 flex items-center gap-2">
            {Icons.check}
            All system requirements met. You're ready to go!
          </p>
        </div>
      ) : (
        <div className="p-4 bg-[var(--focule-bg-secondary)] border-t border-[var(--focule-border)]">
          <p className="text-xs text-[var(--focule-text-muted)]">
            Install the missing components above to use all features
          </p>
        </div>
      )}
    </div>
  );
}
