# 🚀 Focule

**Transform video into insight with AI-powered local processing**

A production-ready desktop application that converts video content into transcriptions, social media posts, and actionable insights using advanced AI technology.

---

## 💎 **Value Proposition**

### **For Content Creators & Businesses**
- **50x faster** content repurposing workflow
- **Privacy-first**: All processing happens locally on your machine
- **Professional output**: Studio-quality transcriptions and social media content
- **Multi-platform**: YouTube, Twitch, and local video support

### **For Enterprise & Custom Solutions**
- **White-label ready**: Custom branding and integration capabilities
- **API access**: Programmatic integration for enterprise workflows
- **Scalable architecture**: Batch processing and team collaboration features
- **On-premise deployment**: Complete data control and security

---

## 🎯 **Core Capabilities**

### **AI-Powered Content Pipeline**
```
Video Input → Transcription → AI Analysis → Multi-Format Output
```

#### **Intelligent Processing**
- **Whisper AI**: Industry-leading speech-to-text accuracy
- **Ollama Integration**: Local LLM for content generation
- **Smart Context**: AI understands video content for relevant outputs
- **Quality Assurance**: Professional formatting and error correction

#### **Content Generation**
- **Viral Hooks**: 3 compelling title options per video
- **SEO Descriptions**: Optimized content for search visibility
- **Social Media Posts**: Platform-specific content formatting
- **Hashtag Strategy**: Trending and relevant keyword suggestions
- **Visual Prompts**: AI-generated thumbnail concepts

---

## �️ **Technical Architecture**

### **Enterprise-Grade Stack**
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Electron 28 + Node.js
- **AI Processing**: Whisper + Ollama (local models)
- **Video Processing**: FFmpeg + yt-dlp
- **Build System**: Vite + electron-builder

### **Security & Privacy**
- **Local Processing**: Zero data transmission to external servers
- **Session Isolation**: Temporary file management and cleanup
- **Input Validation**: Comprehensive security protocols
- **Cross-Platform**: Windows, macOS, Linux support

---

## 💼 **Business Opportunities**

### **Acquisition & Investment Highlights**
- **Production Ready**: v1.0.0 with comprehensive documentation
- **Scalable Technology**: Modular architecture for rapid feature development
- **Growing Market**: Content creation and AI tools market expansion
- **IP Portfolio**: Proprietary workflows and user experience innovations

### **Customization & Enterprise**
- **White-Label Solutions**: Custom branding for agencies and enterprises
- **API Integration**: Connect with existing content management systems
- **Batch Processing**: High-volume workflows for media companies
- **Team Features**: Collaboration tools and permission management

---

## 📊 **Market Position**

### **Competitive Advantages**
- **Privacy-First**: No cloud dependencies or data sharing
- **Cost-Effective**: No subscription fees or API costs
- **Professional Quality**: Enterprise-grade output formatting
- **User Experience**: Intuitive interface with advanced features

### **Target Markets**
- **Content Creators**: YouTubers, streamers, podcasters
- **Marketing Agencies**: Content repurposing at scale
- **Enterprise**: Corporate training and communications
- **Media Companies**: News organizations and production houses

---

## 🚀 **Getting Started**

### **Quick Installation**
```bash
# Clone the private repository
git clone [private-repo-url]

# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build
```

### **System Requirements**
- **Node.js** 18+ 
- **Python** 3.8+ (for Whisper)
- **FFmpeg** (video processing)
- **Ollama** (AI models - optional)

*Comprehensive setup guide available in `/docs`*

---

## 📚 **Documentation**

- **[📖 User Guide](./docs/README.md)** - Complete documentation
- **[🔧 Development Setup](./docs/development/SETUP.md)** - Technical documentation
- **[🏗️ Architecture](./docs/development/ARCHITECTURE.md)** - System design
- **[🎨 Design System](./docs/design/DESIGN_SYSTEM.md)** - UI/UX guidelines

