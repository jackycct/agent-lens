$ErrorActionPreference = "Stop"

if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Chocolatey is not installed. Please install Chocolatey or use winget/MSYS2 fallback."
    exit 1
}

if (-not (Get-Command make -ErrorAction SilentlyContinue)) {
    choco install make -y
}

make --version
