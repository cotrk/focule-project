import { useState } from 'react';

interface URLInputProps {
  onStart: (url: string) => void;
  disabled?: boolean;
}

const Icons = {
  video: (
    <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  youtube: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  twitch: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
    </svg>
  ),
  arrow: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),
};

export function URLInput({ onStart, disabled }: URLInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateURL = (inputUrl: string): boolean => {
    const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const twitchPattern = /^(https?:\/\/)?(www\.)?twitch\.tv\/videos\/\d+/;
    return youtubePattern.test(inputUrl) || twitchPattern.test(inputUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateURL(url)) {
      setError('Invalid URL. Please enter a YouTube or Twitch video URL.');
      return;
    }

    onStart(url);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="url" className="flex items-center gap-2 text-sm font-medium text-[var(--focule-text-primary)] mb-3">
          {Icons.video}
          <span>Video URL</span>
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              placeholder="Paste a YouTube or Twitch video URL..."
              disabled={disabled}
              className="w-full px-4 py-3.5 focule-input rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
              style={{ letterSpacing: '-0.01em' }}
            />
          </div>
          <button
            type="submit"
            disabled={disabled || !url.trim()}
            className="px-6 py-3.5 focule-btn rounded-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center gap-2 font-medium"
          >
            <span>Process</span>
            {Icons.arrow}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}
      </div>

      {/* Supported platforms */}
      <div className="flex items-center justify-center gap-6 pt-2">
        <div className="flex items-center gap-2 text-[var(--focule-text-muted)]">
          <span className="text-red-500">{Icons.youtube}</span>
          <span className="text-xs">YouTube</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--focule-text-muted)]">
          <span className="text-purple-400">{Icons.twitch}</span>
          <span className="text-xs">Twitch</span>
        </div>
      </div>
    </form>
  );
}
