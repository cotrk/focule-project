# Issue Reporting Architecture

## 🎯 Overview

This document outlines the strategic architecture for Focule's issue reporting system, designed to evolve from a simple email-based solution to a comprehensive, multi-provider analytics platform.

## 📅 Implementation Roadmap

### Phase 1: Core Foundation (Month 1)
**Goal**: Basic email reporting with automatic error collection

#### Features:
- ✅ Email-based reporting to help@focule.com
- ✅ Automatic console log collection
- ✅ System information gathering
- ✅ Issue categorization (YouTube blocked, download failed, etc.)
- ✅ Screenshot capture capability (prepared)
- ✅ Integration into existing components

#### Technical Implementation:
- Simple email client integration
- TypeScript interfaces for extensibility
- Modular function design for future extraction
- Error boundary integration

---

### Phase 2: Component Extraction (Month 2)
**Goal**: Dedicated component with enhanced capabilities

#### Features:
- 🔄 Extract to standalone `IssueReporter.tsx`
- 🔄 Screenshot capture implementation
- 🔄 Better UI/UX with progress indicators
- 🔄 Issue templates for common problems
- 🔄 Offline queue foundation

#### Technical Implementation:
- React component with proper state management
- Electron desktopCapturer API integration
- Local storage for offline reports
- Enhanced form validation

---

### Phase 3: Multi-Provider Architecture (Month 3)
**Goal**: Support multiple reporting backends

#### Features:
- 📧 Email Provider (current)
- 💬 Slack Provider (team notifications)
- 🐛 Jira Provider (bug tracking)
- 🐙 GitHub Issues Provider (open source)
- 🔧 Custom API Provider (your backend)

#### Technical Implementation:
```typescript
interface IssueReportingProvider {
  name: string;
  sendReport(report: IssueReport): Promise<void>;
  captureScreen?(): Promise<string>;
  collectLogs?(): Promise<string>;
}

class IssueReportingManager {
  private providers: IssueReportingProvider[] = [];
  
  async sendReport(report: IssueReport): Promise<void> {
    await Promise.all(
      this.providers.map(provider => provider.sendReport(report))
    );
  }
}
```

---

### Phase 4: Analytics & Intelligence (Month 4)
**Goal**: Data-driven insights and automation

#### Features:
- 📊 Issue pattern detection
- 📈 Success rate analytics
- 👥 User impact measurement
- 🤖 AI-powered issue classification
- 🔍 Auto-fix suggestions

#### Technical Implementation:
- Analytics dashboard
- Machine learning for issue categorization
- Automated response system
- Performance metrics collection

---

## 🏗️ Core Architecture

### Data Models

```typescript
interface IssueReport {
  id: string;
  type: IssueType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metadata: Record<string, any>;
  attachments: Attachment[];
  timestamp: Date;
  userAgent: string;
  appVersion: string;
  userEmail?: string;
}

type IssueType = 
  | 'youtube_blocked'
  | 'download_failed'
  | 'transcription_error'
  | 'ollama_error'
  | 'ui_crash'
  | 'performance_issue'
  | 'feature_request'
  | 'other';

interface Attachment {
  type: 'screenshot' | 'log' | 'video' | 'audio' | 'config';
  data: string | Blob;
  metadata: Record<string, any>;
}
```

### Provider Pattern

```typescript
abstract class BaseIssueProvider {
  abstract name: string;
  abstract sendReport(report: IssueReport): Promise<void>;
  
  protected formatReport(report: IssueReport): string {
    return `
Issue Type: ${report.type}
Severity: ${report.severity}
Description: ${report.description}
URL: ${report.metadata.url || 'N/A'}
Timestamp: ${report.timestamp.toISOString()}
App Version: ${report.appVersion}
User Agent: ${report.userAgent}

Logs:
${report.metadata.logs || 'No logs available'}
    `.trim();
  }
}

class EmailProvider extends BaseIssueProvider {
  name = 'email';
  
  async sendReport(report: IssueReport): Promise<void> {
    const subject = encodeURIComponent(`Focule Issue: ${report.type} - ${report.title}`);
    const body = encodeURIComponent(this.formatReport(report));
    
    window.open(`mailto:help@focule.com?subject=${subject}&body=${body}`);
  }
}
```

## 🔧 Integration Points

