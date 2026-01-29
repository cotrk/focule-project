import { useState, useEffect } from 'react';

interface Settings {
  outputPath: string;
  whisperModel: string;
  ollamaModel: string;
}

interface StarterModel {
  name: string;
  tier: 'lightweight' | 'balanced' | 'performance';
  paramRange: string;
  vram: string;
  description: string;
  url: string;
}

// Whisper models with user-friendly display names
const WHISPER_MODELS = [
  { id: 'tiny', name: 'Fast', description: 'Quickest, basic accuracy' },
  { id: 'base', name: 'Balanced', description: 'Recommended for most videos' },
  { id: 'small', name: 'Accurate', description: 'Better accuracy, slower' },
  { id: 'medium', name: 'High Quality', description: 'High accuracy, requires more RAM' },
  { id: 'large', name: 'Maximum', description: 'Best accuracy, slowest' },
];

const TIER_INFO = {
  lightweight: { label: 'Fast', range: 'Quick results', color: 'text-[#00F0FF]', bg: 'bg-[#00F0FF]/10' },
  balanced: { label: 'Recommended', range: 'Best balance', color: 'text-[#00F0FF]', bg: 'bg-[#00F0FF]/10' },
  performance: { label: 'Premium', range: 'Highest quality', color: 'text-[#BD00FF]', bg: 'bg-[#BD00FF]/10' },
};

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>({
    outputPath: '',
    whisperModel: 'base',
    ollamaModel: 'llama3',
  });
  const [isOpen, setIsOpen] = useState(false);
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [categorized, setCategorized] = useState<{
    lightweight: string[];
    balanced: string[];
    performance: string[];
  }>({ lightweight: [], balanced: [], performance: [] });
  const [recommendedFromInstalled, setRecommendedFromInstalled] = useState<string[]>([]);
  const [starterRecommendations, setStarterRecommendations] = useState<StarterModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  useEffect(() => {
    loadSettings();
    loadOllamaModels();
  }, []);

  const loadSettings = async () => {
    if (!window.electronAPI) {
      setLoadingModels(false);
      return;
    }
    const loaded = await window.electronAPI.getSettings();
    setSettings({
      outputPath: loaded.outputPath || '',
      whisperModel: loaded.whisperModel || 'base',
      ollamaModel: loaded.ollamaModel || 'llama3',
    });
  };

  const loadOllamaModels = async () => {
    if (!window.electronAPI) {
      setLoadingModels(false);
      setStarterRecommendations([
        { name: 'llama3.2:3b', tier: 'lightweight', paramRange: 'Under 8B', vram: '4-6 GB', description: 'Fast and efficient. Great for quick processing.', url: 'https://ollama.com/library/llama3.2' },
        { name: 'mistral-nemo:12b', tier: 'balanced', paramRange: '8B - 20B', vram: '8-16 GB', description: 'Best balance of quality and speed.', url: 'https://ollama.com/library/mistral-nemo' },
        { name: 'qwen2.5:32b', tier: 'performance', paramRange: '20B+', vram: '24-32 GB', description: 'Professional-grade results.', url: 'https://ollama.com/library/qwen2.5:32b' },
      ]);
      return;
    }
    
    setLoadingModels(true);
    try {
      const result = await window.electronAPI.getOllamaModels();
      if (result.success) {
        setLocalModels(result.localModels || []);
        setCategorized(result.categorized || { lightweight: [], balanced: [], performance: [] });
        setRecommendedFromInstalled(result.recommendedFromInstalled || []);
        setStarterRecommendations(result.starterRecommendations || []);
      }
    } catch (error) {
      console.error('Failed to load Ollama models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleChange = (key: keyof Settings, value: string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    // Don't save immediately - wait for user to click Save
  };

  // Handler for saving settings
  const handleSave = async () => {
    try {
      await window.electronAPI?.setSettings(settings);
      alert('✅ Settings saved successfully!');
      setIsOpen(false); // Close settings panel after successful save
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('❌ Failed to save settings. Please try again.\n\nPossible causes:\n- File permission issues\n- Invalid export directory path\n- Network connection issues\n\nSolution: Check your export directory path and try again.');
    }
  };

  const getTierForModel = (model: string): 'lightweight' | 'balanced' | 'performance' | null => {
    if (categorized.lightweight.includes(model)) return 'lightweight';
    if (categorized.balanced.includes(model)) return 'balanced';
    if (categorized.performance.includes(model)) return 'performance';
    return null;
  };

  // Handler for browsing export directory
  const handleBrowseExportDirectory = async () => {
    if (!window.electronAPI?.prerequisites?.browsePath) {
      alert('Directory browsing not available');
      return;
    }

    try {
      const path = await window.electronAPI.prerequisites.browsePath('export-directory');
      if (path) {
        handleChange('outputPath', path);
      }
    } catch (error) {
      console.error('Failed to browse directory:', error);
      alert('Failed to browse directory');
    }
  };

  // Handler for opening backup directory
  const handleOpenBackupDirectory = async () => {
    const backupPath = settings.outputPath || 
      (await window.electronAPI?.getSettings())?.outputPath || 
      require('os').homedir() + '/Downloads/Focule-Backups';

    if (!window.electronAPI?.openFolder) {
      alert('Cannot open folder: ElectronAPI not available');
      return;
    }

    try {
      await window.electronAPI.openFolder(backupPath);
    } catch (error) {
      console.error('Failed to open backup directory:', error);
      alert('Failed to open backup directory');
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadOllamaModels();
        }}
        className="px-4 py-2 text-sm focule-btn-secondary rounded-lg flex items-center gap-2"
      >
        <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Settings
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="focule-card rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-[var(--focule-border)]">
              <h2 className="text-xl font-semibold text-[var(--focule-heading)]" style={{ letterSpacing: '-0.03em' }}>
                Settings
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-[var(--focule-bg-secondary)] flex items-center justify-center text-[var(--focule-text-muted)] hover:text-[var(--focule-text-primary)] transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Output Settings */}
              <section>
                <h3 className="text-xs font-semibold text-[var(--focule-text-muted)] uppercase tracking-wider mb-4">
                  Output Settings
                </h3>
                <div>
                  <label className="block text-sm font-medium text-[var(--focule-text-primary)] mb-2">
                    Export Directory
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.outputPath}
                      onChange={(e) => handleChange('outputPath', e.target.value)}
                      placeholder="Default: Downloads folder"
                      className="flex-1 px-4 py-3 focule-input rounded-lg text-sm"
                    />
                    <button
                      onClick={handleBrowseExportDirectory}
                      className="px-4 py-3 bg-[var(--focule-bg-primary)] border border-[var(--focule-border)] rounded-lg hover:bg-[var(--focule-bg-secondary)] transition-colors"
                      title="Browse for export directory"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-[var(--focule-text-muted)]">
                    Default location for automatic result backups. Results are also saved here as a fail-safe.
                  </p>
                  <div className="mt-2">
                    <button
                      onClick={handleOpenBackupDirectory}
                      className="text-xs text-[var(--focule-primary)] hover:text-[var(--focule-primary-hover)] transition-colors"
                    >
                      📁 Open Result Backups Folder
                    </button>
                  </div>
                </div>
              </section>

              {/* AI Content Engine Selection */}
              <section>
                <h3 className="text-xs font-semibold text-[var(--focule-text-muted)] uppercase tracking-wider mb-4">
                  AI Content Engine
                </h3>
                <div>
                  <label className="block text-sm font-medium text-[var(--focule-text-primary)] mb-2">
                    Select AI Model
                  </label>
                  {loadingModels ? (
                    <div className="text-sm text-[var(--focule-text-muted)] py-3">Loading models...</div>
                  ) : localModels.length > 0 ? (
                    <>
                      <select
                        value={settings.ollamaModel}
                        onChange={(e) => handleChange('ollamaModel', e.target.value)}
                        className="w-full px-4 py-3 focule-input rounded-lg text-sm"
                      >
                        {localModels.map((model) => {
                          const tier = getTierForModel(model);
                          const isRecommended = recommendedFromInstalled.includes(model);
                          return (
                            <option key={model} value={model}>
                              {model} {isRecommended && '★'} {tier && `(${TIER_INFO[tier].range})`}
                            </option>
                          );
                        })}
                      </select>
                      
                      {/* Show categorized recommendations */}
                      {recommendedFromInstalled.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-medium text-[var(--focule-text-secondary)]">
                            Recommended from your installed models:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {recommendedFromInstalled.map((model) => {
                              const tier = getTierForModel(model);
                              return (
                                <button
                                  key={model}
                                  onClick={() => handleChange('ollamaModel', model)}
                                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                    settings.ollamaModel === model
                                      ? 'border-[var(--focule-primary)] bg-[var(--focule-primary)]/10 text-[var(--focule-primary-light)]'
                                      : 'border-[var(--focule-border)] hover:border-[var(--focule-text-muted)]'
                                  }`}
                                >
                                  <span className="font-medium">{model}</span>
                                  {tier && (
                                    <span className={`ml-1.5 ${TIER_INFO[tier].color}`}>
                                      {TIER_INFO[tier].label}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tier legend */}
                      <div className="mt-4 p-3 rounded-lg bg-[var(--focule-bg-secondary)] border border-[var(--focule-border-subtle)]">
                        <p className="text-xs text-[var(--focule-text-muted)] mb-2">Quality Tiers:</p>
                        <div className="flex flex-wrap gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            <span className="text-green-400">Fast</span>
                            <span className="text-[var(--focule-text-muted)]">Quick results</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            <span className="text-blue-400">Recommended</span>
                            <span className="text-[var(--focule-text-muted)]">Best balance</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                            <span className="text-purple-400">Premium</span>
                            <span className="text-[var(--focule-text-muted)]">Highest quality</span>
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                        <p className="text-sm text-yellow-400/80 mb-3">
                          No AI models installed yet
                        </p>
                        <p className="text-xs text-[var(--focule-text-muted)]">
                          Get started by installing one of these recommended models:
                        </p>
                      </div>

                      {/* Starter recommendations by tier */}
                      <div className="space-y-3">
                        {(['lightweight', 'balanced', 'performance'] as const).map((tier) => {
                          const tierModels = starterRecommendations.filter(m => m.tier === tier);
                          if (tierModels.length === 0) return null;
                          
                          return (
                            <div key={tier} className={`p-4 rounded-xl ${TIER_INFO[tier].bg} border border-[var(--focule-border-subtle)]`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${tier === 'lightweight' ? 'bg-green-400' : tier === 'balanced' ? 'bg-blue-400' : 'bg-purple-400'}`}></span>
                                <span className={`text-sm font-medium ${TIER_INFO[tier].color}`}>
                                  {TIER_INFO[tier].label}
                                </span>
                                <span className="text-xs text-[var(--focule-text-muted)]">
                                  ({TIER_INFO[tier].range} • {tierModels[0]?.vram} VRAM)
                                </span>
                              </div>
                              {tierModels.map((model) => (
                                <div key={model.name} className="mt-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-[var(--focule-text-primary)]">
                                      {model.name}
                                    </span>
                                    <a
                                      href={model.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-[var(--focule-primary-light)] hover:underline"
                                    >
                                      View →
                                    </a>
                                  </div>
                                  <p className="text-xs text-[var(--focule-text-muted)] mt-1">
                                    {model.description}
                                  </p>
                                  <code className="block mt-2 text-xs bg-[var(--focule-bg-primary)] text-[var(--focule-text-secondary)] px-2 py-1 rounded">
                                    ollama pull {model.name}
                                  </code>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Transcription Quality Settings */}
              <section>
                <h3 className="text-xs font-semibold text-[var(--focule-text-muted)] uppercase tracking-wider mb-4">
                  Transcription Quality
                </h3>
                <div>
                  <label className="block text-sm font-medium text-[var(--focule-text-primary)] mb-2">
                    Voice Recognition Quality
                  </label>
                  <select
                    value={settings.whisperModel}
                    onChange={(e) => handleChange('whisperModel', e.target.value)}
                    className="w-full px-4 py-3 focule-input rounded-lg text-sm"
                  >
                    {WHISPER_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} — {model.description}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-[var(--focule-text-muted)]">
                    Higher quality = better accuracy but slower processing. <span className="text-[var(--focule-text-secondary)]">Balanced</span> works great for most videos.
                  </p>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[var(--focule-border)] flex justify-between items-center">
              <button
                onClick={loadOllamaModels}
                className="text-sm text-[var(--focule-text-muted)] hover:text-[var(--focule-text-secondary)] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Models
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 focule-btn rounded-lg text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                </svg>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
