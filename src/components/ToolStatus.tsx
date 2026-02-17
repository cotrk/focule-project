import React, { useState, useEffect } from 'react';

interface ToolStatus {
  installed: boolean;
  path?: string;
  version?: string;
  needsDownload?: boolean;
}

interface ToolStatusResponse {
  success: boolean;
  status?: Record<string, ToolStatus>;
  error?: string;
}

interface ToolPathsResponse {
  success: boolean;
  paths?: Record<string, string>;
  error?: string;
}

export const ToolStatus = () => {
  const [status, setStatus] = useState<Record<string, ToolStatus> | null>(null);
  const [paths, setPaths] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkToolStatus();
  }, []);

  const checkToolStatus = async () => {
    setLoading(true);
    try {
      const response = await window.electronAPI.invoke('tools:status') as ToolStatusResponse;
      if (response.success && response.status) {
        setStatus(response.status);
      }
    } catch (error) {
      console.error('Failed to check tool status:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadMissingTools = async () => {
    setLoading(true);
    try {
      const response = await window.electronAPI.invoke('tools:download');
      if (response.success) {
        // Refresh status after download
        setTimeout(checkToolStatus, 2000);
      }
    } catch (error) {
      console.error('Failed to download tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const getToolPaths = async () => {
    try {
      const response = await window.electronAPI.invoke('tools:paths') as ToolPathsResponse;
      if (response.success && response.paths) {
        setPaths(response.paths);
      }
    } catch (error) {
      console.error('Failed to get tool paths:', error);
    }
  };

  const ToolIcon = ({ tool, status }: { tool: string; status: ToolStatus }) => {
    const icon = status.installed ? '✅' : status.needsDownload ? '⬇️' : '❌';
    const location = status.path || 'Not found';
    
    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{icon}</span>
          <div>
            <div className="font-medium text-gray-900">{tool}</div>
            <div className="text-sm text-gray-500">{location}</div>
          </div>
        </div>
        {status.needsDownload && (
          <button
            onClick={downloadMissingTools}
            disabled={loading}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Downloading...' : 'Download'}
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading tool status...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">🛠️ Tool Management</h2>
        <p className="text-gray-600 mb-4">
          Focule automatically manages required tools. Missing tools will be downloaded and installed automatically.
        </p>
      </div>

      {status && (
        <div className="space-y-3">
          <ToolIcon tool="FFmpeg" status={status.FFmpeg} />
          <ToolIcon tool="FFprobe" status={status.FFprobe} />
          <ToolIcon tool="yt-dlp" status={status['yt-dlp']} />
          <ToolIcon tool="Whisper" status={status.Whisper} />
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-medium mb-3">📂 Tool Paths</h3>
        {paths && (
          <div className="space-y-2 text-sm font-mono bg-gray-800 text-green-100 p-3 rounded">
            <div>FFmpeg: {paths.ffmpeg}</div>
            <div>FFprobe: {paths.ffprobe}</div>
            <div>yt-dlp: {paths.ytDlp}</div>
            <div>Whisper: {paths.whisper}</div>
            <div className="text-xs text-gray-400 mt-2">
              System tools: {paths.systemFFmpeg}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={checkToolStatus}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>
    </div>
  );
};
