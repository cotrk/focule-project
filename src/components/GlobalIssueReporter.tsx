import { useState, useCallback } from 'react';

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
      title: this.sanitizeInput(reportData.title || 'Untitled Issue', 100),
      description: this.sanitizeInput(reportData.description || '', 2000),
      metadata: {
        url: window.location.href,
        ...reportData.metadata
      },
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      appVersion: '1.0.0',
      userEmail: reportData.userEmail ? this.sanitizeInput(reportData.userEmail, 255) : undefined
    };
    
    // Collect console logs
    report.metadata.logs = this.collectConsoleLogs();
    
    await this.provider.sendReport(report);
  }
  
  private sanitizeInput(input: string, maxLength: number): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .substring(0, maxLength); // Limit length
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
  close: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

interface GlobalIssueReporterProps {
  className?: string;
}

export function GlobalIssueReporter({ className }: GlobalIssueReporterProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'other' as IssueType,
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    title: '',
    description: '',
    userEmail: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReportIssue = useCallback(async (): Promise<void> => {
    setIsOpen(true);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please provide both a title and description for your issue.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await issueManager.sendReport({
        type: formData.type,
        severity: formData.severity,
        title: formData.title,
        description: formData.description,
        userEmail: formData.userEmail || undefined,
        metadata: {
          component: 'GlobalIssueReporter',
          trigger: 'in_app_form',
          url: window.location.href
        }
      });
      
      // Reset form and close
      setFormData({
        type: 'other',
        severity: 'medium',
        title: '',
        description: '',
        userEmail: ''
      });
      setIsOpen(false);
      
      alert('✅ Issue report sent successfully! We\'ll get back to you soon.');
    } catch (error) {
      console.error('Failed to send issue report:', error);
      alert('❌ Failed to send issue report. Please try again or contact help@focule.com directly.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const handleClose = useCallback((): void => {
    setIsOpen(false);
  }, []);

  if (isOpen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Report an Issue</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {Icons.close}
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as IssueType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="youtube_blocked">YouTube Download Blocked</option>
                <option value="download_failed">Download Failed</option>
                <option value="transcription_error">Transcription Error</option>
                <option value="ollama_error">AI Engine Error</option>
                <option value="ui_crash">UI Crash</option>
                <option value="performance_issue">Performance Issue</option>
                <option value="feature_request">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as 'low' | 'medium' | 'high' | 'critical' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of what happened, steps to reproduce, etc."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                value={formData.userEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, userEmail: e.target.value }))}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Sending...' : 'Send Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
