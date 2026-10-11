$ErrorActionPreference = 'Stop'

$baseUrl = 'http://127.0.0.1:11434'
$modelName = 'qwen3.5:4b'
$assetPaths = @(
    (Join-Path $PSScriptRoot 'runtime\ollama\qwen3.5-4b.gguf'),
    (Join-Path $PSScriptRoot '..\runtime\ollama\qwen3.5-4b.gguf')
)
$modelPath = $assetPaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
$licensePaths = @(
    (Join-Path $PSScriptRoot 'licenses\Qwen3.5-LICENSE.txt'),
    (Join-Path $PSScriptRoot '..\licenses\Qwen3.5-LICENSE.txt')
)
$licensePath = $licensePaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

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

if (-not $modelPath -or -not $licensePath) {
    throw 'The bundled Qwen model or its license is missing. Re-extract the Focule release folder and try again.'
}

try {
    $tags = Invoke-RestMethod -Uri "$baseUrl/api/tags" -TimeoutSec 5
} catch {
    throw 'Ollama is not responding at 127.0.0.1:11434. Install and start Ollama, then run this script again.'
}

if ($tags.models.name -contains $modelName) {
    Write-Host "$modelName is already installed in Ollama."
    exit 0
}

$digest = Get-Sha256Hex $modelPath
$httpClient = [System.Net.Http.HttpClient]::new()
$httpClient.Timeout = [System.Threading.Timeout]::InfiniteTimeSpan

try {
    $headRequest = [System.Net.Http.HttpRequestMessage]::new(
        [System.Net.Http.HttpMethod]::Head,
        "$baseUrl/api/blobs/sha256:$digest"
    )
    $headResponse = $httpClient.SendAsync($headRequest).GetAwaiter().GetResult()

    if ($headResponse.StatusCode -eq [System.Net.HttpStatusCode]::NotFound) {
        Write-Host 'Importing the bundled model into Ollama. This copies about 3.4 GB and may take several minutes.'
        $fileStream = [System.IO.File]::OpenRead($modelPath)
        try {
            $upload = [System.Net.Http.StreamContent]::new($fileStream)
            $upload.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('application/octet-stream')
            $uploadResponse = $httpClient.PostAsync("$baseUrl/api/blobs/sha256:$digest", $upload).GetAwaiter().GetResult()
            if (-not $uploadResponse.IsSuccessStatusCode) {
                $body = $uploadResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult()
                throw "Ollama rejected the model upload ($([int]$uploadResponse.StatusCode)): $body"
            }
        } finally {
            $fileStream.Dispose()
        }
    } elseif (-not $headResponse.IsSuccessStatusCode) {
        throw "Ollama could not check the model blob ($([int]$headResponse.StatusCode))."
    }

    $licenseText = Get-Content -LiteralPath $licensePath -Raw
    $createBody = @{
        model = $modelName
        files = @{ 'qwen3.5-4b.gguf' = "sha256:$digest" }
        license = $licenseText
        parameters = @{ num_ctx = 16384 }
        stream = $false
    } | ConvertTo-Json -Depth 8
    $createContent = [System.Net.Http.StringContent]::new(
        $createBody,
        [System.Text.Encoding]::UTF8,
        'application/json'
    )
    $createResponse = $httpClient.PostAsync("$baseUrl/api/create", $createContent).GetAwaiter().GetResult()
    $createStream = $createResponse.Content.ReadAsStreamAsync().GetAwaiter().GetResult()
    $reader = [System.IO.StreamReader]::new($createStream)
    $lastStatus = $null

    while ($null -ne ($line = $reader.ReadLine())) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $event = $line | ConvertFrom-Json
        if ($event.error) { throw "Ollama could not create $modelName`: $($event.error)" }
        if ($event.status) {
            $lastStatus = $event.status
            Write-Host $event.status
        }
    }

    if (-not $createResponse.IsSuccessStatusCode -or $lastStatus -ne 'success') {
        throw "Ollama did not confirm installation of $modelName. Last reported status: $lastStatus"
    }
} finally {
    $httpClient.Dispose()
}

Write-Host "$modelName is ready. Focule connects only to Ollama at 127.0.0.1:11434."
