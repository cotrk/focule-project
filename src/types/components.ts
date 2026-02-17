import React from 'react';
import type { 
  TranscriptionState, 
  TranscriptionResult,
  Settings,
  Theme,
  WhisperModel,
  OllamaModel,
  SocialContent
} from './index';

// ============================================================================
// Base Component Props
// ============================================================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface StatefulComponentProps extends BaseComponentProps {
  loading?: boolean;
  disabled?: boolean;
  error?: string;
}

// ============================================================================
// Form and Input Components
// ============================================================================

export interface InputProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'url' | 'email' | 'password' | 'search';
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  error?: string;
  label?: string;
  description?: string;
  showValidation?: boolean;
}

export interface URLInputProps extends InputProps {
  onStart: (url: string) => void;
  validateURL?: boolean;
  supportedPlatforms?: Array<'youtube' | 'twitch' | 'vimeo'>;
  showPreview?: boolean;
}

export interface ButtonProps extends BaseComponentProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export interface SelectProps<T extends string> extends BaseComponentProps {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; description?: string; disabled?: boolean }>;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  error?: string;
  label?: string;
}

export interface CheckboxProps extends BaseComponentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  error?: string;
}

export interface ToggleProps extends BaseComponentProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// Progress and Status Components
// ============================================================================

export interface ProgressBarProps extends BaseComponentProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  striped?: boolean;
}

export interface StatusIndicatorProps extends BaseComponentProps {
  status: 'idle' | 'loading' | 'success' | 'error' | 'warning';
  message?: string;
  detailed?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// Transcription-Specific Components
// ============================================================================

export interface TranscriptionControlsProps extends BaseComponentProps {
  state: TranscriptionState;
  onStart: (url: string) => void;
  onCancel: () => void;
  onReset: () => void;
  canStart?: boolean;
  canCancel?: boolean;
  canReset?: boolean;
}

export interface TranscriptionResultsProps extends BaseComponentProps {
  result: TranscriptionResult;
  onExport?: (format: 'txt' | 'srt' | 'json') => void;
  onShare?: (platform: string) => void;
  onEditTranscript?: () => void;
  showSocialContent?: boolean;
  showTimestamps?: boolean;
  allowEditing?: boolean;
}

export interface ModelSelectorProps extends BaseComponentProps {
  whisperModel: WhisperModel;
  ollamaModel: string;
  onWhisperModelChange: (model: WhisperModel) => void;
  onOllamaModelChange: (model: string) => void;
  availableWhisperModels: WhisperModel[];
  availableOllamaModels: OllamaModel[];
  loading?: boolean;
  error?: string;
}

export interface SocialContentViewerProps extends BaseComponentProps {
  socialContent: SocialContent;
  onCopy?: (content: string, type: string) => void;
  onRegenerate?: () => void;
  loading?: boolean;
  error?: string;
  editable?: boolean;
  onEdit?: (content: SocialContent) => void;
}

// ============================================================================
// Settings and Configuration
// ============================================================================

export interface SettingsPanelProps extends BaseComponentProps {
  settings: Settings;
  onSettingsChange: (settings: Partial<Settings>) => void;
  onSave: () => void;
  onReset: () => void;
  loading?: boolean;
  error?: string;
  hasUnsavedChanges?: boolean;
}

export interface ThemeToggleProps extends BaseComponentProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface KeyboardShortcutProps extends BaseComponentProps {
  shortcut: string;
  description: string;
  onConfigure?: () => void;
  configurable?: boolean;
  active?: boolean;
}

// ============================================================================
// Error and Feedback Components
// ============================================================================

export interface ErrorDisplayProps extends BaseComponentProps {
  error: string;
  type?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  details?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  context?: string;
  enableReporting?: boolean;
  showRetry?: boolean;
  showDetails?: boolean;
  customMessage?: string;
}

export interface ToastProps extends BaseComponentProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Layout and Container Components
// ============================================================================

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  backdrop?: boolean;
  centered?: boolean;
  footer?: React.ReactNode;
}

export interface SidebarProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  backdrop?: boolean;
  persistent?: boolean;
}

export interface TabsProps extends BaseComponentProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
    disabled?: boolean;
    icon?: React.ReactNode;
    badge?: string | number;
  }>;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// Data Display Components
// ============================================================================

export interface TableProps<T extends Record<string, unknown>> extends BaseComponentProps {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    sortable?: boolean;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
    width?: string;
  }>;
  loading?: boolean;
  error?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    key: keyof T;
    direction: 'asc' | 'desc';
    onSortChange: (key: keyof T, direction: 'asc' | 'desc') => void;
  };
  selection?: {
    selectedRows: T[];
    onSelectionChange: (rows: T[]) => void;
  };
}

export interface ListProps<T> extends BaseComponentProps {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  virtualized?: boolean;
  itemHeight?: number;
  onScrollToEnd?: () => void;
}

export interface BadgeProps extends BaseComponentProps {
  count?: number;
  label?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  maxCount?: number;
}

// ============================================================================
// File and Media Components
// ============================================================================

export interface FileUploadProps extends BaseComponentProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  loading?: boolean;
  error?: string;
  progress?: number;
  dragAndDrop?: boolean;
  preview?: boolean;
}

export interface MediaPlayerProps extends BaseComponentProps {
  src: string;
  type: 'video' | 'audio';
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  poster?: string; // for video
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onLoadedMetadata?: (metadata: { duration: number; width?: number; height?: number }) => void;
}

// ============================================================================
// Utility Component Props
// ============================================================================

export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'current';
  label?: string;
  overlay?: boolean;
}

export interface TooltipProps extends BaseComponentProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
  disabled?: boolean;
  arrow?: boolean;
}

export interface DividerProps extends BaseComponentProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  variant?: 'solid' | 'dashed' | 'dotted';
}

// ============================================================================
// Higher-Order Component Types
// ============================================================================

export interface WithErrorBoundaryProps<T> extends T {
  errorBoundary?: Partial<ErrorBoundaryProps>;
}

export interface WithLoadingProps<T> extends T {
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface WithSuspenseProps<T> extends T {
  fallback?: React.ReactNode;
}

// ============================================================================
// Component Composition Types
// ============================================================================

export interface FormFieldProps extends BaseComponentProps {
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export interface ActionGroupProps extends BaseComponentProps {
  actions: Array<{
    id: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    icon?: React.ReactNode;
  }>;
  layout?: 'horizontal' | 'vertical' | 'grid';
  spacing?: 'sm' | 'md' | 'lg';
}

export interface BreadcrumbProps extends BaseComponentProps {
  items: Array<{
    label: string;
    href?: string;
    active?: boolean;
  }>;
  separator?: string;
  maxItems?: number;
}

// ============================================================================
// Animation and Transition Props
// ============================================================================

export interface AnimatedProps extends BaseComponentProps {
  animation?: 'fade' | 'slide' | 'scale' | 'bounce';
  duration?: number;
  delay?: number;
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  onAnimationEnd?: () => void;
}

export interface TransitionProps extends BaseComponentProps {
  in: boolean;
  timeout?: number;
  appear?: boolean;
  enter?: boolean;
  exit?: boolean;
  onEnter?: () => void;
  onEntering?: () => void;
  onEntered?: () => void;
  onExit?: () => void;
  onExiting?: () => void;
  onExited?: () => void;
}