---

## 💡 **Partnership & Custom Development**

### **Enterprise Solutions**
- **Custom Integrations**: Connect with your existing tools
- **White-Label Licensing**: Deploy under your brand
- **Feature Development**: Custom workflow solutions
- **Support & Maintenance**: Enterprise-level SLA options

### **Contact Information**
- **Business Inquiries**: [business@focule.com](mailto:business@focule.com)
- **Technical Partnerships**: [partnerships@focule.com](mailto:partnerships@focule.com)
- **Investment Opportunities**: [investors@focule.com](mailto:investors@focule.com)

---

## 🔮 **Roadmap**

### **Version 1.1.0** (Q2 2026)
- Advanced audio processing options
- Custom model management
- Batch processing capabilities
- Enhanced export formats

### **Version 1.2.0** (Q3 2026)
- Real-time transcription
- Video preview functionality
- Advanced search in transcripts
- Cloud integration (optional)

---

## � **License & Legal**

**Current Status**: Production Ready v1.0.0  
**Repository Type**: Private development workspace  
**Commercial Use**: Available for licensing and acquisition  

*For licensing inquiries, partnership opportunities, or acquisition discussions, please contact the business development team.*

---

**🌐 [Visit Focule.com](https://focule.com) | 📧 [Contact Us](mailto:info@focule.com)**

*Transform your video content workflow with AI-powered local processing.*

## Repository Structure

Focule uses a **dual-repository architecture** for optimal security and organization:

### 📁 focule_private.git (This Repository)
**Development workspace** - Contains the complete desktop application source code

```
video-transcriber/
├── src/                    # React frontend components
├── electron/               # Electron main process & services
├── docs/                   # Comprehensive documentation
├── build/                  # Build assets and icons
├── release/                # Build outputs (gitignored)
└── scripts/                # Build and utility scripts
```

### 🌐 focule_public.git (Separate Repository)
**Marketing website** - Public-facing website and promotional content

```
focule-public/
├── public/                 # Static marketing assets
├── marketing/             # Content and copy
└── deployment/            # Website deployment configs
```

**Why Separate Repositories?**
- **Security**: Commercial build artifacts never exposed publicly
- **Clarity**: Clean separation between product and marketing
- **Maintenance**: Independent deployment cycles
- **Professionalism**: Public repository contains only marketing content

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS |
| **Backend** | Electron 28 + Node.js |
| **Video Download** | yt-dlp |
| **Audio Processing** | FFmpeg |
| **Transcription** | OpenAI Whisper (local) |
| **AI Content** | Ollama (local LLM) |
| **Build** | Vite + electron-builder |

## Prerequisites

Before running this application, you need to install:

1. **Node.js** (v18 or higher) and npm
2. **Python 3.8+** with pip
3. **FFmpeg** - [Download here](https://ffmpeg.org/download.html) or install via package manager
4. **yt-dlp** - Install with: `pip install yt-dlp`
5. **OpenAI Whisper** - Install with: `pip install openai-whisper`
6. **Ollama** - [Download and install](https://ollama.ai/)
   - After installing, pull a model: `ollama pull llama3.1:8b`

### Installing Prerequisites

#### Windows
```bash
# Install Python packages
pip install yt-dlp openai-whisper

# Install FFmpeg (using chocolatey)
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html and add to PATH

# Install Ollama from https://ollama.ai/
# Then pull a model
ollama pull llama3.1:8b
```

#### macOS
```bash
# Install via Homebrew
brew install ffmpeg yt-dlp
pip install openai-whisper

# Install Ollama
brew install ollama
ollama pull llama3.1:8b
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg python3-pip
pip3 install yt-dlp openai-whisper

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.1:8b
```

## Installation

1. Clone or download this repository
2. Install dependencies:
```bash
npm install
```

## Development

To run the app in development mode:

```bash
npm run dev
```

This will:
- Start the Vite dev server for the React frontend
- Launch Electron with hot reload

## Building

To build the application for production:

```bash
npm run build
```

This will compile TypeScript, build the React app, and package it with Electron Builder.

## Usage

1. **Start the application**
2. **Check prerequisites** - The app will verify all dependencies are installed
3. **Enter a video URL** - Supports:
   - YouTube: `https://www.youtube.com/watch?v=...` or `https://youtu.be/...`
   - Twitch: `https://www.twitch.tv/videos/...`
4. **Configure settings** (optional):
   - Click the Settings button to adjust:
     - Output directory for saved files
     - Voice Recognition Quality (Whisper model)
     - AI Content Engine (Ollama model)
5. **Start processing** - Click "Start" to begin
6. **View results** - See hooks, descriptions, hashtags, and more
7. **Copy or Save** - One-click copy or export all files

## Recommended AI Models

| VRAM | Model | Command |
|------|-------|---------|
| **8GB** (RTX 2080, 3070) | llama3.1:8b | `ollama pull llama3.1:8b` |
| **12-16GB** (RTX 3080, 4070) | gemma2:9b | `ollama pull gemma2:9b` |
| **24GB+** (RTX 4090) | gemma2:27b | `ollama pull gemma2:27b` |

**Tip:** Avoid `*-coder` models — they're optimized for code, not content creation.

## Output Files

The application generates:

- `{title}_transcript.txt` - Plain text transcript
- `{title}_transcript_timestamped.txt` - Transcript with timestamps
- `{title}_social_content.json` - All generated marketing content
- `{title}.mp4` - Downloaded video file

## Troubleshooting

### "Video downloader not found"
- Make sure yt-dlp is installed: `pip install --upgrade yt-dlp`
- Or place the yt-dlp executable in your PATH

### "Audio extraction failed"
- Install FFmpeg and ensure it's in your PATH
- Windows: `choco install ffmpeg`

### "Transcription failed"
- Run: `pip install openai-whisper`
- For large files, use a smaller quality setting (Fast or Balanced)

### "AI engine is not running"
- Make sure Ollama is running: `ollama serve`
- Check that the model is installed: `ollama list`
- Pull the model if needed: `ollama pull llama3.1:8b`

### Transcription is slow
- Use "Fast" quality for quick results
- "Maximum" quality is most accurate but slowest

## Support

- **Email:** help@focule.com
- **Website:** [focule.com](https://focule.com)

## License

MIT

---

*Version 1.0.0 • December 2024*

```
video-transcriber
├─ assets
│  ├─ branding
│  │  ├─ focule_brand_kit.html
│  │  ├─ icons
│  │  │  ├─ avatar.png
│  │  │  ├─ icon-blk-bg.png
│  │  │  └─ icon-trans-bg.png
│  │  └─ logos
│  │     ├─ focule-logo-blk-background.png
│  │     ├─ focule-logo-trans-bg.png
│  │     ├─ focule-logo-transparent-background.png
│  │     └─ focule-logo-wyt-background.png
│  └─ icon.svg
├─ build
│  ├─ icon-128.png
│  ├─ icon-16.png
│  ├─ icon-24.png
│  ├─ icon-256.png
│  ├─ icon-32.png
│  ├─ icon-48.png
│  ├─ icon-512.png
│  ├─ icon-64.png
│  ├─ icon.ico
│  ├─ icon.png
│  └─ icon.svg
├─ electron
│  ├─ main.ts
│  ├─ preload.ts
│  ├─ services
│  │  ├─ downloader.ts
│  │  ├─ ffmpeg.ts
│  │  ├─ ollama.ts
│  │  ├─ prerequisites.ts
│  │  └─ transcriber.ts
│  ├─ tsconfig.json
│  └─ utils
│     └─ paths.ts
├─ focule.code-workspace
├─ index.html
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ PROJECT_HANDOFF.md
├─ public
│  ├─ favicon.png
│  ├─ favicon.svg
│  ├─ logo-large.png
│  ├─ logo.png
│  └─ logo.svg
├─ README.md
├─ release
│  ├─ builder-debug.yml
│  ├─ builder-effective-config.yaml
│  ├─ Focule Setup 1.0.0.exe
│  ├─ Focule Setup 1.0.0.exe.blockmap
│  └─ win-unpacked
│     ├─ chrome_100_percent.pak
│     ├─ chrome_200_percent.pak
│     ├─ d3dcompiler_47.dll
│     ├─ ffmpeg.dll
│     ├─ Focule.exe
│     ├─ icudtl.dat
│     ├─ libEGL.dll
│     ├─ libGLESv2.dll
│     ├─ LICENSE.electron.txt
│     ├─ LICENSES.chromium.html
│     ├─ locales
│     │  ├─ af.pak
│     │  ├─ am.pak
│     │  ├─ ar.pak
│     │  ├─ bg.pak
│     │  ├─ bn.pak
│     │  ├─ ca.pak
│     │  ├─ cs.pak
│     │  ├─ da.pak
│     │  ├─ de.pak
│     │  ├─ el.pak
│     │  ├─ en-GB.pak
│     │  ├─ en-US.pak
│     │  ├─ es-419.pak
│     │  ├─ es.pak
│     │  ├─ et.pak
│     │  ├─ fa.pak
│     │  ├─ fi.pak
│     │  ├─ fil.pak
│     │  ├─ fr.pak
│     │  ├─ gu.pak
│     │  ├─ he.pak
│     │  ├─ hi.pak
│     │  ├─ hr.pak
│     │  ├─ hu.pak
│     │  ├─ id.pak
│     │  ├─ it.pak
│     │  ├─ ja.pak
│     │  ├─ kn.pak
│     │  ├─ ko.pak
│     │  ├─ lt.pak
│     │  ├─ lv.pak
│     │  ├─ ml.pak
│     │  ├─ mr.pak
│     │  ├─ ms.pak
│     │  ├─ nb.pak
│     │  ├─ nl.pak
│     │  ├─ pl.pak
│     │  ├─ pt-BR.pak
│     │  ├─ pt-PT.pak
│     │  ├─ ro.pak
│     │  ├─ ru.pak
│     │  ├─ sk.pak
│     │  ├─ sl.pak
│     │  ├─ sr.pak
│     │  ├─ sv.pak
│     │  ├─ sw.pak
│     │  ├─ ta.pak
│     │  ├─ te.pak
│     │  ├─ th.pak
│     │  ├─ tr.pak
│     │  ├─ uk.pak
│     │  ├─ ur.pak
│     │  ├─ vi.pak
│     │  ├─ zh-CN.pak
│     │  └─ zh-TW.pak
│     ├─ resources
│     │  ├─ app.asar
│     │  │  └─ package.json
│     │  └─ elevate.exe
│     ├─ resources.pak
│     ├─ snapshot_blob.bin
│     ├─ v8_context_snapshot.bin
│     ├─ vk_swiftshader.dll
│     ├─ vk_swiftshader_icd.json
│     └─ vulkan-1.dll
├─ scripts
│  └─ generate-icons.js
├─ src
│  ├─ App.tsx
│  ├─ components
│  │  ├─ PrerequisitesCheck.tsx
│  │  ├─ ProgressBar.tsx
│  │  ├─ ResultsView.tsx
│  │  ├─ SettingsPanel.tsx
│  │  └─ URLInput.tsx
│  ├─ hooks
│  │  └─ useTranscription.ts
│  ├─ index.css
│  ├─ main.tsx
│  └─ vite-env.d.ts
├─ store_info.txt
├─ tailwind.config.js
├─ tsconfig.json
├─ tsconfig.node.json
└─ vite.config.ts