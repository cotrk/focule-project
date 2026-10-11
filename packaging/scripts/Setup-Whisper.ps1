$ErrorActionPreference = 'Stop'

$pythonCandidates = @(
    @{ Executable = 'python'; Prefix = @() },
    @{ Executable = 'py'; Prefix = @('-3.11') },
    @{ Executable = 'py'; Prefix = @() },
    @{ Executable = 'python3'; Prefix = @() }
)
$python = $null

foreach ($candidate in $pythonCandidates) {
    try {
        $null = & $candidate.Executable @($candidate.Prefix + @('-c', 'import sys; print(sys.executable)')) 2>$null
        if ($LASTEXITCODE -eq 0) {
            $python = $candidate
            break
        }
    } catch {
        continue
    }
}

if (-not $python) {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host 'Installing Python 3.11 for Whisper...'
        & winget install --id Python.Python.3.11 --exact --scope user --accept-package-agreements --accept-source-agreements
        if ($LASTEXITCODE -ne 0) {
            throw 'Python installation failed. Install Python 3.11 or newer from https://www.python.org/downloads/ and rerun this script.'
        }
        throw 'Python was installed. Close and reopen PowerShell, then run Setup-Whisper.ps1 again.'
    }
    throw 'Python 3.11 or newer is required. Install it from https://www.python.org/downloads/, then rerun this script.'
}

$pythonArgs = @($python.Prefix)
& $python.Executable @($pythonArgs + @('-c', 'import whisper')) 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Installing OpenAI Whisper and its local Python dependencies. This may take a while.'
    & $python.Executable @($pythonArgs + @('-m', 'pip', 'install', '--user', 'openai-whisper'))
    if ($LASTEXITCODE -ne 0) {
        throw 'Whisper installation failed. Confirm this Python has pip and internet access, then retry.'
    }
}

& $python.Executable @($pythonArgs + @('-c', 'import whisper; print("Whisper ready:", whisper.__file__)'))
if ($LASTEXITCODE -ne 0) {
    throw 'Whisper was installed but cannot be imported by the selected Python runtime.'
}

Write-Host 'Whisper is ready. Focule includes the base checkpoint in its installed resources.'
