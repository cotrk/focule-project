param(
    [string]$Version = '1.1.0',
    [long]$PartSizeBytes = 1800000000
)

$ErrorActionPreference = 'Stop'
$packagingRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $packagingRoot
$releaseRoot = Join-Path $repoRoot 'release'
$bundleRoot = Join-Path $releaseRoot "Focule-$Version-Windows-x64"
$assetsRoot = Join-Path $releaseRoot "Focule-$Version-GitHub-Assets"
$modelPath = Join-Path $bundleRoot 'runtime\ollama\qwen3.5-4b.gguf'
$installerPath = Join-Path $bundleRoot "Focule-Setup-$Version.exe"

function Get-Sha256Hex([string]$filePath) {
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    $stream = [System.IO.File]::OpenRead($filePath)
    try {
        return [System.BitConverter]::ToString($algorithm.ComputeHash($stream)).Replace('-', '').ToLowerInvariant()
    } finally {
        $stream.Dispose()
        $algorithm.Dispose()
    }
}

if (-not (Test-Path -LiteralPath $modelPath) -or -not (Test-Path -LiteralPath $installerPath)) {
    throw "The Windows release folder is incomplete. Run Assemble-Windows-Release.ps1 first."
}
if ($PartSizeBytes -le 0 -or $PartSizeBytes -ge 2000000000) {
    throw 'PartSizeBytes must be greater than zero and below GitHub''s 2 GB per-asset limit.'
}

New-Item -ItemType Directory -Force -Path $assetsRoot, (Join-Path $assetsRoot 'licenses') | Out-Null
Copy-Item -LiteralPath $installerPath -Destination $assetsRoot -Force
Copy-Item -LiteralPath (Join-Path $bundleRoot 'Focule-LICENSE.txt') -Destination $assetsRoot -Force
Copy-Item -LiteralPath (Join-Path $bundleRoot 'Install-QwenModel.ps1') -Destination $assetsRoot -Force
Copy-Item -LiteralPath (Join-Path $packagingRoot 'scripts\Join-QwenModelParts.ps1') -Destination $assetsRoot -Force
Copy-Item -LiteralPath (Join-Path $bundleRoot 'Setup-Whisper.ps1') -Destination $assetsRoot -Force
Copy-Item -Path (Join-Path $bundleRoot 'licenses\*') -Destination (Join-Path $assetsRoot 'licenses') -Force

$inputStream = [System.IO.File]::OpenRead($modelPath)
$buffer = New-Object byte[] (8MB)
$partNumber = 0
$partPaths = [System.Collections.Generic.List[string]]::new()
try {
    while ($inputStream.Position -lt $inputStream.Length) {
        $partNumber++
        $partPath = Join-Path $assetsRoot ('qwen3.5-4b.gguf.part{0:D2}' -f $partNumber)
        $partStream = [System.IO.File]::Open($partPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
        $partPaths.Add($partPath)
        try {
            $partBytes = 0L
            while ($partBytes -lt $PartSizeBytes -and $inputStream.Position -lt $inputStream.Length) {
                $requested = [int][Math]::Min($buffer.Length, $PartSizeBytes - $partBytes)
                $read = $inputStream.Read($buffer, 0, $requested)
                if ($read -eq 0) { break }
                $partStream.Write($buffer, 0, $read)
                $partBytes += $read
            }
        } finally {
            $partStream.Dispose()
        }
    }
} finally {
    $inputStream.Dispose()
}

(Get-Sha256Hex $modelPath) | Set-Content -LiteralPath (Join-Path $assetsRoot 'qwen3.5-4b.gguf.sha256') -Encoding ascii

$readme = @"
# Focule $Version Windows release assets

1. Run ``Focule-Setup-$Version.exe``.
2. Install and start Ollama.
3. Download every ``qwen3.5-4b.gguf.part*`` file into this folder.
4. Run ``powershell -ExecutionPolicy Bypass -File .\Join-QwenModelParts.ps1``.
   The script checks every part and the assembled model before saving it to
   ``runtime\ollama\qwen3.5-4b.gguf``.
5. Run ``Install-QwenModel.ps1`` to import it through Ollama's local API.
6. Run ``Setup-Whisper.ps1`` if Python and Whisper are not installed, then launch
   Focule.

The split model parts are each below GitHub's 2 GB asset limit. Review
``SHA256SUMS.txt`` and ``licenses\THIRD-PARTY-NOTICES.md`` before installation.
Inference uses only Ollama at ``127.0.0.1:11434``; no cloud AI service is used.
"@
$readme | Set-Content -LiteralPath (Join-Path $assetsRoot 'README.md') -Encoding utf8

$hashLines = Get-ChildItem -LiteralPath $assetsRoot -File -Recurse |
    Where-Object { $_.Name -ne 'SHA256SUMS.txt' } |
    Sort-Object FullName |
    ForEach-Object {
        $relativePath = $_.FullName.Substring($assetsRoot.Length).TrimStart('\', '/')
        "$(Get-Sha256Hex $_.FullName)  $relativePath"
    }
$hashLines | Set-Content -LiteralPath (Join-Path $assetsRoot 'SHA256SUMS.txt') -Encoding ascii

Write-Host "GitHub release assets assembled: $assetsRoot"
Write-Host "Model parts created: $($partPaths.Count)"
