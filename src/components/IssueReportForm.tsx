import { useState, useCallback } from 'react';

interface IssueReportFormProps {
  onClose: () => void;
  initialData?: {
    type?: string;
    error?: string;
    component?: string;
  };
}

const Icons = {
  close: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  send: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  paperclip: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  upload: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
};

export function IssueReportForm({ onClose, initialData }: IssueReportFormProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showEmailOptions, setShowEmailOptions] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: initialData?.type ? `Issue with ${initialData.type}` : '',
    description: initialData?.error || '',
    errorMessage: initialData?.error || '',
    component: initialData?.component || '',
  });

  // Character limits and security
  const LIMITS = {
    subject: 100,
    description: 2000,
    errorMessage: 1000,
  };

  // Security: Rate limiting (simple in-memory implementation)
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);
  const RATE_LIMIT_MS = 60000; // 1 minute between submissions

  const isRateLimited = Date.now() - lastSubmissionTime < RATE_LIMIT_MS;

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleEmailChoice = (emailType: 'gmail' | 'outlook' | 'mailto'): void => {
    const emailData = (window as any).emailReportData;
    if (emailData && emailData[emailType]) {
      window.open(emailData[emailType], '_blank');
      setShowEmailOptions(false);
      setSubmitted(true);
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  };

  const removeImage = useCallback(() => {
    setAttachedImage(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Security: Rate limiting check
    if (isRateLimited) {
      alert('Please wait before submitting another report. You can submit one report per minute.');
      return;
    }
    
    // Validation: Required fields and character limits
    if (!formData.subject.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    if (formData.subject.length > LIMITS.subject) {
      alert(`Subject must be ${LIMITS.subject} characters or less.`);
      return;
    }

    if (formData.description.length > LIMITS.description) {
      alert(`Description must be ${LIMITS.description} characters or less.`);
      return;
    }

    if (formData.errorMessage.length > LIMITS.errorMessage) {
      alert(`Error message must be ${LIMITS.errorMessage} characters or less.`);
      return;
    }

    setIsSubmitting(true);
    setLastSubmissionTime(Date.now()); // Update rate limit

    try {
      // Security: Sanitize input to prevent email injection
      const sanitizeInput = (input: string): string => {
        return input
          .replace(/[\r\n]/g, ' ') // Remove newlines to prevent email header injection
          .replace(/[<>]/g, '') // Remove potential HTML
          .trim();
      };

      // Collect system information
      const systemInfo = {
        timestamp: new Date().toISOString(),
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        url: window.location.href,
        component: sanitizeInput(formData.component),
      };

      // Add memory info if available
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        (systemInfo as any).memoryUsage = `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`;
      }

      // Create email body with sanitized content
      const emailBody = `
ISSUE REPORT
=============

Subject: ${sanitizeInput(formData.subject)}

Description:
${sanitizeInput(formData.description)}

Error Message:
${sanitizeInput(formData.errorMessage) || 'No error message provided'}

Component:
${sanitizeInput(formData.component) || 'Not specified'}

System Information:
- Platform: ${systemInfo.platform}
- Browser: ${systemInfo.userAgent}
- Language: ${systemInfo.language}
- Screen: ${systemInfo.screenResolution}
- Viewport: ${systemInfo.viewport}
- URL: ${systemInfo.url}
- Timestamp: ${systemInfo.timestamp}
${systemInfo.memoryUsage ? `- Memory: ${systemInfo.memoryUsage}` : ''}

Additional Context:
${JSON.stringify(systemInfo, null, 2)}
      `.trim();

      // Create email parameters
      const subject = encodeURIComponent(`Focule Issue: ${sanitizeInput(formData.subject)}`);
      const body = encodeURIComponent(emailBody);

      // Store email data and show options
      const emailData = {
        gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=help@focule.com&su=${subject}&body=${body}`,
        outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=help@focule.com&subject=${subject}&body=${body}`,
        mailto: `mailto:help@focule.com?subject=${subject}&body=${body}`
      };

      // Store in window for the email options component
      (window as any).emailReportData = emailData;
      setShowEmailOptions(true);
      return; // Don't set submitted yet - wait for user to choose email service

    } catch (error) {
      console.error('Failed to submit issue report:', error);
      alert('Failed to send report. Please try again or contact help@focule.com directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-[var(--focule-bg-secondary)] border border-[var(--focule-border)] rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--focule-heading)] mb-2">
              Report Sent!
            </h3>
            <p className="text-[var(--focule-text-secondary)] mb-4">
              Your issue report has been sent to help@focule.com
            </p>
            <p className="text-sm text-[var(--focule-text-muted)]">
              This window will close automatically...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--focule-bg-secondary)] border border-[var(--focule-border)] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--focule-heading)]">
                  Report an Issue
                </h2>
                <p className="text-sm text-[var(--focule-text-secondary)]">
                  Help us improve Focule by reporting problems
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--focule-text-muted)] hover:text-[var(--focule-text-primary)] transition-colors"
            >
              {Icons.close}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject - Required */}
            <div>
              <label className="block text-sm font-medium text-[var(--focule-text-primary)] mb-2">
                Subject <span className="text-red-500">*</span>
                <span className="text-[var(--focule-text-muted)] text-xs ml-2">
                  ({formData.subject.length}/{LIMITS.subject} characters)
                </span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => {
                  if (e.target.value.length <= LIMITS.subject) {
                    setFormData({ ...formData, subject: e.target.value });
                  }
                }}
                placeholder="Brief description of the issue"
                required
                maxLength={LIMITS.subject}
                className={`w-full px-3 py-2 bg-[var(--focule-bg-primary)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--focule-primary)] ${
                  formData.subject.length >= LIMITS.subject 
                    ? 'border-red-500 text-red-500' 
                    : 'border-[var(--focule-border)]'
                }`}
              />
              {formData.subject.length >= LIMITS.subject && (
                <p className="text-xs text-red-500 mt-1">Character limit reached</p>
              )}
            </div>

            {/* Description - Required */}
            <div>
              <label className="block text-sm font-medium text-[var(--focule-text-primary)] mb-2">
                Description <span className="text-red-500">*</span>
                <span className="text-[var(--focule-text-muted)] text-xs ml-2">
                  ({formData.description.length}/{LIMITS.description} characters)
                </span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= LIMITS.description) {
                    setFormData({ ...formData, description: e.target.value });
                  }
                }}
                placeholder="Please describe what happened and what you expected to happen..."
                rows={4}
                required
                maxLength={LIMITS.description}
                className={`w-full px-3 py-2 bg-[var(--focule-bg-primary)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--focule-primary)] resize-none ${
                  formData.description.length >= LIMITS.description 
                    ? 'border-red-500 text-red-500' 
                    : 'border-[var(--focule-border)]'
                }`}
              />
              {formData.description.length >= LIMITS.description && (
                <p className="text-xs text-red-500 mt-1">Character limit reached</p>
              )}
            </div>

            {/* Error Message - Optional */}
            <div>
              <label className="block text-sm font-medium text-[var(--focule-text-primary)] mb-2">
                Error Message <span className="text-[var(--focule-text-muted)] text-xs">(optional)</span>
                <span className="text-[var(--focule-text-muted)] text-xs ml-2">
                  ({formData.errorMessage.length}/{LIMITS.errorMessage} characters)
                </span>
              </label>
              <textarea
                value={formData.errorMessage}
                onChange={(e) => {
                  if (e.target.value.length <= LIMITS.errorMessage) {
                    setFormData({ ...formData, errorMessage: e.target.value });
                  }
                }}
                placeholder="Paste any error messages here..."
                rows={3}
                maxLength={LIMITS.errorMessage}
                className={`w-full px-3 py-2 bg-[var(--focule-bg-primary)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--focule-primary)] resize-none font-mono text-sm ${
                  formData.errorMessage.length >= LIMITS.errorMessage 
                    ? 'border-red-500 text-red-500' 
                    : 'border-[var(--focule-border)]'
                }`}
              />
              {formData.errorMessage.length >= LIMITS.errorMessage && (
                <p className="text-xs text-red-500 mt-1">Character limit reached</p>
              )}
            </div>

            {/* Image Attachment - Optional */}
            <div>
              <label className="block text-sm font-medium text-[var(--focule-text-primary)] mb-2">
                Screenshot <span className="text-[var(--focule-text-muted)] text-xs">(optional)</span>
              </label>
              
              {!attachedImage ? (
                <div className="border-2 border-dashed border-[var(--focule-border)] rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--focule-bg-primary)] rounded-lg p-2 transition-colors"
                  >
                    {Icons.upload}
                    <span className="text-sm text-[var(--focule-text-secondary)] mt-2">
                      Click to upload screenshot
                    </span>
                    <span className="text-xs text-[var(--focule-text-muted)]">
                      PNG or JPG (max 5MB)
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={attachedImage}
                    alt="Screenshot"
                    className="w-full h-48 object-cover rounded-lg border border-[var(--focule-border)]"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    {Icons.close}
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[var(--focule-border)]">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-[var(--focule-text-secondary)] hover:text-[var(--focule-text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || 
                  isRateLimited || 
                  !formData.subject.trim() || 
                  !formData.description.trim() ||
                  formData.subject.length > LIMITS.subject ||
                  formData.description.length > LIMITS.description ||
                  formData.errorMessage.length > LIMITS.errorMessage
                }
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : isRateLimited ? (
                  <>
                    {Icons.close}
                    <span>Wait 60s</span>
                  </>
                ) : (
                  <>
                    {Icons.send}
                    <span>Send Report</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Rate Limiting Notice */}
            {isRateLimited && (
              <div className="text-center">
                <p className="text-xs text-[var(--focule-text-muted)]">
                  To prevent spam, please wait before submitting another report.
                </p>
                <p className="text-xs text-[var(--focule-text-muted)]">
                  You can submit one report per minute.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Email Service Selection Modal */}
      {showEmailOptions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-[var(--focule-bg-secondary)] border border-[var(--focule-border)] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--focule-heading)] mb-2">
                Choose Email Service
              </h3>
              <p className="text-sm text-[var(--focule-text-secondary)]">
                Select how you'd like to send your issue report
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleEmailChoice('gmail')}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 12c0 3.315 2.685 6 6 6s6-2.685 6-6-2.685-6-6-6-6 2.685-6 6zm12 0c0 3.315-2.685 6-6 6s-6-2.685-6-6 2.685-6 6-6 6 2.685 6 6z"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" fill="#fff"/>
                  <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
                </svg>
                <span>Gmail</span>
              </button>

              <button
                onClick={() => handleEmailChoice('outlook')}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                  <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/>
                </svg>
                <span>Outlook</span>
              </button>

              <button
                onClick={() => handleEmailChoice('mailto')}
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Default Email App</span>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--focule-border)]">
              <button
                onClick={() => setShowEmailOptions(false)}
                className="w-full px-4 py-2 text-[var(--focule-text-secondary)] hover:text-[var(--focule-text-primary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
