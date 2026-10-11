param(
    [string]$Version = '1.1.0'
)

$ErrorActionPreference = 'Stop'
$packagingRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $packagingRoot
$releaseRoot = Join-Path $repoRoot 'release'
$bundleRoot = Join-Path $releaseRoot "Focule-$Version-Windows-x64"
$installer = Join-Path $releaseRoot "Focule Setup $Version.exe"

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

if (-not (Test-Path -LiteralPath $installer)) {
    throw "Installer not found at '$installer'. Build the Windows NSIS installer before assembling the release folder."
}

New-Item -ItemType Directory -Force -Path `
    (Join-Path $bundleRoot 'runtime\ollama'), `
    (Join-Path $bundleRoot 'licenses') | Out-Null

Copy-Item -LiteralPath $installer -Destination (Join-Path $bundleRoot "Focule-Setup-$Version.exe")
Copy-Item -LiteralPath (Join-Path $repoRoot 'LICENSE') -Destination (Join-Path $bundleRoot 'Focule-LICENSE.txt')
Copy-Item -LiteralPath (Join-Path $packagingRoot 'runtime\ollama\qwen3.5-4b.gguf') -Destination (Join-Path $bundleRoot 'runtime\ollama')
Copy-Item -Path (Join-Path $packagingRoot 'licenses\*') -Destination (Join-Path $bundleRoot 'licenses') -Force
Copy-Item -LiteralPath (Join-Path $packagingRoot 'scripts\Install-QwenModel.ps1') -Destination $bundleRoot
Copy-Item -LiteralPath (Join-Path $packagingRoot 'scripts\Setup-Whisper.ps1') -Destination $bundleRoot
Copy-Item -LiteralPath (Join-Path $packagingRoot 'QUICKSTART.md') -Destination (Join-Path $bundleRoot 'README.md')

$hashLines = Get-ChildItem -LiteralPath $bundleRoot -File -Recurse |
    Where-Object { $_.Name -ne 'SHA256SUMS.txt' } |
    Sort-Object FullName |
    ForEach-Object {
        $relativePath = $_.FullName.Substring($bundleRoot.Length).TrimStart('\', '/')
        $hash = Get-Sha256Hex $_.FullName
        "$hash  $relativePath"
    }
$hashLines | Set-Content -LiteralPath (Join-Path $bundleRoot 'SHA256SUMS.txt') -Encoding ascii

Write-Host "Release folder assembled: $bundleRoot"
