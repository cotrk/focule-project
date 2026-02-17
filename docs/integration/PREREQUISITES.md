# 🔧 System Prerequisites

> Complete setup guide for external tools and dependencies

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Target Audience:** Users, DevOps Engineers

---

## 📋 Overview

Focule requires several external tools for video processing, transcription, and AI content generation. This guide covers installation and configuration for all platforms.

---

## 🛠️ Required Tools

### 1. Node.js & npm
**Purpose:** Runtime environment for the application

| Platform | Installation | Verification |
|----------|--------------|--------------|
| **Windows** | Download from [nodejs.org](https://nodejs.org) | `node --version` |
| **macOS** | `brew install node` | `node --version` |
| **Linux** | `sudo apt install nodejs npm` | `node --version` |

**Required Version:** v18 or higher

---

### 2. Python 3.8+
**Purpose:** Whisper and yt-dlp dependencies

| Platform | Installation | Verification |
|----------|--------------|--------------|
| **Windows** | Download from [python.org](https://python.org) | `python --version` |
| **macOS** | `brew install python@3.11` | `python3 --version` |
| **Linux** | `sudo apt install python3 python3-pip` | `python3 --version` |

---

### 3. FFmpeg
**Purpose:** Audio/video processing

#### Windows
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
# Add to PATH: C:\ffmpeg\bin
```

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

**Verification:** `ffmpeg -version`

---

### 4. Python Packages
**Purpose:** Video downloading and transcription

```bash
pip install yt-dlp openai-whisper
```

**Verification:**
```bash
yt-dlp --version
python -c "import whisper; print('Whisper installed')"
```

---

### 5. Ollama
**Purpose:** Local AI content generation

#### Installation
| Platform | Command |
|----------|---------|
| **Windows** | Download from [ollama.ai](https://ollama.ai) |
| **macOS** | `brew install ollama` |
| **Linux** | `curl -fsSL https://ollama.ai/install.sh | sh` |

#### Start Ollama
```bash
# Start the service
ollama serve

# Pull recommended model
ollama pull llama3.1:8b
```

**Verification:** `ollama list`

---

## 🎯 Model Recommendations

| VRAM | Model | Command | Performance |
|------|-------|---------|-------------|
| **8GB** | llama3.1:8b | `ollama pull llama3.1:8b` | Good |
| **12-16GB** | gemma2:9b | `ollama pull gemma2:9b` | Better |
| **24GB+** | gemma2:27b | `ollama pull gemma2:27b` | Best |

**Note:** Avoid `*-coder` models - optimized for code, not content creation.

---

## 🔍 Troubleshooting

### Common Issues

#### "yt-dlp not found"
```bash
# Reinstall or upgrade
pip install --upgrade yt-dlp

# Or add to PATH manually
where yt-dlp  # Windows
which yt-dlp  # macOS/Linux
```

#### "FFmpeg not in PATH"
```bash
# Windows - add to system PATH
set PATH=%PATH%;C:\ffmpeg\bin

# Test
ffmpeg -version
```

#### "Whisper installation fails"
```bash
# Install with specific version
pip install openai-whisper==20231117

# Or try alternative
pip install git+https://github.com/openai/whisper.git
```

#### "Ollama connection failed"
```bash
# Restart service
ollama serve

# Check if running
ps aux | grep ollama  # macOS/Linux
tasklist | findstr ollama  # Windows
```

---

## 🖥️ Platform-Specific Notes

### Windows
- Use **Python 3.8+** from python.org (not Microsoft Store)
- Add Python and Scripts to PATH during installation
- FFmpeg binaries need manual PATH configuration
- Ollama runs as Windows service

### macOS
- Homebrew recommended for all dependencies
- FFmpeg includes additional codec support
- Ollama runs via launchd
- Python 3 comes pre-installed, but may need update

### Linux
- Use distribution package manager where possible
- FFmpeg from repos may have limited codecs
- Consider building from source for full feature set
- Ollama runs as systemd service

---

## 📊 Performance Optimization

### Hardware Recommendations
- **CPU:** Multi-core processor for faster transcription
- **RAM:** 16GB+ recommended for large video files
- **GPU:** NVIDIA GPU with CUDA for faster Whisper processing
- **Storage:** SSD for faster file I/O

### Software Configuration
```bash
# Whisper GPU acceleration (if available)
export WHISPER_CUDA=1  # Linux/macOS
set WHISPER_CUDA=1     # Windows

# Ollama GPU usage
ollama pull llama3.1:8b  # Automatically uses GPU if available
```

---

## 🔗 Related Documentation

- [External Tools Guide](./EXTERNAL_TOOLS.md) - Detailed tool configuration

---

## 📞 Support

**Installation Issues:** Check platform-specific notes above  
**Tool Problems:** See troubleshooting section  
**Performance Questions:** Review optimization guide  
**Other Issues:** Create GitHub issue with system details

---

*Last Updated: January 2026 • Version 1.0.0*
