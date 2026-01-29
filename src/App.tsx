import { useState, useEffect } from 'react';
import { useTranscription } from './hooks/useTranscription';
import { URLInput } from './components/URLInput';
import { ProgressBar } from './components/ProgressBar';
import { ResultsView } from './components/ResultsView';
import { SettingsPanel } from './components/SettingsPanel';
import { PrerequisitesCheck } from './components/PrerequisitesCheck';

const APP_VERSION = '1.0.0';

function App() {
  const { state, startTranscription, reset } = useTranscription();
  const [showPrerequisites, setShowPrerequisites] = useState(true);
  const [prerequisitesOk, setPrerequisitesOk] = useState(false);
  const [skipPrerequisites, setSkipPrerequisites] = useState(false);

  useEffect(() => {
    // Check if user has previously skipped prerequisites check
    const skipped = localStorage.getItem('skipPrerequisitesCheck');
    if (skipped === 'true') {
      setShowPrerequisites(false);
      setSkipPrerequisites(true);
    }
  }, []);

  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showRunAgain, setShowRunAgain] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [lastUrl, setLastUrl] = useState<string>('');

  // Load available models when showing Run Again
  useEffect(() => {
    if (showRunAgain && window.electronAPI) {
      window.electronAPI.getOllamaModels().then((result: any) => {
        if (result.success && result.localModels) {
          setAvailableModels(result.localModels);
        }
      });
    }
  }, [showRunAgain]);

  const handleExport = async () => {
    if (!state.result || !window.electronAPI) return;

    setExporting(true);
    try {
      const result = await window.electronAPI.exportWithDialog({
        title: state.result.title,
        transcript: state.result.transcript,
        transcriptWithTimestamps: state.result.transcriptWithTimestamps,
        socialContent: state.result.socialContent,
        videoPath: state.result.videoPath,
        audioPath: state.result.audioPath,
      });

      if (result.canceled) {
        // User cancelled, do nothing
      } else if (result.success && result.path) {
        setSavedPath(result.path);
      } else {
        alert(`Error exporting files: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error exporting files: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleOpenFolder = async () => {
    if (savedPath && window.electronAPI) {
      await window.electronAPI.openFolder(savedPath);
    }
  };

  const handleRunAgain = async () => {
    if (!lastUrl || !selectedModel) return;
    setShowRunAgain(false);
    // Store the model preference and re-run
    if (window.electronAPI) {
      const settings = await window.electronAPI.getSettings();
      await window.electronAPI.setSettings({ ...settings, ollamaModel: selectedModel });
    }
    setSavedPath(null);
    startTranscription(lastUrl);
  };

  const handleStartOver = () => {
    setSavedPath(null);
    setLastUrl('');
    reset();
  };

  // Wrap startTranscription to store the URL
  const handleStartTranscription = (url: string) => {
    setLastUrl(url);
    setSavedPath(null);
    startTranscription(url);
  };

  const handlePrerequisitesComplete = (allInstalled: boolean) => {
    setPrerequisitesOk(allInstalled);
    // Don't auto-proceed - let user review and click "Looks Good"
  };

  const handleSkipPrerequisites = () => {
    setShowPrerequisites(false);
    setSkipPrerequisites(true);
    localStorage.setItem('skipPrerequisitesCheck', 'true');
  };

  if (showPrerequisites) {
    return (
      <div className="min-h-screen focule-bg">
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <span className="focule-logo text-3xl focule-text-gradient">FOCULE</span>
              <span className="text-sm text-[var(--focule-text-muted)]">System Check</span>
            </div>
            <button
              onClick={handleSkipPrerequisites}
              className="text-sm text-[var(--focule-text-muted)] hover:text-[var(--focule-text-secondary)]"
            >
              Skip for now
            </button>
          </div>
          <PrerequisitesCheck onComplete={handlePrerequisitesComplete} />
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => setShowPrerequisites(false)}
              disabled={!prerequisitesOk}
              className={`px-8 py-3 rounded-lg font-medium ${
                prerequisitesOk 
                  ? 'focule-btn' 
                  : 'bg-[var(--focule-bg-secondary)] text-[var(--focule-text-muted)] cursor-not-allowed'
              }`}
            >
              Looks Good →
            </button>
          </div>
          {!prerequisitesOk && (
            <p className="text-center text-sm text-[var(--focule-text-muted)] mt-4">
              Please install all required prerequisites to continue
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen focule-bg">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.png" 
              alt="Focule" 
              className="h-10 w-auto"
              onError={(e) => {
                // Fallback to text if image doesn't load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex-col">
              <h1 className="focule-brand-text text-2xl" style={{ letterSpacing: '-0.02em' }}>
                <span className="focule-brand-f text-3xl">F</span>
                <span className="focule-brand-ocule">OCULE</span>
              </h1>
            </div>
            <p className="text-[13px] text-[var(--focule-text-muted)] font-nunito border-l border-[var(--focule-border)] pl-4" style={{ letterSpacing: '0.02em' }}>
              Transform video into insight
            </p>
          </div>
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setShowPrerequisites(true)}
              className="px-3 py-2 text-sm focule-btn-secondary rounded-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              System
            </button>
            <SettingsPanel />
          </nav>
        </header>

        {state.status === 'idle' && (
          <div className="focule-card rounded-xl p-6">
            <URLInput
              onStart={handleStartTranscription}
              disabled={false}
            />
          </div>
        )}

        {(state.status === 'downloading' ||
          state.status === 'extracting' ||
          state.status === 'transcribing' ||
          state.status === 'processing') && (
          <div className="focule-card rounded-xl p-8 space-y-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">{getStatusEmoji(state.status)}</div>
              <h2 className="text-2xl font-bold text-[var(--focule-heading)] mb-2" style={{ letterSpacing: '-0.03em' }}>
                {getStatusTitle(state.status)}
              </h2>
              <p className="text-[var(--focule-text-secondary)]">
                {getStatusDescription(state.status)}
              </p>
            </div>
            <ProgressBar
              label={getStatusLabel(state.status)}
              percent={state.progress}
              status={state.message}
            />
            <div className="text-center pt-4 border-t border-[var(--focule-border)]">
              <p className="text-xs text-[var(--focule-text-muted)] mb-3">
                Your files will be saved to your Downloads folder when complete
              </p>
              <button
                onClick={reset}
                className="px-4 py-2 text-sm text-[var(--focule-text-muted)] hover:text-[var(--focule-text-secondary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {state.status === 'complete' && state.result && (
          <div className="space-y-6">
            <div className="focule-card rounded-xl p-4 border-l-4 border-[var(--focule-primary)]">
              <p className="text-[var(--focule-primary-light)] font-medium">
                🎉 Transcription complete! Your content is ready.
              </p>
            </div>
            <ResultsView
              transcript={state.result.transcript}
              transcriptWithTimestamps={state.result.transcriptWithTimestamps}
              socialContent={state.result.socialContent}
              savedPath={savedPath}
              ollamaModel={state.result.ollamaModel}
              whisperModel={state.result.whisperModel}
            />
            
            {/* Action Buttons */}
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={handleExport}
                disabled={exporting}
                className={`px-6 py-2.5 rounded-lg ${
                  exporting 
                    ? 'bg-gray-600 text-gray-300 cursor-wait' 
                    : 'focule-btn'
                }`}
              >
                {exporting ? '⏳ Exporting...' : '💾 Export Results'}
              </button>
              
              <button
                onClick={() => setShowRunAgain(true)}
                className="px-6 py-2.5 focule-btn-secondary rounded-lg"
              >
                🔄 Run Again
              </button>
              
              {savedPath && (
                <button
                  onClick={handleOpenFolder}
                  className="px-6 py-2.5 focule-btn-secondary rounded-lg"
                >
                  📂 Open Folder
                </button>
              )}
              
              <button
                onClick={handleStartOver}
                className="text-[var(--focule-text-muted)] hover:text-[var(--focule-primary-light)] underline text-sm ml-auto"
              >
                Start Over
              </button>
            </div>

            {/* Run Again Modal */}
            {showRunAgain && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="focule-card rounded-xl p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold text-[var(--focule-heading)] mb-4">
                    Run Again with Different Model
                  </h3>
                  <p className="text-sm text-[var(--focule-text-secondary)] mb-4">
                    Select a model to regenerate the results:
                  </p>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[var(--focule-bg-secondary)] border border-[var(--focule-border)] text-[var(--focule-text-primary)] mb-4"
                  >
                    <option value="">Select a model...</option>
                    {availableModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRunAgain}
                      disabled={!selectedModel}
                      className={`flex-1 px-4 py-2 rounded-lg ${
                        selectedModel ? 'focule-btn' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Run Again
                    </button>
                    <button
                      onClick={() => setShowRunAgain(false)}
                      className="px-4 py-2 focule-btn-secondary rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {state.status === 'error' && (
          <div className="focule-card rounded-xl p-6 border-l-4 border-red-500">
            <h2 className="text-xl font-semibold text-red-400 mb-2" style={{ letterSpacing: '-0.02em' }}>Error</h2>
            <p className="text-[var(--focule-text-secondary)] mb-4">{state.error || 'An unknown error occurred'}</p>
            <button
              onClick={reset}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-[var(--focule-border-subtle)] text-center">
          <p className="text-xs text-[var(--focule-text-muted)]">
            Focule v{APP_VERSION} • Transform video into insight
          </p>
          <p className="text-xs text-[var(--focule-text-muted)] mt-1 opacity-60">
            <a href="mailto:help@focule.com" className="hover:text-[var(--focule-primary-light)] transition-colors">
              help@focule.com
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'downloading':
      return 'Downloading Video';
    case 'extracting':
      return 'Extracting Audio';
    case 'transcribing':
      return 'Transcribing Audio';
    case 'processing':
      return 'Creating Content';
    default:
      return 'Processing';
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'downloading':
      return '📥';
    case 'extracting':
      return '🎵';
    case 'transcribing':
      return '✍️';
    case 'processing':
      return '🧠';
    default:
      return '⚡';
  }
}

function getStatusTitle(status: string): string {
  switch (status) {
    case 'downloading':
      return 'Fetching Video';
    case 'extracting':
      return 'Preparing Audio';
    case 'transcribing':
      return 'Transcribing';
    case 'processing':
      return 'Creating Content';
    default:
      return 'Processing';
  }
}

function getStatusDescription(status: string): string {
  switch (status) {
    case 'downloading':
      return 'Sit tight! Fetching your video from the source...';
    case 'extracting':
      return 'Preparing audio for voice recognition...';
    case 'transcribing':
      return 'Converting speech to text...';
    case 'processing':
      return 'AI is crafting hooks, descriptions, and hashtags...';
    default:
      return 'Working on it...';
  }
}

export default App;
