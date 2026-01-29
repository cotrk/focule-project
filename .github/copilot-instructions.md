<!-- Copilot / AI agent guidance for the Focule (video-transcriber) repo -->
# Focule — Copilot Instructions

Purpose: help AI coding agents be immediately productive in this repo by documenting architecture, dev workflows, integration points, and concrete code patterns to reference.

**Quick Start**
- **Install:** `npm install`
- **Run dev:** `npm run dev` (spawns Vite and Electron via `concurrently` / `wait-on`)
- **Build:** `npm run build` (runs `tsc` for `electron/`, generates icons, builds Vite bundle, then `electron-builder`)

**High-level Architecture**
- Frontend: React + TypeScript in `src/` (UI components in `src/components`, hook-based state in `src/hooks`). See `src/hooks/useTranscription.ts` for the main orchestration of IPC calls.
- Desktop host: Electron code under `electron/` (main process entry in `electron/main.ts` and services in `electron/services`). Electron compiles via `tsc -p electron/tsconfig.json` (see `package.json` scripts `build:electron`).
- Native tools & AI: external binaries/services include `ffmpeg`, `yt-dlp` (Python), Whisper (Python), and Ollama (local LLM at http://localhost:11434).

**Key Integration Points**
- IPC bridge: UI calls `window.electronAPI.*` (see `src/hooks/useTranscription.ts`) — agent edits must preserve the exposed API surface in `electron/preload.ts`.
- Transcription: `electron/services/transcriber.ts` creates a temporary Python script and runs Whisper via a child-process; it expects a working Python binary and `openai-whisper` installed. Long-running operations and large models are expected (2hr timeout in file).
- AI content generation: `electron/services/ollama.ts` calls Ollama HTTP endpoints (default port 11434). It parses free-text or JSON responses into `SocialContent` objects — prefer returning JSON where possible.

**Developer Workflows & Commands**
- Dev (fast feedback): `npm run dev` — waits for Vite (`http://localhost:5173`) then launches Electron. Use DevTools in Electron's renderer for UI debugging and the terminal for main-process logs.
- Build (release): `npm run build` — runs `build:electron` (TS compile), `build:icons`, `vite build`, then `electron-builder` packaging.
- If editing Electron TypeScript, compile errors will appear from `tsc -p electron/tsconfig.json` or when running `npm run build`.

**Patterns & Conventions (repo-specific)**
- Progress & events: UI listens to `onDownloadProgress` and `onTranscribeProgress` (see `src/hooks/useTranscription.ts`) and then calls `removeAllListeners` for cleanup. When adding new events follow this same lifecycle.
- Long-running native calls: `electron/services/transcriber.ts` uses child_process to call Python with large `maxBuffer` and long `timeout`. Avoid blocking the main process; prefer streaming progress via small JSON lines from the child process (this file already parses JSON lines).
- External-tool discovery: the services try multiple platform commands (e.g., `python`, `python3`, `py`) and add `FFmpeg` to PATH if found (see `electron/services/transcriber.ts` and `electron/utils/paths.ts`). Follow the same discovery patterns when adding new tooling.
- Robust parsing: `electron/services/ollama.ts` attempts JSON parse first, then falls back to line-based heuristics. Prefer emitting structured JSON from the AI prompts to simplify parsing.

**Files to Reference (examples)**
- `src/hooks/useTranscription.ts` — UI orchestration and IPC usage
- `electron/services/transcriber.ts` — Whisper child-process orchestration, progress JSON, SRT creation
- `electron/services/ollama.ts` — Ollama HTTP calls, response parsing into `SocialContent`
- `package.json` — dev / build scripts (notably `dev`, `build:electron`, `build`)

**Runtime & Prerequisites**
- The app assumes system-level prerequisites: Python (for `yt-dlp` and Whisper), `ffmpeg` in PATH, `yt-dlp` and `openai-whisper` pip packages, and Ollama running locally with models pulled. See `README.md` for exact install commands.
- When testing content-generation flows, ensure `ollama serve` is running and `ollama list` shows a pulled model.

**Safe edits checklist for AI agents**
1. Preserve or update the `window.electronAPI` surface in `electron/preload.ts` when changing IPC event names.
2. When modifying `transcriber.ts`, keep the JSON-line progress protocol compatible (emit {status, percent} JSON lines). UI expects `percent` and `status` fields.
3. Avoid changing large timeouts or buffer sizes without context — long timeouts are intentional for CPU-based model runs.
4. Unit tests are not present in the repo; prefer small manual runs (`npm run dev`) to validate changes.

If anything here is unclear or you want more detail (e.g., exact IPC channel names or a walkthrough of `preload.ts`), tell me which area to expand and I will update this file.
