import { useState } from 'react';

interface SocialContent {
  hooks: string[];  // Now supports multiple hook/title options
  description: string;
  hashtags: string[];
  keywords: string[];
  filenames: string[];
  imagePrompts: string[];
}

interface ResultsViewProps {
  transcript: string;
  transcriptWithTimestamps: string;
  socialContent?: SocialContent;
  savedPath?: string | null;
  ollamaModel?: string;
  whisperModel?: string;
}

// Helper to strip markdown formatting for clean copy/paste
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // **bold**
    .replace(/\*([^*]+)\*/g, '$1')       // *italic*
    .replace(/__([^_]+)__/g, '$1')       // __bold__
    .replace(/_([^_]+)_/g, '$1')         // _italic_
    .replace(/~~([^~]+)~~/g, '$1')       // ~~strikethrough~~
    .replace(/`([^`]+)`/g, '$1')         // `code`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link](url)
    .trim();
}

// Helper to get model tier label
function getModelTier(modelName: string): string {
  const match = modelName.match(/(\d+\.?\d*)b/i);
  if (!match) return '';
  const params = parseFloat(match[1]);
  if (params < 8) return 'Fast';
  if (params <= 20) return 'Recommended';
  return 'Premium';
}

// Helper to get user-friendly whisper model name
function getWhisperDisplayName(modelId: string): string {
  const names: Record<string, string> = {
    'tiny': 'Fast',
    'base': 'Balanced',
    'small': 'Accurate',
    'medium': 'High Quality',
    'large': 'Maximum',
  };
  return names[modelId] || modelId;
}

// Minimal flat icons
const Icons = {
  sparkle: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  ),
  document: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  hook: (
    <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
  description: (
    <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
    </svg>
  ),
  hashtag: (
    <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
    </svg>
  ),
  key: (
    <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  ),
  file: (
    <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  image: (
    <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
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
};

function CodeBlock({ children, content, mono = true }: { children: React.ReactNode; content: string; mono?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [copied, setCopied] = useState(false);

  const showCopyButton = isHovered || isFocused;

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
    <div 
      className={`relative bg-[var(--focule-bg-primary)] border border-[var(--focule-border-subtle)] rounded-lg p-3 ${mono ? 'font-mono text-[13px]' : 'text-[14px]'} transition-colors cursor-pointer ${isHovered || isFocused ? 'border-[var(--focule-border)]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClick={handleCopy}
      tabIndex={0}
      role="button"
      aria-label="Click to copy"
    >
      {children}
      
      {/* Copy button - fades in on hover/focus */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCopy();
        }}
        className={`absolute top-2 right-2 p-1.5 rounded-md transition-all duration-200 ${
          showCopyButton ? 'opacity-100' : 'opacity-0'
        } ${
          copied 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-[var(--focule-bg-tertiary)] text-[var(--focule-text-muted)] hover:text-[var(--focule-text-primary)] hover:bg-[var(--focule-bg-secondary)]'
        }`}
        title={copied ? 'Copied!' : 'Copy to clipboard'}
      >
        {copied ? Icons.check : Icons.clipboard}
      </button>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[var(--focule-text-muted)]">{icon}</span>
      <h4 className="text-xs font-semibold text-[var(--focule-text-muted)] uppercase tracking-wider">
        {title}
      </h4>
    </div>
  );
}

