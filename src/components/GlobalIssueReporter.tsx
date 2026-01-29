import { useCallback } from 'react';

// Reuse the same issue reporting infrastructure from PrerequisitesCheckRedesigned
type IssueType = 
  | 'youtube_blocked'
  | 'download_failed'
  | 'transcription_error'
  | 'ollama_error'
  | 'ui_crash'
  | 'performance_issue'
  | 'feature_request'
  | 'other';

interface IssueReport {
  id: string;
  type: IssueType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
  userAgent: string;
  appVersion: string;
  userEmail?: string;
}

class EmailIssueProvider {
  name = 'email';
  
  async sendReport(report: IssueReport): Promise<void> {
    const subject = encodeURIComponent(`Focule Issue: ${report.type} - ${report.title}`);
    const body = encodeURIComponent(this.formatReport(report));
    
    window.open(`mailto:help@focule.com?subject=${subject}&body=${body}`);
  }
  
  private formatReport(report: IssueReport): string {
    return `
Issue Type: ${report.type}
Severity: ${report.severity}
Description: ${report.description}
URL: ${report.metadata.url || 'N/A'}
Timestamp: ${report.timestamp.toISOString()}
App Version: ${report.appVersion}
User Agent: ${report.userAgent}
Email: ${report.userEmail || 'Not provided'}

Logs:
${report.metadata.logs || 'No logs available'}

Additional Metadata:
${JSON.stringify(report.metadata, null, 2)}
    `.trim();
  }
}

class IssueReportingManager {
  private provider = new EmailIssueProvider();
  
  async sendReport(reportData: Partial<IssueReport>): Promise<void> {
    const report: IssueReport = {
      id: this.generateId(),
      type: reportData.type || 'other',
      severity: reportData.severity || 'medium',
      title: reportData.title || 'Untitled Issue',
      description: reportData.description || '',
      metadata: {
        url: window.location.href,
        ...reportData.metadata
      },
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      appVersion: '1.0.0',
      userEmail: reportData.userEmail
    };
    
    // Collect console logs
    report.metadata.logs = this.collectConsoleLogs();
    
    await this.provider.sendReport(report);
  }
  
  private generateId(): string {
    return `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private collectConsoleLogs(): string {
    try {
      const logs = [];
      
      logs.push(`=== Focule Issue Report ===`);
      logs.push(`Timestamp: ${new Date().toISOString()}`);
      logs.push(`Platform: ${navigator.platform}`);
      logs.push(`Language: ${navigator.language}`);
      logs.push(`Screen Resolution: ${screen.width}x${screen.height}`);
      logs.push(`Viewport: ${window.innerWidth}x${window.innerHeight}`);
      
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        logs.push(`Memory Usage: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
      }
      
      return logs.join('\n');
    } catch (error) {
      return 'Failed to collect system information';
    }
  }
}

const issueManager = new IssueReportingManager();

const Icons = {
  bug: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

interface GlobalIssueReporterProps {
  className?: string;
}

export function GlobalIssueReporter({ className }: GlobalIssueReporterProps): JSX.Element {
  const handleReportIssue = useCallback(async (): Promise<void> => {
    try {
      await issueManager.sendReport({
        type: 'feature_request',
        severity: 'low',
        title: 'User reported issue from global button',
        description: 'User clicked the global report issue button',
        metadata: {
          component: 'GlobalIssueReporter',
          trigger: 'global_button',
          url: window.location.href
        }
      });
    } catch (error) {
      console.error('Failed to send issue report:', error);
    }
  }, []);

  return (
    <button
      onClick={handleReportIssue}
      className={`fixed bottom-6 right-6 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium z-50 ${className || ''}`}
      title="Report an issue or get help"
    >
      {Icons.bug}
      <span>Report Issue</span>
    </button>
  );
}

// Export the issue manager for use in other components
export { issueManager };
export type { IssueType, IssueReport };
