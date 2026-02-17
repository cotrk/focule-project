import { useEffect, useState } from 'react';
import { useTranscription } from './hooks/useTranscription';
import { URLInputRedesigned } from './components/URLInputRedesigned';
import { ProgressBar } from './components/ProgressBar';
import { ResultsViewRedesigned } from './components/ResultsViewRedesigned';
import { SettingsPanel } from './components/SettingsPanel';
import { PrerequisitesCheckRedesigned } from './components/PrerequisitesCheckRedesigned';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ThemeToggle } from './components/ThemeToggle';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorDisplay } from './components/ErrorDisplay';
import { SuccessCelebration } from './components/SuccessCelebration';
import { TranscriptionErrorBoundary } from './components/TranscriptionErrorBoundary';
import { URLInputErrorBoundary } from './components/URLInputErrorBoundary';
import { useKeyboardShortcuts, commonShortcuts } from './hooks/useKeyboardShortcuts';
import { logger } from './utils/logger';

const APP_VERSION = '1.0.0';

function App(): JSX.Element {
  const { state, startTranscription, reset } = useTranscription();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [, setAutoInstallEnabled] = useState(false);
  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...commonShortcuts.escape,
      action: () => {
        if (state.status !== 'idle') {
          reset();
        }
      }
    },
    {
      ...commonShortcuts.n,
      action: () => {
        reset();
      }
    }
  ]);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('focule_onboarding_completed');
    
    if (!hasCompletedOnboarding) {
      // Show onboarding after a short delay for smooth entrance
      setTimeout(() => {
        setShowOnboarding(true);
        logger.info('Starting onboarding flow for new user', 'app');
      }, 1000);
    }
  }, []);

  // State managed by redesigned components
  // const [savedPath, setSavedPath] = useState<string | null>(null);
  // const [lastUrl, setLastUrl] = useState<string>('');

  // Model loading handled by redesigned component
  // useEffect(() => {
  //   if (showRunAgain && window.electronAPI) {
  //     window.electronAPI.getOllamaModels().then((result) => {
  //       if (result.success && result.localModels) {
  //         setAvailableModels(result.localModels);
  //       }
  //     });
  //   }
  // }, [showRunAgain]);

  // Export functionality for ResultsViewRedesigned
  const handleExport = async (): Promise<void> => {
    if (!state.result || !window.electronAPI) {
      logger.warn('Export failed: No result or Electron API unavailable', 'app');
      return;
    }
    
    try {
      // Create export data matching ProjectData interface
      const exportData = {
        transcript: state.result.transcript,
        transcriptWithTimestamps: state.result.transcriptWithTimestamps,
        socialContent: state.result.socialContent,
        metadata: {
          title: state.result.title,
          createdAt: new Date().toISOString(),
          models: {
            whisper: state.result.whisperModel,
            ollama: state.result.ollamaModel,
          },
        }
      };

      // Use exportWithDialog to let user choose location
      await window.electronAPI.exportWithDialog(exportData);
      
      // Show success feedback
      alert('Results exported successfully!');
    } catch (error) {
      logger.error('Export failed', 'app', { error });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Export failed: ${errorMessage}. Please try again.`);
    }
  };

  // Onboarding handlers
  const handleOnboardingComplete = (allowAutoInstall: boolean) => {
    setAutoInstallEnabled(allowAutoInstall);
    setShowOnboarding(false);
    
    // Mark onboarding as completed
    localStorage.setItem('focule_onboarding_completed', 'true');
    localStorage.setItem('focule_auto_install_enabled', allowAutoInstall.toString());
    
    logger.info('Onboarding completed', 'app', {
      autoInstall: allowAutoInstall,
      timestamp: new Date().toISOString()
    });
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    localStorage.setItem('focule_onboarding_completed', 'true');
    
    logger.info('Onboarding skipped', 'app');
  };

  // Folder opening handled by redesigned component
  // const handleOpenFolder = async () => {
  //   if (savedPath && window.electronAPI) {
  //     await window.electronAPI.openFolder(savedPath);
  //   }
  // };

  // Run again handled by redesigned component
  // const handleRunAgain = async () => {
  //   if (!lastUrl || !selectedModel) return;
  //   setShowRunAgain(false);
  //   // Store the model preference and re-run
  //   if (window.electronAPI) {
  //     const settings = await window.electronAPI.getSettings();
  //     await window.electronAPI.setSettings({ ...settings, ollamaModel: selectedModel });
  //   }
  //   setSavedPath(null);
  //   startTranscription(lastUrl);
  // };

  const handleStartOver = (): void => {
    // Reset state for new transcription
    reset();
    setShowSuccess(true);
    setSuccessMessage('Ready for a new video!');
    setTimeout(() => setShowSuccess(false), 2000);
  };

  // Wrap startTranscription to store the URL
  const handleStartTranscription = (url: string): void => {
    startTranscription(url);
  };

  // Prerequisites completion handler (not used - component handles internally)
  // const handlePrerequisitesComplete = (allInstalled: boolean): void => {
  //   // Prerequisites state managed by redesigned component
  //   console.warn('Prerequisites check completed:', allInstalled);
  // };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-focule-bg-primary">
        <SuccessCelebration show={showSuccess} message={successMessage} />
        
        {/* Onboarding Flow */}
        {showOnboarding && (
          <OnboardingFlow 
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        )}
        
        {/* Skip to main content for screen readers */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-focule-primary text-white px-4 py-2 rounded">
          Skip to main content
        </a>
        <main id="main-content" role="main" className="max-w-5xl mx-auto px-6 py-10">
          {/* Prerequisites check - redesigned component handles its own visibility */}
          <PrerequisitesCheckRedesigned />
        {/* Header */}
        <header role="banner" className="flex justify-between items-center mb-12">
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
            <ThemeToggle />
            <button
              onClick={() => {
                // Show prerequisites check when System button clicked
                // This would need to be implemented in the redesigned component
                logger.warn('System check requested', 'app');
              }}
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
          <>
            <URLInputErrorBoundary>
              <section aria-label="Video transcription form">
                <URLInputRedesigned
                  onStart={handleStartTranscription}
                  disabled={false}
                />
              </section>
            </URLInputErrorBoundary>
          </>
        )}

        {(state.status === 'downloading' ||
          state.status === 'extracting' ||
          state.status === 'transcribing' ||
          state.status === 'processing') && (
          <TranscriptionErrorBoundary>
            <section 
              aria-label="Transcription progress"
              aria-live="polite"
              aria-atomic="true"
              className="focule-card rounded-xl p-8 space-y-6 bg-focule-card-bg border border-focule-border"
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">{getStatusEmoji(state.status)}</div>
                <h2 className="text-2xl font-bold text-focule-heading mb-2" style={{ letterSpacing: '-0.03em' }}>
                  {getStatusTitle(state.status)}
                </h2>
                <p className="text-focule-text-secondary">
                  {getStatusDescription(state.status)}
                </p>
              </div>
              <ProgressBar
                label={getStatusLabel(state.status)}
                percent={state.progress}
                status={state.message}
                showTips={true}
              />
              <div className="text-center pt-4 border-t border-focule-border">
                <p className="text-xs text-focule-text-muted mb-3">
                  Your files will be saved to your Downloads folder when complete
                </p>
                <button
                  onClick={reset}
                  className="px-4 py-2 text-sm text-focule-text-muted hover:text-focule-text-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </section>
          </TranscriptionErrorBoundary>
        )}

        {state.status === 'complete' && state.result && (
          <TranscriptionErrorBoundary>
            <section 
              aria-label="Transcription results"
              aria-live="polite"
              aria-atomic="true"
            >
              <ResultsViewRedesigned
                transcript={state.result.transcript}
                transcriptWithTimestamps={state.result.transcriptWithTimestamps}
                socialContent={state.result.socialContent}
                title={state.result.title}
                whisperModel={state.result.whisperModel}
                ollamaModel={state.result.ollamaModel}
                onExport={handleExport}
                onRunAgain={handleStartOver}
                onStartOver={handleStartOver}
                showMarketing={true}
              />
            </section>
          </TranscriptionErrorBoundary>
        )}

        {state.status === 'error' && (
          <section 
            aria-label="Error message"
            aria-live="assertive"
            aria-atomic="true"
          >
            <ErrorDisplay
              error={state.error || 'An unknown error occurred'}
              type="download"
              onRetry={reset}
              onDismiss={reset}
              showDetails={true}
              sessionId={state.result?.videoPath ? 'current-session' : undefined}
              operationId="transcription-operation"
            />
          </section>
        )}

        <footer role="contentinfo" className="mt-16 pt-6 border-t border-focule-border-subtle text-center">
          <p className="text-xs text-focule-text-muted">
            Focule v{APP_VERSION} • Transform video into insight
          </p>
          <p className="text-xs text-focule-text-muted mt-1 opacity-60">
            <a href="mailto:help@focule.com" className="hover:text-focule-primary-light transition-colors">
              help@focule.com
            </a>
          </p>
        </footer>
      </main>
    </div>
    </ErrorBoundary>
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