export function ResultsView({
  transcript,
  transcriptWithTimestamps,
  socialContent,
  savedPath,
  ollamaModel,
  whisperModel,
}: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<'results' | 'transcript'>('results');

  const tabs = [
    { id: 'results' as const, label: 'Results', icon: Icons.sparkle },
    { id: 'transcript' as const, label: 'Transcript', icon: Icons.document },
  ];

  return (
    <div className="focule-card rounded-2xl overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-[var(--focule-border-subtle)]">
        <nav className="flex px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors -mb-[1px] ${
                activeTab === tab.id
                  ? 'border-[var(--focule-primary)] text-[var(--focule-heading)]'
                  : 'border-transparent text-[var(--focule-text-muted)] hover:text-[var(--focule-text-secondary)]'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-[var(--focule-primary-light)]' : ''}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Saved path notification */}
      {savedPath && (
        <div className="px-6 py-3 bg-green-500/5 border-b border-green-500/10">
          <p className="text-sm text-green-400 flex items-center gap-2">
            {Icons.check}
            <span>Saved to: <span className="font-mono text-xs opacity-80">{savedPath}</span></span>
          </p>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {activeTab === 'results' && (
          <div className="space-y-6">
            {socialContent ? (
              <>
                {/* Model Info Header */}
                {(ollamaModel || whisperModel) && (
                  <div className="flex flex-wrap gap-4 p-4 bg-[var(--focule-bg-primary)] border border-[var(--focule-border-subtle)] rounded-lg">
                    {ollamaModel && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--focule-text-muted)] uppercase tracking-wider">AI Engine:</span>
                        <code className="px-2 py-1 bg-[var(--focule-bg-tertiary)] text-[var(--focule-primary-light)] rounded text-sm font-mono">
                          {ollamaModel}
                          {getModelTier(ollamaModel) && (
                            <span className="ml-1.5 text-[var(--focule-text-muted)]">({getModelTier(ollamaModel)})</span>
                          )}
                        </code>
                      </div>
                    )}
                    {whisperModel && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--focule-text-muted)] uppercase tracking-wider">Transcription:</span>
                        <code className="px-2 py-1 bg-[var(--focule-bg-tertiary)] text-[var(--focule-primary-light)] rounded text-sm font-mono">
                          {getWhisperDisplayName(whisperModel)}
                        </code>
                      </div>
                    )}
                  </div>
                )}

                {/* Hook/Title Options */}
                <div>
                  <SectionHeader icon={Icons.hook} title={`Hook / Title Options (${socialContent.hooks?.length || 0} variations)`} />
                  <div className="space-y-2">
                    {socialContent.hooks?.map((hook, i) => {
                      const cleanHook = stripMarkdown(hook);
                      return (
                        <CodeBlock key={i} content={cleanHook} mono={false}>
                          <div className="flex items-start gap-3 pr-8">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--focule-primary)]/20 text-[var(--focule-primary-light)] flex items-center justify-center text-xs font-semibold">
                              {i + 1}
                            </span>
                            <p className="text-[var(--focule-heading)] leading-relaxed flex-1">
                              {cleanHook}
                              <span className="ml-2 text-xs text-[var(--focule-text-muted)]">
                                ({cleanHook.length} chars)
                              </span>
                            </p>
                          </div>
                        </CodeBlock>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <SectionHeader icon={Icons.description} title="Description" />
                  <CodeBlock content={socialContent.description || ''} mono={false}>
                    <p className="text-[var(--focule-text-secondary)] whitespace-pre-wrap leading-relaxed pr-8">
                      {socialContent.description}
                    </p>
                  </CodeBlock>
                </div>

                {/* Hashtags */}
                <div>
                  <SectionHeader icon={Icons.hashtag} title="Hashtags" />
                  <CodeBlock content={(socialContent.hashtags || []).map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}>
                    <div className="flex flex-wrap gap-2 pr-8">
                      {socialContent.hashtags?.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-[var(--focule-primary)]/10 text-[var(--focule-primary-light)] rounded-md text-sm"
                        >
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  </CodeBlock>
                </div>

                {/* Keywords */}
                <div>
                  <SectionHeader icon={Icons.key} title="Keywords" />
                  <CodeBlock content={(socialContent.keywords || []).join(', ')}>
                    <p className="text-[var(--focule-text-secondary)] pr-8">
                      {socialContent.keywords?.join(', ')}
                    </p>
                  </CodeBlock>
                </div>

                {/* Filename Suggestions */}
                <div>
                  <SectionHeader icon={Icons.file} title="Filename Suggestions" />
                  <div className="space-y-2">
                    {socialContent.filenames?.map((name, i) => (
                      <CodeBlock key={i} content={name.replace(/^\d+\.\s*/, '')}>
                        <span className="text-[var(--focule-text-secondary)] pr-8">
                          {name.replace(/^\d+\.\s*/, '')}
                        </span>
                      </CodeBlock>
                    ))}
                  </div>
                </div>

                {/* Image Prompts */}
                <div>
                  <SectionHeader icon={Icons.image} title="Text to Image Prompts" />
                  <div className="space-y-2">
                    {socialContent.imagePrompts?.map((prompt, i) => (
                      <CodeBlock key={i} content={prompt.replace(/^["']|["']$/g, '').replace(/^\d+\.\s*/, '')} mono={false}>
                        <p className="text-[var(--focule-text-secondary)] leading-relaxed pr-8">
                          {prompt.replace(/^["']|["']$/g, '').replace(/^\d+\.\s*/, '')}
                        </p>
                      </CodeBlock>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-[var(--focule-text-muted)] mb-2">
                  {Icons.sparkle}
                </div>
                <p className="text-[var(--focule-text-muted)]">
                  No results generated
                </p>
                <p className="text-sm text-[var(--focule-text-muted)] mt-1">
                  Make sure the AI engine is running to generate content
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div>
            <SectionHeader icon={Icons.document} title="Full Transcript" />
            <div className="max-h-[500px] overflow-y-auto rounded-lg">
              <CodeBlock content={transcriptWithTimestamps || transcript}>
                <pre className="whitespace-pre-wrap text-[var(--focule-text-secondary)] leading-relaxed pr-8">
                  {transcriptWithTimestamps || transcript}
                </pre>
              </CodeBlock>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
