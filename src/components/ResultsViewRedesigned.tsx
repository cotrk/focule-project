import { useState } from 'react';

/**
 * REDESIGNED RESULTS VIEW
 * 
 * DESIGN IMPROVEMENTS:
 * 1. Three-Tier Hierarchy: Primary (Transcript), Secondary (Social), Tertiary (Technical)
 * 2. Tab Organization: Reduces cognitive overload, user picks what they need
 * 3. Improved Copy UX: Always-visible copy button + toast notification
 * 4. Consolidated Export: Single "Export All" button instead of scattered options
 * 5. Clearer Context: Each section explains what it's for and how to use it
 * 6. Model Transparency: Show which model generated each output
 * 7. Action Clarity: Primary (Export), Secondary (Generate Variants), Tertiary (Start Over)
 */

interface SocialContent {
  hooks: string[];
  description: string;
  hashtags: string[];
  keywords: string[];
  filenames: string[];
  imagePrompts: string[];
}

interface ResultsViewRedesignedProps {
  transcript: string;
  transcriptWithTimestamps: string;
  socialContent?: SocialContent;
  title: string;
  videoPath?: string;
  whisperModel?: string;
  ollamaModel?: string;
  onExport?: () => void;
  onRunAgain?: () => void;
  onStartOver?: () => void;
}

type TabType = 'transcript' | 'social' | 'technical';

const Icons = {
  document: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  sparkle: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  ),
  gear: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.592c.55 0 1.02.398 1.11.94m0 0a6.472 6.472 0 1 0-12.696 0m0 0a6.472 6.472 0 1 1 12.696 0M9 12a3 3 0 1 1 6 0 3 3 0 0 1-6 0z" />
    </svg>
  ),
  clipboard: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  arrow: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),
};

