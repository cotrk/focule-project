# Focule - Video Transcriber Project Handoff

## Project Status: MVP Complete ✅

**Last Updated:** December 20, 2024  
**Current Version:** 1.0.0

---

## Quick Summary

**Focule** is an Electron desktop application that downloads videos from YouTube and Twitch, extracts audio, transcribes using Whisper, and generates social media marketing content via Ollama LLMs.

**Tagline:** *Transform video into insight*

### Core Workflow

1. User enters a YouTube or Twitch URL
2. App downloads video using `yt-dlp`
3. Audio extracted with `FFmpeg`
4. Transcription via Whisper (local models)
5. AI generates hooks, descriptions, hashtags, keywords, filenames, and image prompts using Ollama

---

## Brand Identity

### Colors (from Brand Kit)

| Name | Hex | Usage |
|------|-----|-------|
| Electric Cyan | `#00F0FF` | Primary actions, highlights |
| Void Purple | `#BD00FF` | Accents, gradients |
| Ore Black | `#0B0B0D` | Background |
| Surface | `#161618` | Cards, elevated surfaces |

### Typography

| Role | Font | Weight |
|------|------|--------|
| Headings | Montserrat | Bold / ExtraBold |
| Body Text | Lato | Light / Regular / Bold |
| UI / Buttons | Nunito Sans | Light / Regular / SemiBold |

### Brand Gradient

```css
linear-gradient(135deg, #00F0FF 0%, #BD00FF 100%)
```

### Contact

- **Support:** <help@focule.com> (public)
- **Billing:** <billing@focule.com> (private, for Stripe/payments)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS |
| **Backend** | Electron 28 + Node.js |
| **Video Download** | yt-dlp (external binary) |
| **Audio Processing** | FFmpeg (external binary) |
| **Transcription** | Whisper.cpp (local models) |
| **AI Content** | Ollama (local LLM server) |
| **Build** | Vite + electron-builder |

---

## Project Structure

```
focule/
├── electron/                    # Main process (backend)
│   ├── main.ts                  # Electron main entry, IPC handlers
│   ├── preload.ts               # Context bridge for renderer
│   ├── services/
│   │   ├── downloader.ts        # yt-dlp video downloading
│   │   ├── ffmpeg.ts            # Audio extraction
│   │   ├── transcriber.ts       # Whisper transcription
│   │   ├── ollama.ts            # LLM content generation
│   │   └── prerequisites.ts     # Dependency checking
│   └── utils/
│       └── paths.ts             # Centralized executable path finding
├── src/                         # Renderer process (frontend)
│   ├── App.tsx                  # Main React component
│   ├── components/
│   │   ├── URLInput.tsx         # URL entry form
│   │   ├── ProgressBar.tsx      # Processing progress
│   │   ├── ResultsView.tsx      # Display generated content
│   │   ├── SettingsPanel.tsx    # Model/path configuration
│   │   └── PrerequisitesCheck.tsx # Dependency status
│   ├── hooks/
│   │   └── useTranscription.ts  # Main transcription logic hook
│   └── index.css                # Tailwind + custom CSS variables
├── build/                       # App icons
├── public/                      # Static assets
└── package.json
```

---

## Key Files Deep Dive

### `electron/utils/paths.ts`

**Purpose:** Centralized utility for finding FFmpeg and yt-dlp executables across different installation locations.

**Key Functions:**

- `findFFmpeg()` - Returns path to ffmpeg executable
- `findYtDlp()` - Returns path to yt-dlp executable
- `findFFmpegDir()` - Returns directory containing ffmpeg (for Whisper)

**Search Locations:**

1. User-configured custom paths (from settings)
2. Common system paths (PATH environment)
3. Known installation directories (Chocolatey, Scoop, local packages)

### `electron/services/downloader.ts`

**Purpose:** Handles video downloading via yt-dlp with FFmpeg integration for stream merging.

**Key Features:**

- Downloads best quality video+audio
- Uses `--ffmpeg-location` to ensure proper stream merging
- Handles "already downloaded" files gracefully
- Filters out partial stream files (`.f137.mp4`, `.f140.m4a`)

