# Third-party notices

Focule bundles the following third-party components or assets. Their licenses
apply to those components and do not replace Focule's MIT license.

| Component | Bundled item | License | Source |
|---|---|---|---|
| FFmpeg | Windows shared build (`ffmpeg.exe` and DLLs) | GNU LGPL v3 | [BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds) |
| yt-dlp | Windows executable | The Unlicense | [yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp) |
| OpenAI Whisper | `base.pt` checkpoint | MIT | [openai/whisper](https://github.com/openai/whisper) |
| Qwen 3.5 | `qwen3.5-4b.gguf` model | Apache License 2.0 | [Qwen model family](https://ollama.com/library/qwen3.5) |

License texts for the bundled versions are included in this directory.

## FFmpeg source and build

The included FFmpeg build is the LGPL shared build, not the GPL-enabled Gyan
build. The shared libraries remain separate from Focule and are loaded by
`ffmpeg.exe`. The bundled version reports FFmpeg commit
`b5902e69c7` (`N-127367-gb5902e69c7-20261011`); the corresponding FFmpeg source
is available at
[FFmpeg commit b5902e69c7](https://github.com/FFmpeg/FFmpeg/commit/b5902e69c7).
The build scripts and build configuration are maintained by
[BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds). The release bundle
includes the LGPL v3 license text. Run `ffmpeg.exe -version` and
`ffmpeg.exe -buildconf` to inspect the shipped binary's exact version and
configuration.

FFmpeg is not part of Focule's MIT-licensed source code. Do not replace this
shared LGPL build with a GPL-enabled build without updating these notices and
meeting the applicable source-distribution obligations.

## Runtime dependencies

Ollama and Python/PyTorch are not redistributed in this package. Install them
from their respective official projects. Focule communicates with Ollama only
through its local HTTP API on `127.0.0.1:11434`.
