param(
    [Parameter(Mandatory = $true)]
    [string]$QwenModelPath,
    [Parameter(Mandatory = $true)]
    [string]$WhisperCheckpointPath
)

$ErrorActionPreference = 'Stop'
$packagingRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $packagingRoot 'runtime'
$licenseRoot = Join-Path $packagingRoot 'licenses'
$binRoot = Join-Path $runtimeRoot 'bin'
$whisperRoot = Join-Path $runtimeRoot 'whisper'
$ollamaRoot = Join-Path $runtimeRoot 'ollama'
$workRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("focule-runtime-" + [guid]::NewGuid())

foreach ($sourcePath in @($QwenModelPath, $WhisperCheckpointPath)) {
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
        throw "Runtime asset not found: $sourcePath"
    }
}
if (-not (Test-Path -LiteralPath (Join-Path $licenseRoot 'Qwen3.5-LICENSE.txt'))) {
    throw 'The Qwen Apache 2.0 license is missing from packaging/licenses.'
}

New-Item -ItemType Directory -Force -Path $binRoot, $whisperRoot, $ollamaRoot, $workRoot | Out-Null

try {
    $ffmpegArchive = Join-Path $workRoot 'ffmpeg-lgpl.zip'
    $ffmpegUrl = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-lgpl-shared.zip'
    Invoke-WebRequest -Uri $ffmpegUrl -OutFile $ffmpegArchive
    Expand-Archive -LiteralPath $ffmpegArchive -DestinationPath (Join-Path $workRoot 'ffmpeg') -Force
    $ffmpegPackage = Get-ChildItem -LiteralPath (Join-Path $workRoot 'ffmpeg') -Directory | Select-Object -First 1
    if (-not $ffmpegPackage -or -not (Test-Path -LiteralPath (Join-Path $ffmpegPackage.FullName 'bin\ffmpeg.exe'))) {
        throw 'The downloaded FFmpeg archive did not contain the expected Windows shared build.'
    }
    Copy-Item -Path (Join-Path $ffmpegPackage.FullName 'bin\*') -Destination $binRoot -Force
    Copy-Item -LiteralPath (Join-Path $ffmpegPackage.FullName 'LICENSE.txt') -Destination (Join-Path $licenseRoot 'FFmpeg-LICENSE.txt') -Force

    Invoke-WebRequest `
        -Uri 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' `
        -OutFile (Join-Path $binRoot 'yt-dlp.exe')
    Invoke-WebRequest `
        -Uri 'https://raw.githubusercontent.com/yt-dlp/yt-dlp/master/LICENSE' `
        -OutFile (Join-Path $licenseRoot 'yt-dlp-LICENSE.txt')

    Copy-Item -LiteralPath $QwenModelPath -Destination (Join-Path $ollamaRoot 'qwen3.5-4b.gguf') -Force
    Copy-Item -LiteralPath $WhisperCheckpointPath -Destination (Join-Path $whisperRoot 'base.pt') -Force

    $ffmpegVersion = & (Join-Path $binRoot 'ffmpeg.exe') -version 2>&1 | Select-Object -First 1
    if ($LASTEXITCODE -ne 0 -or $ffmpegVersion -notmatch 'ffmpeg version') {
        throw 'The staged FFmpeg executable failed its version check.'
    }
    $ytDlpVersion = & (Join-Path $binRoot 'yt-dlp.exe') --version
    if ($LASTEXITCODE -ne 0) {
        throw 'The staged yt-dlp executable failed its version check.'
    }

    Write-Host "Staged FFmpeg: $ffmpegVersion"
    Write-Host "Staged yt-dlp: $ytDlpVersion"
    Write-Host 'Staged Qwen 3.5 4B and Whisper base assets.'
} finally {
    if (Test-Path -LiteralPath $workRoot) {
        Remove-Item -LiteralPath $workRoot -Recurse -Force
    }
}
