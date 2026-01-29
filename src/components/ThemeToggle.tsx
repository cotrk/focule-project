import { useState, useEffect } from 'react';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps): JSX.Element {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Load theme from localStorage or system preference
    const savedTheme = localStorage.getItem('focule-theme') as 'dark' | 'light' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: 'dark' | 'light') => {
    const root = document.documentElement;
    
    if (newTheme === 'light') {
      root.style.setProperty('--focule-bg-primary', '#FFFFFF');
      root.style.setProperty('--focule-bg-secondary', '#F8FAFC');
      root.style.setProperty('--focule-bg-tertiary', '#F1F5F9');
      root.style.setProperty('--focule-surface', '#E2E8F0');
      root.style.setProperty('--focule-border', '#CBD5E1');
      root.style.setProperty('--focule-border-subtle', 'rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--focule-heading', '#0F172A');
      root.style.setProperty('--focule-text-primary', '#1E293B');
      root.style.setProperty('--focule-text-secondary', '#475569');
      root.style.setProperty('--focule-text-muted', '#64748B');
      
      // Adjust gradients for light theme
      root.style.setProperty('--focule-gradient', 'linear-gradient(135deg, #0EA5E9 0%, #7C3AED 100%)');
      root.style.setProperty('--focule-gradient-hover', 'linear-gradient(135deg, #0284C7 0%, #6D28D9 100%)');
      root.style.setProperty('--focule-primary', '#0EA5E9');
      root.style.setProperty('--focule-primary-light', '#38BDF8');
      root.style.setProperty('--focule-accent', '#7C3AED');
    } else {
      // Reset to dark theme (default values)
      root.style.setProperty('--focule-bg-primary', '#0B0B0D');
      root.style.setProperty('--focule-bg-secondary', '#121214');
      root.style.setProperty('--focule-bg-tertiary', '#161618');
      root.style.setProperty('--focule-surface', '#1F1F23');
      root.style.setProperty('--focule-border', '#27272a');
      root.style.setProperty('--focule-border-subtle', 'rgba(255, 255, 255, 0.05)');
      root.style.setProperty('--focule-heading', '#FFFFFF');
      root.style.setProperty('--focule-text-primary', '#E5E5E5');
      root.style.setProperty('--focule-text-secondary', '#B8B8C0');
      root.style.setProperty('--focule-text-muted', '#8B8B94');
      
      // Reset gradients to dark theme
      root.style.setProperty('--focule-gradient', 'linear-gradient(135deg, #00F0FF 0%, #BD00FF 100%)');
      root.style.setProperty('--focule-gradient-hover', 'linear-gradient(135deg, #33F3FF 0%, #D44DFF 100%)');
      root.style.setProperty('--focule-primary', '#00F0FF');
      root.style.setProperty('--focule-primary-light', '#33F3FF');
      root.style.setProperty('--focule-accent', '#BD00FF');
    }
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newTheme === 'light' ? '#FFFFFF' : '#0B0B0D');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('focule-theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-all duration-200 hover:bg-[var(--focule-bg-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focule-primary)] ${className}`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? (
        // Sun icon for light mode
        <svg 
          className="w-5 h-5 text-[var(--focule-text-secondary)]" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // Moon icon for dark mode
        <svg 
          className="w-5 h-5 text-[var(--focule-text-secondary)]" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
