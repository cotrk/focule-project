# Focule

**Turn your old content into new social media content.**

Focule is a free, local-first Windows desktop app that downloads videos, extracts
audio, transcribes speech with Whisper, and creates social content with Ollama.
It can also help analyze competitor videos for content opportunities.

## Windows release

The Windows installer bundles FFmpeg, yt-dlp, and the Whisper `base` checkpoint.
The release folder also contains a Qwen 3.5 4B GGUF model and a PowerShell script
that imports it through Ollama's local API. Ollama and Python/Whisper are installed
separately; the release folder includes a Whisper setup script.

See [`packaging/QUICKSTART.md`](packaging/QUICKSTART.md) for installation,
first-run, licensing, and troubleshooting instructions. Third-party license
texts and notices are in [`packaging/licenses`](packaging/licenses).

AI generation communicates only with Ollama's local API at
`http://127.0.0.1:11434/api/`. Focule does not send prompts or transcripts to
cloud AI providers. Ollama model import and inference run locally. Downloading a
source video and installing Python packages require internet access.

## Features

- Download supported public video links with yt-dlp
- Extract audio locally with FFmpeg
- Transcribe audio locally with OpenAI Whisper
- Generate hooks, descriptions, hashtags, keywords, and thumbnail prompts using
  a locally installed Ollama model
- Export transcripts and generated content
- Use local audio/video files as well as supported video URLs

Focule transcribes speech in its spoken language; it does not translate speech.
Transcription quality depends on recording clarity, silence, clipping, language,
model size, and computer performance. The bundled Whisper `base` model is a
lightweight starting point, not a guarantee of accurate results for every
15-minute recording.

## Run from source

Requirements: Node.js 18+ and npm. To run the desktop app in development:

```powershell
npm install
npm run dev
```

To build the Windows NSIS installer:

```powershell
npm run release:win
npm run package:win-release
npm run package:github-release
```

The resulting installer is in `release/`; `npm run package:win-release`
assembles the organized installer/model/licenses folder beside it. Runtime
binary assets are downloaded/staged separately and intentionally excluded from
Git. See [`packaging/runtime/README.md`](packaging/runtime/README.md) for
staging instructions. `npm run package:github-release` assembles a separate
GitHub asset folder and splits the large model into checksummed files below
GitHub's 2 GB per-asset limit.

## Project

- **Frontend:** React 18, TypeScript, Vite
- **Desktop:** Electron
- **Video download:** yt-dlp
- **Audio processing:** FFmpeg
- **Transcription:** OpenAI Whisper
- **Local AI:** Ollama `/api/*` on `127.0.0.1:11434`

Focule source code is licensed under MIT. See
[`packaging/licenses/THIRD-PARTY-NOTICES.md`](packaging/licenses/THIRD-PARTY-NOTICES.md)
for bundled third-party components and their separate license terms.
