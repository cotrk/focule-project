import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
      const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey;
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export const commonShortcuts = {
  copy: { key: 'c', ctrlKey: true, metaKey: true, description: 'Copy' },
  paste: { key: 'v', ctrlKey: true, metaKey: true, description: 'Paste' },
  selectAll: { key: 'a', ctrlKey: true, metaKey: true, description: 'Select All' },
  escape: { key: 'Escape', description: 'Cancel/Close' },
  enter: { key: 'Enter', description: 'Confirm/Submit' },
  space: { key: ' ', description: 'Play/Pause' },
  f: { key: 'f', ctrlKey: true, metaKey: true, description: 'Find' },
  r: { key: 'r', ctrlKey: true, metaKey: true, description: 'Refresh' },
  n: { key: 'n', ctrlKey: true, metaKey: true, description: 'New' },
  s: { key: 's', ctrlKey: true, metaKey: true, description: 'Save' },
  z: { key: 'z', ctrlKey: true, metaKey: true, description: 'Undo' },
  y: { key: 'y', ctrlKey: true, metaKey: true, description: 'Redo' },
};
