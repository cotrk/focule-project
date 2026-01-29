# 🛠️ Development Setup

> Complete development environment setup for Focule Video Transcriber

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Target Audience:** Developers

---

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd video-transcriber
npm install

# Start development
npm run dev
```

---

## 📋 Prerequisites

### Required Software

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| **Node.js** | v18+ | Runtime environment | [nodejs.org](https://nodejs.org) |
| **Python** | 3.8+ | Whisper/yt-dlp | [python.org](https://python.org) |
| **FFmpeg** | Latest | Audio processing | [ffmpeg.org](https://ffmpeg.org) |
| **Ollama** | Latest | AI content generation | [ollama.ai](https://ollama.ai) |

### Python Packages

```bash
pip install yt-dlp openai-whisper
```

### Ollama Models

```bash
# Recommended model for most users
ollama pull llama3.1:8b

# High-performance options
ollama pull gemma2:9b    # 12-16GB VRAM
ollama pull gemma2:27b   # 24GB+ VRAM
```

---

## 🏗️ Project Structure

```
video-transcriber/
├── electron/           # Electron main process
│   ├── services/      # Core backend services
│   └── utils/         # Utility functions
├── src/               # React frontend
│   ├── components/    # UI components
│   ├── hooks/         # Custom React hooks
│   └── types/         # TypeScript definitions
├── docs/              # Documentation
└── build/             # Build assets
```

---

## 🔧 Development Commands

| Command | Purpose | Description |
|---------|---------|-------------|
| `npm run dev` | Development | Starts Vite + Electron with hot reload |
| `npm run dev:vite` | Frontend only | Vite dev server on localhost:5173 |
| `npm run dev:electron` | Backend only | Electron with dev tools |
| `npm run build` | Production | Full build for distribution |
| `npm run build:electron` | Backend | Compile Electron TypeScript |
| `npm run build:icons` | Assets | Generate app icons |

---

## 🧩 Architecture Overview

### Frontend (React + TypeScript)
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **State Management:** React hooks + context

### Backend (Electron + Node.js)
- **Runtime:** Electron 28
- **Services:** Modular service architecture
- **IPC:** Type-safe communication contract
- **Security:** Context isolation + preload scripts

### External Integrations
- **Video Download:** yt-dlp (Python)
- **Audio Processing:** FFmpeg
- **Transcription:** OpenAI Whisper (Python)
- **AI Content:** Ollama (Local LLM)

---

## 🔒 Security Considerations

### IPC Security
- Context isolation enabled
- Preload script for secure API exposure
- Type-safe IPC contracts in `electron/ipc-contract.ts`

### File System Access
- Session-based isolation
- Path sanitization utilities
- User-controlled output directories

### External Tool Execution
- Validated binary paths
- Sandboxed execution environments
- Error handling with user-friendly messages

---

## 🐛 Common Development Issues

### "Module not found" errors
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Electron fails to start
```bash
# Rebuild electron
npm run build:electron
npm run dev
```

### External tools not found
- Verify PATH includes FFmpeg and yt-dlp
- Check Python environment for Whisper
- Ensure Ollama is running: `ollama serve`

---

## 📝 Development Workflow

### 1. Feature Development
1. Create feature branch from `main`
2. Implement changes in `src/` or `electron/`
3. Update TypeScript types if needed
4. Test with `npm run dev`
5. Update documentation

### 2. Code Style
- ESLint configuration in `.eslintrc.json`
- Prettier for formatting
- TypeScript strict mode enabled

### 3. Testing
- Manual testing in development mode
- Verify external tool integrations
- Test cross-platform compatibility

---

## 🔗 Related Documentation

- [Architecture](./ARCHITECTURE.md) - Deep dive into system design
- [API Reference](./API_REFERENCE.md) - IPC contracts and services
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [Contributing](./CONTRIBUTING.md) - Contribution guidelines

---

## 📞 Support

**Development Issues:** Check troubleshooting guide or create GitHub issue  
**External Tool Problems:** See [Integration docs](../integration/EXTERNAL_TOOLS.md)  
**Questions:** Contact development team

---

*Last Updated: January 2026 • Version 1.0.0*
