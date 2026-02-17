/**
 * Real-time performance monitoring dashboard component
 * Displays system metrics and performance budgets
 */

import React, { useState, useEffect } from 'react';

interface PerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  activeTasks: number;
  queuedTasks: number;
  averageExecutionTime: number;
}

interface PerformanceBudget {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxActiveTasks: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    cpuUsage: 0,
    activeTasks: 0,
    queuedTasks: 0,
    averageExecutionTime: 0
  });

  const [budget] = useState<PerformanceBudget>({
    maxMemoryMB: 200,
    maxCpuPercent: 50,
    maxActiveTasks: 5
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      // Simulate metrics - in real app, this would come from IPC
      const memoryUsage = Math.random() * 150 + 50;
      const cpuUsage = Math.random() * 40 + 10;
      const activeTasks = Math.floor(Math.random() * 3);
      const queuedTasks = Math.floor(Math.random() * 5);
      const averageExecutionTime = Math.random() * 2000 + 500;

      setMetrics({
        memoryUsage,
        cpuUsage,
        activeTasks,
        queuedTasks,
        averageExecutionTime
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const getStatusColor = (current: number, max: number): string => {
    const percentage = (current / max) * 100;
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (current: number, max: number): string => {
    const percentage = (current / max) * 100;
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isVisible) {
    return React.createElement(
      'button',
      {
        onClick: () => setIsVisible(true),
        className: 'fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 z-50'
      },
      React.createElement(
        'svg',
        {
          className: 'w-6 h-6',
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor'
        },
        React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
        })
      )
    );
  }

  return React.createElement(
    'div',
    { className: 'fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 w-80 z-50 border border-gray-200' },
    React.createElement(
      'div',
      { className: 'flex justify-between items-center mb-4' },
      React.createElement(
        'h3',
        { className: 'text-lg font-semibold text-gray-800' },
        'Performance Monitor'
      ),
      React.createElement(
        'button',
        {
          onClick: () => setIsVisible(false),
          className: 'text-gray-500 hover:text-gray-700'
        },
        '×'
      )
    ),
    
    // Memory Usage
    React.createElement(
      'div',
      { className: 'mb-4' },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center mb-1' },
        React.createElement(
          'span',
          { className: 'text-sm font-medium text-gray-700' },
          'Memory Usage'
        ),
        React.createElement(
          'span',
          { className: `text-sm font-medium ${getStatusColor(metrics.memoryUsage, budget.maxMemoryMB)}` },
          `${metrics.memoryUsage.toFixed(1)}MB / ${budget.maxMemoryMB}MB`
        )
      ),
      React.createElement(
        'div',
        { className: 'w-full bg-gray-200 rounded-full h-2' },
        React.createElement(
          'div',
          {
            className: `h-2 rounded-full transition-all duration-300 ${getProgressBarColor(metrics.memoryUsage, budget.maxMemoryMB)}`,
            style: { width: `${Math.min((metrics.memoryUsage / budget.maxMemoryMB) * 100, 100)}%` }
          }
        )
      )
    ),

    // CPU Usage
    React.createElement(
      'div',
      { className: 'mb-4' },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center mb-1' },
        React.createElement(
          'span',
          { className: 'text-sm font-medium text-gray-700' },
          'CPU Usage'
        ),
        React.createElement(
          'span',
          { className: `text-sm font-medium ${getStatusColor(metrics.cpuUsage, budget.maxCpuPercent)}` },
          `${metrics.cpuUsage.toFixed(1)}%`
        )
      ),
      React.createElement(
        'div',
        { className: 'w-full bg-gray-200 rounded-full h-2' },
        React.createElement(
          'div',
          {
            className: `h-2 rounded-full transition-all duration-300 ${getProgressBarColor(metrics.cpuUsage, budget.maxCpuPercent)}`,
            style: { width: `${Math.min((metrics.cpuUsage / budget.maxCpuPercent) * 100, 100)}%` }
          }
        )
      )
    ),

    // Active Tasks
    React.createElement(
      'div',
      { className: 'mb-4' },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center mb-1' },
        React.createElement(
          'span',
          { className: 'text-sm font-medium text-gray-700' },
          'Active Tasks'
        ),
        React.createElement(
          'span',
          { className: `text-sm font-medium ${getStatusColor(metrics.activeTasks, budget.maxActiveTasks)}` },
          `${metrics.activeTasks} / ${budget.maxActiveTasks}`
        )
      )
    ),

    // Additional Metrics
    React.createElement(
      'div',
      { className: 'grid grid-cols-2 gap-2 text-xs' },
      React.createElement(
        'div',
        { className: 'bg-gray-50 p-2 rounded' },
        React.createElement('div', { className: 'text-gray-600' }, 'Queued Tasks'),
        React.createElement('div', { className: 'font-semibold' }, metrics.queuedTasks.toString())
      ),
      React.createElement(
        'div',
        { className: 'bg-gray-50 p-2 rounded' },
        React.createElement('div', { className: 'text-gray-600' }, 'Avg Execution'),
        React.createElement('div', { className: 'font-semibold' }, `${metrics.averageExecutionTime.toFixed(0)}ms`)
      )
    )
  );
};
