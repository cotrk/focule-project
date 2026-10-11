# Runtime asset staging

Binary/runtime assets are intentionally excluded from Git. To prepare them for
a Windows release, run `packaging\scripts\Stage-Windows-Runtime.ps1` with local
paths to the Qwen 3.5 4B GGUF and Whisper `base.pt` checkpoint:

```powershell
powershell -ExecutionPolicy Bypass -File .\packaging\scripts\Stage-Windows-Runtime.ps1 `
  -QwenModelPath 'C:\path\to\qwen3.5-4b.gguf' `
  -WhisperCheckpointPath 'C:\path\to\base.pt'
```

The staging script downloads yt-dlp from its official GitHub release and the
LGPL shared FFmpeg build from BtbN, verifies both executables start, and copies
the supplied model/checkpoint into their expected locations. It does not
download or access any cloud AI service. The Qwen Apache 2.0 license must remain
in `packaging\licenses`.

Expected staged layout:

- `bin\ffmpeg.exe`, its shared DLLs, and `bin\yt-dlp.exe`
- `whisper\base.pt`
- `ollama\qwen3.5-4b.gguf`

`npm run release:win` embeds the first two groups in the NSIS installer. The
Qwen GGUF is kept as a release-folder sidecar and imported into Ollama with the
local `/api/blobs` and `/api/create` endpoints by `Install-QwenModel.ps1`.