**Recent Fixes:**

- Added FFmpeg location parameter to fix stream merging issues
- Improved file detection for cached downloads
- Added check for "already downloaded" messages from yt-dlp

### `electron/services/ollama.ts`

**Purpose:** Interfaces with Ollama API to generate social media content from transcripts.

**Key Features:**

- Model availability checking
- Model categorization by tier (lightweight/balanced/performance)
- Structured prompt for consistent output
- **NEW:** Generates 3 hook/title variations instead of 1

**Output Structure (`SocialContent`):**

```typescript
{
  hooks: string[];        // 3 hook/title options (markdown stripped)
  description: string;    // YouTube-style description
  hashtags: string[];     // 10 hashtags
  keywords: string[];     // SEO keywords
  filenames: string[];    // File naming suggestions
  imagePrompts: string[]; // Text-to-image prompts for thumbnails
}
```

**Hook Parsing Formats Supported:**

- Numbered: `1. Hook text` or `1) Hook text`
- Bullet: `- Hook text` or `• Hook text`
- Quoted: `"Hook text"`
- Plain text fallback

### `src/components/ResultsView.tsx`

**Purpose:** Displays generated content with copy-to-clipboard functionality.

**Features:**

- Tab interface (Results / Transcript)
- Clickable code blocks with copy button
- **NEW:** Displays all 3 hook variations with character counts
- **NEW:** Model info header showing Content Model + Whisper Model used
- **NEW:** Automatic markdown stripping for clean copy/paste
- Displays hashtags, keywords, filenames, image prompts

---

## Issues Resolved (This Session)

### 1. yt-dlp Stream Merging Failure

**Problem:** Downloaded videos had no audio or wouldn't play. FFmpeg errors during audio extraction.  
**Root Cause:** yt-dlp couldn't find FFmpeg to merge separate video/audio streams.  
**Solution:** Added `--ffmpeg-location` argument to yt-dlp commands.

### 2. Cached File Detection

**Problem:** "Could not find downloaded video" error when re-processing same URL.  
**Root Cause:** File detection required recent modification time, but yt-dlp skips re-downloading existing files.  
**Solution:** Check for "already been downloaded" message in yt-dlp output; relax mtime requirements for cached files.

### 3. Path Finding Duplication

**Problem:** FFmpeg/yt-dlp path logic duplicated across multiple services.  
**Solution:** Created centralized `electron/utils/paths.ts` utility.

### 4. Hook Parsing Too Strict

**Problem:** "Hook / Title Options (0 variations)" - parser only handled numbered lists.  
**Solution:** Updated parser to handle multiple formats: `1.`, `1)`, `-`, `•`, quoted text, and plain text.

### 5. Markdown in Hook Output

**Problem:** Hooks contained markdown formatting (`**bold**`) making copy/paste messy.  
**Solution:** Added `stripMarkdown()` helper function to clean output for display and copying.

---

## Testing Results

### Platforms Tested

- ✅ YouTube videos (public)
- ✅ Twitch VODs
- ❌ YouTube channel videos (may have restrictions)

### Models Tested

| Model | Game Recognition | Content Quality | Notes |
|-------|------------------|-----------------|-------|
| gemini-3-flash-preview:cloud | ✅ Excellent | ✅ Excellent | Correctly identified Warhammer Online |
| gpt-oss:20b-cloud | ⚠️ Partial | ✅ Good | Got player names right, wrong game |
| mistral-nemo:12b | ❌ Poor | ⚠️ Fair | Hallucinated game and duration |
| qwen2.5-coder:7b | ❌ Generic | ⚠️ Fair | Coding model, not ideal for content |

**Recommendation:** Use `gemini-3-flash-preview:cloud` for best results.

### Recommended Models by Hardware

