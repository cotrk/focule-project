# 🏗️ System Architecture

> Complete architectural overview of Focule Video Transcriber

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Target Audience:** Developers, Architects, DevOps

---

## 🎯 Architecture Overview

Focule is a **desktop-first Electron application** that combines modern web technologies with powerful external tools to provide local video transcription and AI-powered content generation.

### Core Design Principles

1. **Privacy-First**: All processing happens locally on user machines
2. **Security-First**: Sandboxed execution with strict input validation
3. **Modular Design**: Service-oriented architecture with clear boundaries
4. **Cross-Platform**: Windows, macOS, and Linux support
5. **Progressive Enhancement**: Graceful degradation when tools are missing

---

## 🏢 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FOCULE DESKTOP APP                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript + Tailwind)                   │
│  ├── User Interface Components                              │
│  ├── State Management (React Hooks)                        │
│  ├── Real-time Progress Tracking                           │
│  └── Error Boundaries                                      │
├─────────────────────────────────────────────────────────────┤
│  IPC Layer (Electron)                                      │
│  ├── Type-safe Communication                               │
│  ├── Security Validation                                    │
│  └── Error Handling                                         │
├─────────────────────────────────────────────────────────────┤
│  Backend Services (Node.js)                                 │
│  ├── Video Download (yt-dlp)                               │
│  ├── Audio Processing (FFmpeg)                             │
│  ├── Transcription (Whisper)                               │
│  ├── AI Content (Ollama)                                   │
│  └── File Management                                       │
├─────────────────────────────────────────────────────────────┤
│  External Tools                                             │
│  ├── yt-dlp (Python) - Video downloading                   │
│  ├── FFmpeg - Audio/video processing                       │
│  ├── Whisper (Python) - Speech transcription                │
│  └── Ollama - Local AI inference                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Component Architecture

### Frontend Layer (React)

#### Component Hierarchy
```
App.tsx
├── URLInput.tsx
├── PrerequisitesCheckRedesigned.tsx
├── ProgressBar.tsx (with dynamic tips)
├── ResultsViewRedesigned.tsx
│   ├── Transcript Tab
│   ├── Social Media Tab
│   └── Technical Info Tab
└── SettingsPanel.tsx
```

#### State Management
- **Local State**: Component-specific UI state
- **Custom Hooks**: Business logic encapsulation
  - `useTranscriptionEnhanced.tsx`: Enhanced transcription workflow
  - `useKeyboardShortcuts.tsx`: Power user features
- **Error Boundaries**: Graceful error handling and recovery

#### Key Features
- **Dynamic Tips System**: 50+ educational facts during processing
- **Tabbed Results**: Three-tier hierarchy (Primary → Secondary → Tertiary)
- **Real-time Progress**: Live updates with contextual information
- **Keyboard Shortcuts**: Ctrl+K for URL paste, other productivity shortcuts

---

### IPC Layer (Electron)

#### Security Architecture
```typescript
// Type-safe IPC contracts
interface IPCContract {
  'video:download': (url: string) => Promise<string>;
  'audio:extract': (videoPath: string) => Promise<string>;
  'transcription:start': (audioPath: string, model: string) => Promise<string>;
  'ai:generate': (transcript: string, model: string) => Promise<SocialContent>;
  'system:check-prerequisites': () => Promise<PrerequisitesStatus>;
}
```

#### Security Features
- **Context Isolation**: Separate contexts for renderer and main processes
- **Preload Scripts**: Secure API exposure to frontend
- **Input Validation**: All IPC calls validated before execution
- **Path Sanitization**: Prevents directory traversal attacks
- **Session Isolation**: Temporary files isolated per session

#### Error Handling
- **Graceful Degradation**: Fallbacks when external tools unavailable
- **User-Friendly Messages**: Technical errors translated to plain language
- **Recovery Mechanisms**: Automatic retry and manual recovery options

---

### Backend Services (Node.js)

#### Service Architecture
```typescript
// Service interface pattern
interface VideoProcessingService {
  download(url: string): Promise<string>;
  extractAudio(videoPath: string): Promise<string>;
  transcribe(audioPath: string, model: string): Promise<string>;
  generateContent(transcript: string, model: string): Promise<SocialContent>;
}
```