### Error Boundary Integration
```typescript
class FoculeErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const report: IssueReport = {
      id: generateId(),
      type: 'ui_crash',
      severity: 'high',
      title: 'React Component Crash',
      description: error.message,
      metadata: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href
      },
      attachments: [],
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      appVersion: '1.0.0'
    };
    
    issueManager.sendReport(report);
  }
}
```

### Contextual Reporting
```typescript
// In URLInput component
const handleYouTubeError = (error: Error) => {
  issueManager.sendReport({
    type: 'youtube_blocked',
    severity: 'medium',
    title: 'YouTube Video Access Blocked',
    description: `Failed to access YouTube video: ${error.message}`,
    metadata: {
      url: currentUrl,
      errorType: 'youtube_blocked',
      timestamp: Date.now()
    }
  });
};

// In transcription component
const handleTranscriptionError = (error: Error) => {
  issueManager.sendReport({
    type: 'transcription_error',
    severity: 'high',
    title: 'Speech-to-Text Processing Failed',
    description: `Transcription failed: ${error.message}`,
    metadata: {
      audioFile: audioPath,
      model: selectedModel,
      errorType: 'transcription_failed'
    }
  });
};
```

## 📊 Future Enhancements

### Smart Issue Detection
```typescript
const detectIssueType = (error: Error, context: any): IssueType => {
  if (error.message.includes('youtube') || error.message.includes('Video unavailable')) {
    return 'youtube_blocked';
  }
  
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return 'download_failed';
  }
  
  if (error.message.includes('whisper') || error.message.includes('transcription')) {
    return 'transcription_error';
  }
  
  if (error.message.includes('ollama') || error.message.includes('AI')) {
    return 'ollama_error';
  }
  
  return 'other';
};
```

### Performance Monitoring
```typescript
interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryUsage: number;
  success: boolean;
  metadata: Record<string, any>;
}

const trackPerformance = (operation: string, fn: () => Promise<any>) => {
  const start = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  return fn()
    .then(result => {
      const duration = performance.now() - start;
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      if (duration > 5000) { // Slow operation
        issueManager.sendReport({
          type: 'performance_issue',
          severity: 'low',
          title: `Slow Operation: ${operation}`,
          description: `Operation took ${duration}ms`,
          metadata: {
            operation,
            duration,
            memoryDelta: endMemory - startMemory
          }
        });
      }
      
      return result;
    })
    .catch(error => {
      const duration = performance.now() - start;
      
      issueManager.sendReport({
        type: detectIssueType(error, { operation }),
        severity: 'medium',
        title: `Operation Failed: ${operation}`,
        description: error.message,
        metadata: {
          operation,
          duration,
          failed: true
        }
      });
      
      throw error;
    });
};
```

## 🎯 Success Metrics

### Phase 1 Success Criteria
- [ ] Issue reporting accessible from all major components
- [ ] Automatic error collection working
- [ ] Email integration functional
- [ ] User adoption rate > 5% of active users

### Phase 2 Success Criteria
- [ ] Component extracted and reusable
- [ ] Screenshot capture working
- [ ] Offline queue functional
- [ ] User satisfaction score > 4/5

### Phase 3 Success Criteria
- [ ] Multiple providers supported
- [ ] Team notification system active
- [ ] Bug tracking integration complete
- [ ] Response time < 24 hours

### Phase 4 Success Criteria
- [ ] Analytics dashboard operational
- [ ] AI classification accuracy > 80%
- [ ] Auto-fix suggestions working
- [ ] Proactive issue detection

## 🔄 Migration Strategy

### Month 1 → Month 2
1. Extract functions from existing components
2. Create dedicated IssueReporter component
3. Implement proper state management
4. Add comprehensive testing

### Month 2 → Month 3
1. Refactor to provider pattern
2. Implement multiple providers
3. Add configuration management
4. Create provider registry

### Month 3 → Month 4
1. Add analytics collection
2. Implement ML models
3. Create dashboard
4. Add automation features

---

## 📝 Implementation Notes

### Security Considerations
- Sanitize all user input before sending
- Limit attachment sizes to prevent abuse
- Rate limit issue submissions
- Encrypt sensitive data in transit

### Privacy Considerations
- Clear data retention policies
- User consent for data collection
- Anonymize sensitive information
- GDPR compliance for EU users

### Performance Considerations
- Async reporting to avoid blocking UI
- Batch reporting for multiple issues
- Lazy loading of screenshot capture
- Efficient data serialization

---

*This architecture document will be updated as we progress through each phase of implementation.*
