param(
    [string]$OutputPath = (Join-Path $PSScriptRoot 'runtime\ollama\qwen3.5-4b.gguf'),
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$partPaths = @(
    Get-ChildItem -LiteralPath $PSScriptRoot -File -Filter 'qwen3.5-4b.gguf.part*' |
        Sort-Object Name
)
$checksumPath = Join-Path $PSScriptRoot 'SHA256SUMS.txt'
$modelHashPath = Join-Path $PSScriptRoot 'qwen3.5-4b.gguf.sha256'

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

if ($partPaths.Count -lt 2 -or -not (Test-Path -LiteralPath $checksumPath) -or
    -not (Test-Path -LiteralPath $modelHashPath)) {
    throw 'Download all Qwen model part files and the accompanying checksum files into this folder.'
}

for ($index = 0; $index -lt $partPaths.Count; $index++) {
    $expectedName = 'qwen3.5-4b.gguf.part{0:D2}' -f ($index + 1)
    if ($partPaths[$index].Name -ne $expectedName) {
        throw "Model parts are incomplete or out of order. Expected '$expectedName'."
    }
}

$checksums = @{}
foreach ($line in Get-Content -LiteralPath $checksumPath) {
    if ($line -match '^([a-fA-F0-9]{64})\s+(.+)$') {
        $checksums[$Matches[2]] = $Matches[1].ToLowerInvariant()
    }
}

foreach ($part in $partPaths) {
    if (-not $checksums.ContainsKey($part.Name)) {
        throw "No checksum was provided for '$($part.Name)'."
    }

    $actualHash = Get-Sha256Hex $part.FullName
    if ($actualHash -ne $checksums[$part.Name]) {
        throw "Checksum mismatch for '$($part.Name)'. Download that part again."
    }
}

$outputPath = [System.IO.Path]::GetFullPath($OutputPath)
if ((Test-Path -LiteralPath $outputPath) -and -not $Force) {
    throw "Output already exists at '$outputPath'. Remove it or pass -Force to replace it."
}

$outputDirectory = Split-Path -Parent $outputPath
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
$output = [System.IO.File]::Open($outputPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
try {
    foreach ($part in $partPaths) {
        $input = [System.IO.File]::OpenRead($part.FullName)
        try {
            $input.CopyTo($output)
        } finally {
            $input.Dispose()
        }
    }
} finally {
    $output.Dispose()
}

$expectedModelHash = (Get-Content -LiteralPath $modelHashPath -Raw).Trim().ToLowerInvariant()
$actualModelHash = Get-Sha256Hex $outputPath
if ($actualModelHash -ne $expectedModelHash) {
    Remove-Item -LiteralPath $outputPath -Force
    throw 'The assembled model checksum does not match. Re-download all model parts and try again.'
}

Write-Host "Qwen model assembled and verified: $outputPath"
