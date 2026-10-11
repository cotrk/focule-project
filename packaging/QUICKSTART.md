# Focule 1.1.1 for Windows

Focule turns videos and audio recordings into transcripts and social content.
Transcription and AI generation run locally. AI generation uses only Ollama's
local API at `http://127.0.0.1:11434/api/`; Focule does not use cloud AI APIs.

## Install and first run

1. Run `Focule-Setup-1.1.1.exe` and follow the installer.
2. Install and start Ollama from <https://ollama.com/download>.
3. In this folder, right-click `Install-QwenModel.ps1` and choose **Run with
   PowerShell**, or open PowerShell here and run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\Install-QwenModel.ps1
   ```

   This imports the included Qwen 3.5 4B model through Ollama's local `/api/blobs`
   and `/api/create` endpoints. The model uses about 3.4 GB of disk space in
   addition to the release folder. No `ollama pull` or cloud inference is needed.

   If you downloaded the model as multiple GitHub release assets instead, put
   every `qwen3.5-4b.gguf.part*` file in the release-assets folder, run
   `Join-QwenModelParts.ps1`, then run `Install-QwenModel.ps1`.
4. Run `Setup-Whisper.ps1` to install Python/Whisper if they are not already
   available. The Whisper base checkpoint is bundled with the app; the Python
   runtime and PyTorch are installed locally by this setup step.
5. Launch Focule and confirm the local AI model is selected in **Settings**.

FFmpeg, yt-dlp, and the Whisper `base` checkpoint are included in the installer.
Ollama and Python/Whisper are separate local prerequisites. Internet access is
needed only for installing Ollama/Python dependencies or downloading source
videos; audio processing and AI inference are local.

## Use

Paste a supported video URL or choose a local audio/video file, select a Whisper
quality and local Ollama model in Settings, then start processing. The bundled
Whisper base model can process a typical 15-minute recording, though runtime
depends on hardware and a 15-minute recording is not guaranteed to produce
reliable speech if it contains long silence, clipped audio, or noise.

Focule transcribes speech; it does not translate the spoken language. Silence,
clipping, download, timeout, and generation failures are reported in the app.
Completed transcripts are retained if social-content generation fails.

## Hardware and licensing

The bundled Qwen 3.5 4B model is provided under Apache License 2.0. It is a
lightweight starting model; quality varies by language and transcript. Its
recommended context budget is 16K tokens.

See `licenses/THIRD-PARTY-NOTICES.md` and the accompanying license texts for
third-party terms and source links. `SHA256SUMS.txt` contains hashes for the
release files. `Focule-LICENSE.txt` contains Focule's MIT license.