| VRAM | Recommended Models | Command |
|------|-------------------|---------|
| **8GB** (RTX 2080, 3070) | llama3.1:8b, llama3.2:3b, mistral:7b | `ollama pull llama3.1:8b` |
| **12-16GB** (RTX 3080, 4070) | gemma2:9b, qwen2.5:14b | `ollama pull gemma2:9b` |
| **24GB+** (RTX 4090) | gemma2:27b, qwen2.5:32b | `ollama pull gemma2:27b` |
| **Cloud** | gemini-3-flash-preview:cloud | Best quality, no local compute |

**Avoid for content generation:** `*-coder` variants (optimized for code, not creative content)

---

## Known Issues / Tech Debt

### Functional Issues

- [ ] "Run Again" re-downloads video instead of using cache
- [ ] No way to regenerate just the AI content (must re-process everything)
- [ ] Error messages could be more user-friendly

### Code Quality

- [ ] Some TypeScript `any` types that could be stricter
- [ ] No unit tests
- [ ] Console logging could be more structured

### UX Issues

- [ ] Progress bar doesn't show granular step progress
- [ ] No dark/light theme toggle (currently dark only)
- [ ] Settings panel could be more intuitive

---

## Suggested Next Steps

### Phase 2: Polish & Optimization (Priority)

- [ ] **Smart caching:** Skip re-download if video exists, go straight to AI step
- [ ] **Regenerate button:** Re-run Ollama only (fastest iteration)
- [x] **Model info display:** Show which models were used in results ✅
- [ ] **Progress improvements:** Show current step name, estimated time
- [ ] **Error UX:** User-friendly error messages with suggested fixes

### Phase 3: UI/UX Improvements

- [ ] **Theme toggle:** Light/dark mode
- [ ] **Responsive design:** Better scaling for different window sizes
- [ ] **Animation polish:** Smoother transitions, loading states
- [ ] **Keyboard shortcuts:** Copy, paste, run, etc.

### Phase 4: Advanced Features

- [ ] **Batch processing:** Queue multiple URLs
- [ ] **Custom prompts:** Let users customize the AI prompt template
- [ ] **Export options:** Export to JSON, Markdown, or directly to clipboard
- [ ] **History:** View past transcriptions
- [ ] **Platform presets:** Optimized prompts for YouTube and Twitch

---

## How to Run

### Prerequisites

1. **Node.js** (v18+)
2. **FFmpeg** installed and in PATH (or set custom path in settings)
3. **yt-dlp** installed (`pip install yt-dlp`)
4. **Ollama** running locally (`ollama serve`)
5. **Whisper model** downloaded via Ollama (e.g., `ollama pull whisper`)

### Development

```bash
npm install
npm run dev
```

### Production Build

```bash
npm run build
```

---

## Environment Details

### Windows Paths (Common)

- FFmpeg: `C:\ProgramData\chocolatey\bin\ffmpeg.exe`
- yt-dlp: `C:\Users\{user}\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts\yt-dlp.exe`

### App Data Locations

- Settings: `%APPDATA%/focule/settings.json`
- Downloaded videos: `%APPDATA%/focule/videos/`
- Extracted audio: `%APPDATA%/focule/audio/`
- Transcripts: `%APPDATA%/focule/transcripts/`

---

## API Reference

### IPC Channels (Main → Renderer)

| Channel | Description |
|---------|-------------|
| `transcription:progress` | Processing status updates |
| `transcription:complete` | Final results with transcript + social content |
| `transcription:error` | Error messages |

### IPC Channels (Renderer → Main)

| Channel | Description |
|---------|-------------|
| `start-transcription` | Begin processing a URL |
| `get-settings` | Retrieve current settings |
| `save-settings` | Persist settings to disk |
| `check-prerequisites` | Check FFmpeg/yt-dlp/Ollama availability |

---

## Contact / Handoff Notes

This project was developed through iterative testing with real YouTube and Twitch content. The core functionality is stable and tested. The main areas for improvement are:

1. **Performance:** Caching to skip unnecessary re-downloads
2. **UX:** Better feedback, error handling, and visual polish
3. **Features:** Regenerate button, batch processing, custom prompts

For UI/UX improvements, focus on `src/components/` and `src/index.css`.  
For backend features, focus on `electron/services/`.

The app uses a custom CSS variable system for theming (see `--focule-*` variables in `index.css`).

