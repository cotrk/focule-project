import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * REDESIGNED URL INPUT
 * 
 * DESIGN IMPROVEMENTS:
 * 1. Real-Time Validation: Shows visual feedback while typing (green checkmark when valid)
 * 2. Clear Button Label: "Transcribe Video" instead of vague "Process"
 * 3. Time Estimate: Shows expected duration (5-15 min)
 * 4. Prominent Platform Badges: Moved above input, better contrast
 * 5. Context Hints: Below input explains what happens next
 * 6. Validation States: Empty, typing, valid (checkmark), invalid (error)
 * 7. Smart Disable Logic: Button only disabled when input empty, not during typing
 */

const Icons = {
  video: (
    <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  youtube: (
    <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  twitch: (
    <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
    </svg>
  ),
  checkCircle: (
    <svg className="w-5 h-5 text-[#00F0FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  alertCircle: (
    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  arrow: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),
  copy: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  spark: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

interface URLInputRedesignedProps {
  onStart: (url: string) => void;
  disabled?: boolean;
}

export function URLInputRedesigned({ onStart, disabled }: URLInputRedesignedProps): JSX.Element {
  const { state, startTranscription, reset, retry } = useTranscription();
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [debouncedUrl, setDebouncedUrl] = useState('');

  // Memoized regex patterns for performance
  const urlPatterns = useMemo(() => ({
    youtube: [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/
    ],
    twitch: [
      /^https?:\/\/(www\.)?twitch\.tv\/videos\/[\w-]+/,
      /^https?:\/\/(www\.)?twitch\.tv\/[\w-]+(\/videos)?$/,
      /^https?:\/\/(www\.)?twitch\.tv\/.*\/clip\/[\w-]+/
    ],
  }), []);

  // Debounced validation function
  const validateURL = useCallback((urlToValidate: string): boolean => {
    if (!urlToValidate || urlToValidate.trim() === '') return false;
    
    const trimmedUrl = urlToValidate.trim();
    
    return [...urlPatterns.youtube, ...urlPatterns.twitch].some(pattern => 
      pattern.test(trimmedUrl)
    );
  }, [urlPatterns]);

  // Debounce effect for validation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUrl(url);
    }, 300);

    return () => clearTimeout(timer);
  }, [url]);

  // Validate when debounced URL changes
  useEffect(() => {
    if (debouncedUrl.trim()) {
      setIsValid(validateURL(debouncedUrl));
      setError('');
    } else {
      setIsValid(false);
    }
  }, [debouncedUrl, validateURL]);

  // Update validation state as user types (immediate feedback)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError('');

    // Immediate validation for empty state
    if (!newUrl.trim()) {
      setIsValid(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateURL(url)) {
      setError('Hmm, that doesn\'t look like a YouTube or Twitch video URL. Double-check the link?');
      return;
    }

    onStart(url);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      if (validateURL(text)) {
        setIsValid(true);
        setError('');
      }
    } catch (err) {
      console.error('Paste failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#00F0FF] to-[#BD00FF] rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-[var(--focule-heading)]" style={{ letterSpacing: '-0.03em' }}>
              Transcribe a Video
            </h1>
            <p className="text-sm text-[var(--focule-text-secondary)]">
              Transform video content into text and social media posts
            </p>
          </div>
        </div>
      </div>

      {/* PLATFORM BADGES - More Prominent */}
      <div className="flex items-center justify-start gap-4 px-4 py-3 bg-[var(--focule-bg-secondary)] rounded-lg border border-[var(--focule-border-subtle)]">
        <span className="text-xs font-semibold text-[var(--focule-text-muted)] uppercase tracking-wider">
          Supported:
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--focule-text-primary)]">
            {Icons.youtube}
            <span>YouTube</span>
          </div>
          <div className="w-px h-4 bg-[var(--focule-border)]" />
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--focule-text-primary)]">
            {Icons.twitch}
            <span>Twitch</span>
          </div>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="flex items-center gap-2 text-sm font-medium text-[var(--focule-text-primary)] mb-3">
            {Icons.video}
            <span>Video URL</span>
          </label>

          {/* INPUT FIELD WITH REAL-TIME VALIDATION */}
          <div className="relative flex gap-3">
            <div className="relative flex-1">
              <input
                id="url"
                type="text"
                value={url}
                onChange={handleInputChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Paste your YouTube or Twitch link..."
                disabled={disabled}
                className={`
                  w-full px-4 py-3.5 rounded-xl font-medium text-[15px]
                  bg-[var(--focule-bg-primary)]
                  border-2 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none
                  ${
                    error
                      ? 'border-red-500/50 focus:border-red-500'
                      : isValid
                      ? 'border-[#00F0FF]/50 focus:border-[#00F0FF]'
                      : isFocused
                      ? 'border-[var(--focule-primary-light)]/50 focus:border-[var(--focule-primary-light)]'
                      : 'border-[var(--focule-border)] focus:border-[var(--focule-primary)]'
                  }
                `}
                style={{ letterSpacing: '-0.01em' }}
              />

              {/* VALIDATION INDICATOR */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {isValid && !error && (
                  <div className="flex items-center gap-1 text-[#00F0FF]" title="Valid URL">
                    {Icons.checkCircle}
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-1 text-red-400" title="Invalid URL">
                    {Icons.alertCircle}
                  </div>
                )}
                {!url && (
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--focule-text-muted)] hover:text-[var(--focule-primary)] transition-colors"
                    title="Paste from clipboard"
                  >
                    {Icons.copy}
                    <span>Paste</span>
                  </button>
                )}
              </div>
            </div>

            {/* SUBMIT BUTTON - Clearer Label & Time Estimate */}
            <button
              type="submit"
              disabled={disabled || !url.trim()}
              className={`
                px-6 py-3.5 rounded-xl font-semibold flex items-center gap-2
                transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focule-primary)]
                ${
                  disabled || !url.trim()
                    ? 'bg-[var(--focule-bg-secondary)] text-[var(--focule-text-muted)] cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-[#00F0FF] to-[#BD00FF] text-black hover:shadow-lg hover:shadow-[#00F0FF]/50'
                }
              `}
            >
              <span>Transcribe</span>
              {Icons.arrow}
            </button>
          </div>

          {/* ERROR MESSAGE - More Helpful */}
          {error && (
            <p className="mt-3 text-sm text-red-400 flex items-start gap-2 bg-red-500/5 p-3 rounded-lg border border-red-500/20">
              <span className="mt-0.5">{Icons.alertCircle}</span>
              <span>{error}</span>
            </p>
          )}
          
          {/* TRY AGAIN BUTTON - Only show when there's an error */}
          {state.status === 'error' && error && (
            <button
              type="button"
              onClick={retry}
              className="mt-3 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <span>Try Again</span>
            </button>
          )}

          {/* HELPER TEXT - Contextual */}
          {isValid && !error && (
            <p className="mt-3 text-sm text-[#00F0FF] flex items-start gap-2 bg-[#00F0FF]/5 p-3 rounded-lg border border-[#00F0FF]/20">
              <span className="mt-0.5">{Icons.spark}</span>
              <span>Ready to transcribe! This usually takes 5-15 minutes.</span>
            </p>
          )}

          {!url && (
            <p className="mt-3 text-xs text-[var(--focule-text-muted)] flex items-start gap-2">
              <span>📌</span>
              <span>Find the video's URL in your browser address bar. It looks like youtube.com/watch?v=dQw4w9WgXcQ</span>
            </p>
          )}
        </div>
      </form>

      {/* FOOTER - Pro Tips */}
      <div className="pt-4 space-y-3 border-t border-[var(--focule-border-subtle)]">
        <p className="text-xs font-semibold text-[var(--focule-text-muted)] uppercase tracking-wider">💡 Pro Tips</p>
        <ul className="space-y-2 text-xs text-[var(--focule-text-secondary)]">
          <li className="flex gap-2">
            <span className="text-[#00F0FF]">•</span>
            <span><strong>Shorter videos</strong> transcribe faster (1-30 min is ideal)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#00F0FF]">•</span>
            <span><strong>Clearer audio</strong> = more accurate transcription</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#00F0FF]">•</span>
            <span><strong>First run takes longer</strong>; subsequent videos are faster</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