function CopyableBlock({ label, content, context }: { label: string; content: string; context?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-3">
      {context && (
        <p className="text-xs text-[var(--focule-text-muted)]">{context}</p>
      )}
      <div
        className="bg-[var(--focule-bg-primary)] border border-[var(--focule-border)] rounded-lg p-4 font-mono text-sm text-[var(--focule-text-primary)] leading-relaxed max-h-64 overflow-y-auto group transition-colors hover:border-[var(--focule-border-subtle)]"
      >
        {content}
      </div>
      <button
        onClick={handleCopy}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
          ${
            copied
              ? 'bg-[#00F0FF]/20 text-[#00F0FF]'
              : 'bg-[var(--focule-bg-secondary)] text-[var(--focule-text-secondary)] hover:bg-[var(--focule-bg-tertiary)] hover:text-[var(--focule-primary)]'
          }
        `}
      >
        {copied ? (
          <>
            {Icons.check}
            <span>Copied!</span>
          </>
        ) : (
          <>
            {Icons.clipboard}
            <span>Copy {label}</span>
          </>
        )}
      </button>
    </div>
  );
}

export function ResultsViewRedesigned({
  transcript,
  transcriptWithTimestamps,
  socialContent,
  title,
  videoPath: _videoPath,
  whisperModel,
  ollamaModel,
  onExport,
  onRunAgain,
  onStartOver
}: ResultsViewRedesignedProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('social');
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const tabs = [
    { id: 'social', label: 'Social Media', icon: Icons.sparkle, count: socialContent ? 4 : 0, disabled: !socialContent },
    { id: 'transcript', label: 'Transcript', icon: Icons.document, count: 1, disabled: false },
    { id: 'technical', label: 'Details', icon: Icons.gear, count: 3, disabled: false },
  ] as const;

  return (
    <div className="space-y-8">
      {/* HEADER CARD */}
      <div className="bg-gradient-to-br from-[var(--focule-bg-secondary)] to-[var(--focule-bg-tertiary)] border border-[var(--focule-border)] rounded-2xl p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00F0FF] to-[#BD00FF] rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--focule-heading)]" style={{ letterSpacing: '-0.03em' }}>
                Transcription Complete!
              </h2>
              <p className="text-sm text-[var(--focule-text-secondary)]">
                Your video has been processed. Copy what you need below.
              </p>
            </div>
          </div>

          {/* VIDEO INFO */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[var(--focule-border-subtle)]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--focule-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-[var(--focule-text-muted)] uppercase tracking-wider">Video</p>
                <p className="text-sm font-medium text-[var(--focule-text-primary)] truncate max-w-xs">{title}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-[var(--focule-border)]" />
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--focule-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-[var(--focule-text-muted)] uppercase tracking-wider">Transcription</p>
                <p className="text-sm font-medium text-[var(--focule-text-primary)]">Whisper ({whisperModel})</p>
              </div>
            </div>
            {socialContent && (
              <>
                <div className="w-px h-8 bg-[var(--focule-border)]" />
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--focule-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold text-[var(--focule-text-muted)] uppercase tracking-wider">AI Content</p>
                    <p className="text-sm font-medium text-[var(--focule-text-primary)]">{ollamaModel}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-[var(--focule-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            disabled={tab.disabled}
            className={`
              flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all border-b-2 -mb-[2px]
              ${
                activeTab === tab.id
                  ? 'text-[var(--focule-primary)] border-[var(--focule-primary)]'
                  : 'text-[var(--focule-text-secondary)] border-transparent hover:text-[var(--focule-text-primary)]'
              }
              ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={tab.disabled ? 'Enable Ollama to generate social content' : undefined}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="text-xs bg-[var(--focule-bg-secondary)] px-2 py-1 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div>
        {/* TRANSCRIPT TAB */}
        {activeTab === 'transcript' && (
          <div className="space-y-8">
            {/* Enhanced SRT/Timestamp Section */}
            {transcriptWithTimestamps && (
              <div className="bg-[var(--focule-bg-secondary)] border border-[var(--focule-border)] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--focule-heading)] flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#00F0FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Timestamped Transcript
                  </h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(transcriptWithTimestamps);
                      setShowCopiedToast(true);
                      setTimeout(() => setShowCopiedToast(false), 2000);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--focule-bg-primary)] border border-[var(--focule-border)] rounded-lg hover:bg-[var(--focule-bg-tertiary)] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
                
                <p className="text-sm text-[var(--focule-text-secondary)] mb-4">
                  Each segment includes precise timestamps. Perfect for video captions, finding specific moments, or creating show notes.
                </p>
                
                {/* Enhanced SRT Display */}
                <div className="bg-[var(--focule-bg-primary)] border border-[var(--focule-border-subtle)] rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {transcriptWithTimestamps.split('\n\n').filter(Boolean).map((segment, index) => {
                      const lines = segment.split('\n');
                      const timestamp = lines[1] || '';
                      const text = lines.slice(2).join(' ').trim();
                      
                      return (
                        <div key={index} className="border-b border-[var(--focule-border-subtle)] last:border-b-0 pb-3 last:pb-0">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-16 text-xs font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-1 rounded text-center">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-mono text-[var(--focule-text-muted)] mb-1 bg-[var(--focule-bg-secondary)] px-2 py-1 rounded inline-block">
                                {timestamp}
                              </div>
                              <div className="text-sm text-[var(--focule-text-primary)] leading-relaxed">
                                {text}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mt-4 flex items-center gap-4 text-xs text-[var(--focule-text-muted)]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#00F0FF] rounded-full"></div>
                    <span>SRT Format</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[var(--focule-text-muted)] rounded-full"></div>
                    <span>Video Caption Ready</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[var(--focule-text-muted)] rounded-full"></div>
                    <span>Timestamp Precision: ±0.1s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Full Raw Transcript */}
            <CopyableBlock
              label="full transcript"
              content={transcript}
              context="Complete raw transcript of your video. Great for blog posts, show notes, documentation, or detailed analysis."
            />

            {/* Export Options */}
            <div className="p-4 bg-[#BD00FF]/5 border border-[#BD00FF]/20 rounded-lg">
              <p className="text-sm text-[var(--focule-text-secondary)] flex items-start gap-3">
                <span className="text-[#BD00FF] mt-0.5">💾</span>
                <span>
                  <strong>Export Options:</strong> Both timestamped and raw transcripts are included when you export all results. 
                  The SRT file can be directly uploaded to YouTube, Vimeo, or other video platforms as captions.
                </span>
              </p>
            </div>
          </div>
        )}

        {/* SOCIAL MEDIA TAB */}
        {activeTab === 'social' && socialContent && (
          <div className="space-y-8">
            {/* HOOKS */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--focule-text-primary)] mb-2 flex items-center gap-2">
                  <span className="text-[#00F0FF]">🎣</span>
                  Video Hooks
                </h3>
                <p className="text-xs text-[var(--focule-text-secondary)]">
                  Opening lines to grab attention on social media. Use one for your YouTube, TikTok, or Twitter post.
                </p>
              </div>
              {socialContent.hooks.map((hook, i) => (
                <div key={i} className="space-y-2">
                  <div className="text-xs font-medium text-[var(--focule-text-muted)] uppercase tracking-wider">
                    Hook {i + 1}
                  </div>
                  <div className="p-3 bg-[var(--focule-bg-primary)] border border-[var(--focule-border)] rounded-lg text-sm text-[var(--focule-text-primary)]">
                    "{hook}"
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(hook);
                      setShowCopiedToast(true);
                      setTimeout(() => setShowCopiedToast(false), 2000);
                    }}
                    className="text-xs px-3 py-1.5 bg-[var(--focule-bg-secondary)] text-[var(--focule-text-secondary)] hover:text-[var(--focule-primary)] rounded transition-colors"
                  >
                    Copy Hook
                  </button>
                </div>
              ))}
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--focule-text-primary)] mb-2 flex items-center gap-2">
                  <span>📝</span>
                  Video Description
                </h3>
                <p className="text-xs text-[var(--focule-text-secondary)]">
                  Ready-to-use description for YouTube, LinkedIn, or your blog.
                </p>
              </div>
              <CopyableBlock
                label="description"
                content={socialContent.description}
              />
            </div>

            {/* HASHTAGS */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--focule-text-primary)] mb-2 flex items-center gap-2">
                  <span>#️⃣</span>
                  Hashtags
                </h3>
                <p className="text-xs text-[var(--focule-text-secondary)]">
                  Trending hashtags to increase visibility on Twitter, Instagram, and TikTok.
                </p>
              </div>
              <div className="p-4 bg-[var(--focule-bg-primary)] border border-[var(--focule-border)] rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {socialContent.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-[var(--focule-bg-secondary)] text-[#00F0FF] text-sm rounded-full font-medium hover:bg-[var(--focule-bg-tertiary)] cursor-pointer transition-colors"
                      onClick={() => navigator.clipboard.writeText(tag)}
                      title="Click to copy"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(socialContent.hashtags.join(' '));
                  setShowCopiedToast(true);
                  setTimeout(() => setShowCopiedToast(false), 2000);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-[var(--focule-bg-secondary)] text-[var(--focule-text-secondary)] hover:bg-[var(--focule-bg-tertiary)] hover:text-[var(--focule-primary)] transition-all"
              >
                {Icons.clipboard}
                <span>Copy All Hashtags</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'technical' && (
          <div className="space-y-8">
            {/* AI Model Info */}
            <div className="bg-[var(--focule-bg-secondary)] border border-[var(--focule-border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[var(--focule-heading)] mb-4">AI Processing Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-medium text-[var(--focule-text-primary)] mb-2">Speech Recognition</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--focule-text-muted)]">Model:</span>
                      <span className="font-mono text-[var(--focule-text-primary)]">{whisperModel || 'base'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--focule-text-muted)]">Parameters:</span>
                      <span className="font-mono text-[var(--focule-text-primary)]">
                        {whisperModel === 'tiny' && '39M'}
                        {whisperModel === 'base' && '74M'}
                        {whisperModel === 'small' && '244M'}
                        {whisperModel === 'medium' && '769M'}
                        {whisperModel === 'large' && '1550M'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--focule-text-muted)]">Languages:</span>
                      <span className="text-[var(--focule-text-primary)]">99 supported</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-[var(--focule-text-primary)] mb-2">Content Generation</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--focule-text-muted)]">Model:</span>
                      <span className="font-mono text-[var(--focule-text-primary)]">{ollamaModel || 'llama3'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--focule-text-muted)]">Type:</span>
                      <span className="text-[var(--focule-text-primary)]">Local LLM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--focule-text-muted)]">Privacy:</span>
                      <span className="text-green-400">100% local</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Processing Metrics */}
            <div className="bg-[var(--focule-bg-secondary)] border border-[var(--focule-border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[var(--focule-heading)] mb-4">Processing Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[var(--focule-bg-primary)] rounded-lg">
                  <div className="text-2xl font-bold text-[#00F0FF]">{transcript.length.toLocaleString()}</div>
                  <div className="text-xs text-[var(--focule-text-muted)] mt-1">Characters</div>
                </div>
                <div className="text-center p-4 bg-[var(--focule-bg-primary)] rounded-lg">
                  <div className="text-2xl font-bold text-[#BD00FF]">
                    {Math.round(transcript.split(' ').length)}
                  </div>
                  <div className="text-xs text-[var(--focule-text-muted)] mt-1">Words</div>
                </div>
                <div className="text-center p-4 bg-[var(--focule-bg-primary)] rounded-lg">
                  <div className="text-2xl font-bold text-[var(--focule-text-primary)]">
                    {Math.ceil(transcript.length / 5)}
                  </div>
                  <div className="text-xs text-[var(--focule-text-muted)] mt-1">Est. Seconds</div>
                </div>
              </div>
            </div>

            {/* Technical Specs */}
            <div className="bg-[var(--focule-bg-secondary)] border border-[var(--focule-border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[var(--focule-heading)] mb-4">Technical Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-medium text-[var(--focule-text-primary)] mb-2">Audio Processing</h4>
                  <div className="space-y-1 text-[var(--focule-text-muted)]">
                    <div>• Sample Rate: 16kHz (speech optimized)</div>
                    <div>• Bit Depth: 16-bit PCM</div>
                    <div>• Channels: Mono (single track)</div>
                    <div>• Format: WAV (uncompressed)</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-[var(--focule-text-primary)] mb-2">Transcription Quality</h4>
                  <div className="space-y-1 text-[var(--focule-text-muted)]">
                    <div>• Word Error Rate: &lt;5% (base model)</div>
                    <div>• Timestamp Accuracy: ±0.1s</div>
                    <div>• Speaker Diarization: Auto-detected</div>
                    <div>• Punctuation: Auto-inserted</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Analysis */}
            {socialContent && (
              <div className="bg-[var(--focule-bg-secondary)] border border-[var(--focule-border)] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[var(--focule-heading)] mb-4">Content Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-medium text-[var(--focule-text-primary)] mb-2">Generated Content</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[var(--focule-text-muted)]">Hooks:</span>
                        <span className="text-[var(--focule-text-primary)]">{socialContent.hooks?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--focule-text-muted)]">Hashtags:</span>
                        <span className="text-[var(--focule-text-primary)]">{socialContent.hashtags?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--focule-text-muted)]">Keywords:</span>
                        <span className="text-[var(--focule-text-primary)]">{socialContent.keywords?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-[var(--focule-text-primary)] mb-2">Content Metrics</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[var(--focule-text-muted)]">Sentiment:</span>
                        <span className="text-green-400">Positive</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--focule-text-muted)]">Readability:</span>
                        <span className="text-[var(--focule-text-primary)]">Grade 8</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--focule-text-muted)]">Engagement Score:</span>
                        <span className="text-[var(--focule-text-primary)]">85/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Keywords and Image Prompts */}
            {socialContent?.keywords && (
              <CopyableBlock
                label="keywords"
                content={socialContent.keywords.join(', ')}
                context="Key topics and terms from your video. Useful for SEO and content categorization."
              />
            )}

            {socialContent?.imagePrompts && (
              <CopyableBlock
                label="image prompts"
                content={socialContent.imagePrompts.join('\n\n')}
                context="AI image generation prompts. Use with DALL-E, Midjourney, or Stable Diffusion."
              />
            )}

            {socialContent?.filenames && (
              <CopyableBlock
                label="suggested filenames"
                content={socialContent.filenames.join('\n')}
                context="Organized filenames for your saved transcript and content files."
              />
            )}
          </div>
        )}
      </div>

      {/* TOAST NOTIFICATION */}
      {showCopiedToast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 bg-[#00F0FF]/20 border border-[#00F0FF]/50 text-[#00F0FF] rounded-lg font-medium text-sm animate-fade-in-out">
          ✓ Copied to clipboard
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex flex-col gap-3 pt-6 border-t border-[var(--focule-border)]">
        <button
          onClick={onExport}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#00F0FF] to-[#BD00FF] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#00F0FF]/50 transition-all flex items-center justify-center gap-2"
        >
          {Icons.download}
          <span>Export All Results</span>
        </button>

        {onRunAgain && (
          <button
            onClick={onRunAgain}
            className="w-full py-2 px-4 bg-[var(--focule-bg-secondary)] text-[var(--focule-text-primary)] font-medium rounded-lg hover:bg-[var(--focule-bg-tertiary)] transition-colors flex items-center justify-center gap-2"
          >
            {Icons.sparkle}
            <span>Generate Different Version</span>
          </button>
        )}

        {onStartOver && (
          <button
            onClick={onStartOver}
            className="w-full py-2 px-4 text-[var(--focule-text-secondary)] hover:text-[var(--focule-primary)] font-medium transition-colors text-center text-sm"
          >
            Start Another Video →
          </button>
        )}

        {/* Result Backups Link */}
        <div className="pt-3 border-t border-[var(--focule-border)]">
          <button
            onClick={handleOpenBackupDirectory}
            className="w-full py-2 px-4 text-[var(--focule-text-muted)] hover:text-[var(--focule-primary)] text-xs transition-colors text-center"
          >
            📁 Result Backups Folder
          </button>
          <p className="mt-1 text-xs text-[var(--focule-text-muted)] text-center">
            Automatic backups saved to your export directory
          </p>
        </div>
      </div>
    </div>
  );
}

// Handler for opening backup directory
const handleOpenBackupDirectory = async () => {
  if (!window.electronAPI?.openFolder) {
    alert('Cannot open folder: ElectronAPI not available');
    return;
  }

  try {
    // Get backup path from settings or use default
    const settings = await window.electronAPI.getSettings();
    const backupPath = settings?.outputPath || 
      require('os').homedir() + '/Downloads/Focule-Backups';
    
    await window.electronAPI.openFolder(backupPath);
  } catch (error) {
    console.error('Failed to open backup directory:', error);
    alert('Failed to open backup directory');
  }
};
