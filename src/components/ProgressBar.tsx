interface ProgressBarProps {
  label: string;
  percent: number;
  status?: string;
  details?: string;
}

const statusIcons: Record<string, JSX.Element> = {
  downloading: (
    <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  extracting: (
    <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  transcribing: (
    <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  processing: (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

export function ProgressBar({ label, percent, status, details }: ProgressBarProps) {
  const labelKey = label.toLowerCase().replace(' ', '') as keyof typeof statusIcons;
  const icon = statusIcons[labelKey] || statusIcons.processing;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-[var(--focule-primary-light)]">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-[var(--focule-text-primary)]">{label}</span>
            <span className="text-sm text-[var(--focule-text-muted)] font-mono tabular-nums">
              {Math.round(percent)}%
            </span>
          </div>
          <div className="w-full bg-[var(--focule-bg-secondary)] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--focule-primary)] to-[var(--focule-accent)] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
        </div>
      </div>
      {status && (
        <p className="text-sm text-[var(--focule-text-secondary)] pl-7">{status}</p>
      )}
      {details && (
        <p className="text-xs text-[var(--focule-text-muted)] pl-7">{details}</p>
      )}
    </div>
  );
}
