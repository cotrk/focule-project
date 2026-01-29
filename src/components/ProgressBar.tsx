import { useState, useEffect } from 'react';
import { tipsManager, Tip, STAGE_SPECIFIC_TIPS } from '../utils/dynamicTips';

interface ProgressBarProps {
  label: string;
  percent: number;
  status?: string;
  details?: string;
  showTips?: boolean;
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

export function ProgressBar({ label, percent, status, details, showTips = true }: ProgressBarProps): JSX.Element {
  const [currentTip, setCurrentTip] = useState<Tip | null>(null);
  const [tipVisible, setTipVisible] = useState(false);

  const labelKey = label.toLowerCase().replace(' ', '') as keyof typeof statusIcons;
  const icon = statusIcons[labelKey] || statusIcons.processing;

  // Update tips based on processing stage
  useEffect(() => {
    if (!showTips) {
      tipsManager.stopRotation();
      setTipVisible(false);
      return;
    }

    // Map label to stage
    const stage: keyof typeof STAGE_SPECIFIC_TIPS = 
      labelKey === 'downloading' ? 'downloading' :
      labelKey === 'extracting' ? 'extracting' :
      labelKey === 'transcribing' ? 'transcribing' :
      labelKey === 'processing' ? 'processing' : 'downloading';
    
    tipsManager.setStage(stage);

    // Start tip rotation
    tipsManager.startRotation((tip) => {
      setCurrentTip(tip);
      setTipVisible(true);
    }, 8000); // Rotate every 8 seconds

    return () => {
      tipsManager.stopRotation();
    };
  }, [labelKey, showTips]);

  // Get tip styling based on type
  const getTipStyle = (type: Tip['type']) => {
    const baseStyle = "text-xs p-3 rounded-lg border transition-all duration-500 ";
    switch (type) {
      case 'fact':
        return baseStyle + "bg-blue-500/10 border-blue-500/20 text-blue-400";
      case 'tip':
        return baseStyle + "bg-green-500/10 border-green-500/20 text-green-400";
      case 'model-info':
        return baseStyle + "bg-purple-500/10 border-purple-500/20 text-purple-400";
      default:
        return baseStyle + "bg-[var(--focule-bg-secondary)] border-[var(--focule-border-subtle)] text-[var(--focule-text-muted)]";
    }
  };

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

      {/* Dynamic Tips Section */}
      {showTips && tipVisible && currentTip && (
        <div className="pl-7">
          <div 
            className={getTipStyle(currentTip.type)}
            style={{
              animation: 'slideIn 0.5s ease-out'
            }}
          >
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">
                {currentTip.type === 'fact' && '💡'}
                {currentTip.type === 'tip' && '⚡'}
                {currentTip.type === 'model-info' && '🤖'}
                {currentTip.type === 'info' && '📚'}
              </span>
              <span className="leading-relaxed">{currentTip.text}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add CSS animation for slide-in effect
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
if (!document.head.querySelector('style[data-dynamic-tips]')) {
  style.setAttribute('data-dynamic-tips', 'true');
  document.head.appendChild(style);
}