#### Core Services

##### 1. Video Download Service
```typescript
class VideoDownloadService {
  async download(url: string): Promise<string> {
    // yt-dlp integration with progress tracking
    // Platform-specific binary detection
    // Error recovery and retry logic
  }
}
```

##### 2. Audio Processing Service
```typescript
class AudioProcessingService {
  async extractAudio(videoPath: string): Promise<string> {
    // FFmpeg integration for audio extraction
    // Format optimization for transcription
    // Progress callbacks with detailed status
  }
}
```

##### 3. Transcription Service
```typescript
class TranscriptionService {
  async transcribe(audioPath: string, model: string): Promise<string> {
    // Whisper Python integration
    // Model selection and optimization
    // Real-time progress reporting
  }
}
```

##### 4. AI Content Service
```typescript
class AIContentService {
  async generateContent(transcript: string, model: string): Promise<SocialContent> {
    // Ollama integration with multiple models
    // Structured prompt engineering
    // Content validation and filtering
  }
}
```

---

## 🔒 Security Architecture

### Defense in Depth

#### 1. Application Layer
- **Input Validation**: All user inputs sanitized
- **Output Encoding**: XSS prevention in UI rendering
- **CSRF Protection**: State management prevents CSRF

#### 2. IPC Layer
- **Context Isolation**: Renderer process sandboxed
- **Preload Scripts**: Controlled API exposure
- **Type Safety**: TypeScript prevents runtime type errors

#### 3. System Layer
- **Path Sanitization**: Prevents file system attacks
- **Process Isolation**: External tools run in separate processes
- **Resource Limits**: Memory and CPU usage monitoring

#### 4. Data Layer
- **Session Isolation**: Temporary files per session
- **Secure Cleanup**: Automatic file deletion
- **Privacy Protection**: No data leaves user machine

### Security Patterns

#### Input Validation Pipeline
```typescript
const validateURL = (url: string): ValidationResult => {
  // 1. Type checking
  // 2. Format validation (regex)
  // 3. Domain allowlist
  // 4. URL parsing
  // 5. Security scanning
};
```

#### Path Sanitization
```typescript
const sanitizePath = (path: string): string => {
  // 1. Normalize path separators
  // 2. Resolve relative paths
  // 3. Check against allowlist
  // 4. Validate existence
  // 5. Permission checks
};
```

---

## 🗂️ File System Architecture

### Directory Structure
```
focule-data/
├── sessions/           # Per-session temporary files
│   └── [session-id]/
│       ├── downloads/
│       ├── audio/
│       ├── transcripts/
│       └── exports/
├── cache/              # Persistent cache
│   ├── models/         # Downloaded AI models
│   └── temp/           # Temporary files
└── logs/               # Application logs
    ├── app.log
    ├── errors.log
    └── security.log
```

### File Management Patterns

#### Session-Based Isolation
```typescript
class SessionManager {
  createSession(): string {
    // Generate unique session ID
    // Create session directory
    // Set up cleanup timer
  }
  
  cleanupSession(sessionId: string): void {
    // Remove session directory
    // Clear temporary files
    // Update logs
  }
}
```

#### Secure File Operations
```typescript
class SecureFileManager {
  async writeFile(sessionId: string, filename: string, data: Buffer): Promise<string> {
    // Validate session
    // Sanitize filename
    // Write to session directory
    // Set appropriate permissions
  }
}
```

---

## 🔧 External Tool Integration

### Tool Detection & Management
```typescript
class ToolManager {
  async detectTools(): Promise<ToolStatus> {
    return {
      ytDLP: await this.detectYTDLP(),
      ffmpeg: await this.detectFFmpeg(),
      whisper: await this.detectWhisper(),
      ollama: await this.detectOllama()
    };
  }
  
  async installTool(tool: string): Promise<boolean> {
    // Platform-specific installation
    // Progress tracking
    // Error handling
  }
}
```

### Cross-Platform Support

