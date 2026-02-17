/**
 * Lazy loading utilities for optimizing component loading performance
 * Prevents loading heavy components until they're actually needed
 */

import React, { lazy, Suspense } from 'react';

interface LazyComponentOptions {
  fallback?: React.ComponentType;
  preload?: boolean;
}

// Simple loading spinner component
const LoadingSpinner = () => React.createElement(
  'div',
  { className: 'flex items-center justify-center p-4' },
  React.createElement(
    'div',
    { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' }
  )
);

/**
 * Creates a lazy-loaded component with proper suspense boundary
 */
export function createLazyComponent(
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  options: LazyComponentOptions = {}
): React.ComponentType<any> {
  const { fallback: CustomFallback = LoadingSpinner, preload = false } = options;

  const LazyComponent = lazy(importFn);

  // Preload component if requested
  if (preload) {
    importFn();
  }

  const ComponentWithSuspense = (props: any) => React.createElement(
    Suspense,
    { fallback: React.createElement(CustomFallback) },
    React.createElement(LazyComponent, props)
  );

  return ComponentWithSuspense;
}

/**
 * Lazy component factory functions
 */
export const LazyComponents = {
  ResultsView: createLazyComponent(
    () => import('../components/ResultsViewRedesigned').then(module => ({ default: module.ResultsViewRedesigned })),
    { preload: false }
  ),
  MarketingContentGenerator: createLazyComponent(
    () => import('../components/MarketingContentGenerator').then(module => ({ default: module.MarketingContentGenerator })),
    { preload: false }
  ),
  SettingsPanel: createLazyComponent(
    () => import('../components/SettingsPanel').then(module => ({ default: module.SettingsPanel })),
    { preload: false }
  ),
  OnboardingFlow: createLazyComponent(
    () => import('../components/OnboardingFlow').then(module => ({ default: module.OnboardingFlow })),
    { preload: false }
  )
};

/**
 * Preload critical components when app is idle
 */
export function preloadCriticalComponents(): void {
  // Preload components that are likely to be used soon
  setTimeout(() => {
    import('../components/ResultsViewRedesigned');
    import('../components/SettingsPanel');
  }, 2000); // After 2 seconds when app is likely idle
}

/**
 * Memory-optimized component wrapper
 * Ensures proper cleanup and memory management
 */
export function withMemoryOptimization(
  Component: React.ComponentType<any>,
  cleanupFn?: () => void
): React.ComponentType<any> {
  const OptimizedComponent = (props: any) => {
    React.useEffect(() => {
      return () => {
        // Cleanup when component unmounts
        cleanupFn?.();
      };
    }, []);

    return React.createElement(Component, props);
  };

  return OptimizedComponent;
}