### CSS Variables Reference

```css
/* Brand Colors */
--focule-cyan: #00F0FF;
--focule-purple: #BD00FF;
--focule-gradient: linear-gradient(135deg, #00F0FF 0%, #BD00FF 100%);

/* Backgrounds */
--focule-bg-primary: #0B0B0D;
--focule-bg-secondary: #121214;
--focule-bg-tertiary: #161618;
--focule-surface: #1F1F23;

/* Typography */
--focule-heading: #FFFFFF;
--focule-text-primary: #E5E5E5;
--focule-text-secondary: #A1A1AA;
--focule-text-muted: #71717A;
```

### Component Classes

- `.focule-btn` - Primary gradient button
- `.focule-btn-secondary` - Cyan outline button
- `.focule-btn-ghost` - Transparent button
- `.focule-card` - Glassmorphism card
- `.focule-input` - Styled input field
- `.focule-logo` - Gradient text logo
- `.font-montserrat`, `.font-lato`, `.font-nunito` - Font utilities

---

---

## Recent Changes (This Session)

### Features Added

- ✅ **3 Hook/Title Variations** - AI generates 3 options instead of 1
- ✅ **Model Info Header** - Shows Content Model + Whisper Model used in results
- ✅ **Markdown Stripping** - Clean plain text for easy copy/paste
- ✅ **Improved Hook Parsing** - Handles multiple output formats from different models
- ✅ **White-Label UI** - User-friendly labels (no technical jargon)
- ✅ **Brand Design System** - Full brand kit applied (colors, typography, components)
- ✅ **Version Info** - App version displayed in footer

### Brand Design Updates (December 20, 2024)

- **Typography:** Montserrat (headings), Lato (body), Nunito Sans (UI)
- **Colors:** Electric Cyan `#00F0FF`, Void Purple `#BD00FF`
- **Gradient buttons:** Cyan → Purple primary actions
- **Glassmorphism cards:** Subtle backdrop blur effects
- **Logo styling:** Gradient "F" + italic "OCULE"

### White-Label Changes

| Before | After |
|--------|-------|
| "AI Model (Ollama)" | "AI Content Engine" |
| "Whisper Model" | "Voice Recognition Quality" |
| "Lightweight / Balanced / Performance" | "Fast / Recommended / Premium" |
| Technical error messages | User-friendly messages |

### Code Changes

- `electron/services/ollama.ts` - Updated prompt for 3 hooks, improved parser
- `src/components/ResultsView.tsx` - Model info header, stripMarkdown helper
- `src/hooks/useTranscription.ts` - Pass model names to results
- `src/App.tsx` - Pass model props to ResultsView, version info, brand logo styling
- `src/index.css` - Complete brand design system (colors, typography, components)
- `index.html` - Google Fonts for Montserrat, Lato, Nunito Sans
- `src/components/SettingsPanel.tsx` - User-friendly tier labels and model names

---

## Development Workflow

### Repository Structure

```
D:\Workshop\Dev\Projects\
├── video-transcriber/     ← Dev/Pre-production (working folder)
└── Focule_Repo/           ← Production/GitHub (clean releases)
```

### Workflow

1. Develop in `video-transcriber/`
2. Test changes thoroughly
3. Copy updated files to `Focule_Repo/`
4. Run `npm install` in `Focule_Repo/`
5. Build and push to GitHub

### Files to Copy (exclude these)

- `node_modules/` - Reinstall with npm install
- `dist/`, `dist-electron/` - Rebuilt on build
- `release/` - Build output
- `PROJECT_HANDOFF.md` - Dev notes only

---

## Suggested Future Enhancements

### UI Themes

- Light/Dark/Neon mode toggle in Settings
- Could use CSS variables already in place

### Landing Page

- Brand kit includes interactive demo concept ("Alchemy Engine")
- Ready for Gumroad/LemonSqueezy integration

### Payments Setup (Deferred)

- Stripe or LemonSqueezy
- Price point: $50
- Billing email: <billing@focule.com>

---

*Generated: December 20, 2024*