#### Windows
```typescript
class WindowsToolManager extends ToolManager {
  protected async detectYTDLP(): Promise<boolean> {
    // Check PATH
    // Check AppData/Local
    // Check Python packages
  }
}
```

#### macOS
```typescript
class MacOSToolManager extends ToolManager {
  protected async detectYTDLP(): Promise<boolean> {
    // Check PATH
    // Check Homebrew
    // Check Python packages
  }
}
```

#### Linux
```typescript
class LinuxToolManager extends ToolManager {
  protected async detectYTDLP(): Promise<boolean> {
    // Check PATH
    // Check package managers
    // Check Python packages
  }
}
```

---

## 📊 Performance Architecture

### Optimization Strategies

#### 1. Async Processing
```typescript
class ProcessingPipeline {
  async processVideo(url: string): Promise<Results> {
    const download = this.downloadService.download(url);
    const audioExtraction = download.then(path => this.audioService.extract(path));
    const transcription = audioExtraction.then(audio => this.transcriptionService.transcribe(audio));
    const contentGeneration = transcription.then(transcript => this.aiService.generate(transcript));
    
    return Promise.all([download, audioExtraction, transcription, contentGeneration]);
  }
}
```

#### 2. Memory Management
- **Stream Processing**: Large files processed in chunks
- **Garbage Collection**: Explicit cleanup of temporary objects
- **Resource Monitoring**: Memory usage tracking and limits

#### 3. Caching Strategy
- **Model Caching**: AI models cached locally
- **Result Caching**: Transcription results cached
- **Tool Detection**: Tool availability cached

---

## 🔍 Monitoring & Logging

### Logging Architecture
```typescript
class Logger {
  info(message: string, metadata?: any): void {
    // Structured logging with metadata
    // Log rotation and cleanup
    // Performance metrics
  }
  
  error(error: Error, context?: any): void {
    // Error stack traces
    // Context information
    // Security incident logging
  }
}
```

### Performance Monitoring
- **Processing Times**: Track each processing stage
- **Memory Usage**: Monitor memory consumption
- **Error Rates**: Track error frequency and types
- **User Actions**: Log user interactions for analytics

---

## 🚀 Deployment Architecture

### Build Process
```typescript
// Build pipeline
1. TypeScript Compilation
2. React Build (Vite)
3. Electron Packaging
4. Icon Generation
5. Code Signing (Windows/macOS)
6. Notarization (macOS)
7. Distribution Package Creation
```

### Repository Structure
```
focule_private.git/          # Development workspace
├── src/                      # Source code
├── electron/                 # Electron main process
├── docs/                     # Documentation
├── build/                    # Build assets
└── release/                  # Build outputs

focule_public.git/            # Marketing website
├── public/                   # Static assets
├── marketing/                # Marketing content
└── deployment/               # Deployment configs
```

### Security Measures
- **Code Signing**: All executables signed
- **Notarization**: macOS apps notarized
- **Sandboxing**: Application sandboxed where possible
- **Updates**: Secure update mechanism

---

## 🔮 Future Architecture Considerations

### Scalability
- **Plugin Architecture**: Support for third-party plugins
- **Cloud Integration**: Optional cloud processing
- **Multi-tenant**: Team collaboration features

### Performance
- **GPU Acceleration**: CUDA/OpenCL support
- **Parallel Processing**: Multi-core utilization
- **Streaming**: Real-time transcription

### Security
- **Zero-Trust Architecture**: Enhanced security model
- **Hardware Security**: TPM integration
- **Audit Logging**: Comprehensive audit trails

---

## 🔗 Related Documentation

- [Development Setup](./development/SETUP.md) - Environment configuration
- [API Reference](./development/API_REFERENCE.md) - IPC contracts and services
- [Security Guide](./development/SECURITY.md) - Detailed security patterns
- [External Tools](./integration/EXTERNAL_TOOLS.md) - Tool integration details

---

## 📞 Architecture Support

**Architecture Questions:** Contact development team  
**Security Concerns:** Create security issue with `architecture` label  
**Performance Issues:** Include performance metrics in issue reports

---

*Last Updated: January 2026 • Version 1.0.0*
