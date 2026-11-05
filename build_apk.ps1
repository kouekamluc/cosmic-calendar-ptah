# Ptah Kamgou - one-click Android APK build (EAS cloud)
$ErrorActionPreference = "Continue"
Set-Location -Path $PSScriptRoot
Start-Transcript -Path "$PSScriptRoot\build_log.txt" -Force | Out-Null
Write-Host "=== Ptah Kamgou APK build ===" -ForegroundColor Yellow

# 1. Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js not found - installing Node.js LTS with winget (accept the Windows prompt if it appears)..."
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host "STEP FAILED: node" -ForegroundColor Red; Stop-Transcript; Read-Host "Press Enter"; exit 1 }
Write-Host "Node: $(node -v)"

# 2. Expo token
$tokFile = "$PSScriptRoot\expo_token.txt"
if (-not (Test-Path $tokFile)) { Write-Host "STEP FAILED: expo_token.txt missing" -ForegroundColor Red; Stop-Transcript; Read-Host "Press Enter"; exit 1 }
$env:EXPO_TOKEN = (Get-Content $tokFile -Raw).Trim()

# 3. Dependencies
Write-Host "Installing packages..."
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Write-Host "STEP FAILED: npm install" -ForegroundColor Red; Stop-Transcript; Read-Host "Press Enter"; exit 1 }

# 4. Account + project
npx --yes eas-cli@latest whoami
npx --yes eas-cli@latest init --non-interactive --force
if ($LASTEXITCODE -ne 0) { Write-Host "STEP FAILED: eas init" -ForegroundColor Red; Stop-Transcript; Read-Host "Press Enter"; exit 1 }

# 5. Cloud build (APK)
Write-Host "Starting cloud build (about 10-20 min)..."
npx --yes eas-cli@latest build -p android --profile preview --non-interactive
if ($LASTEXITCODE -ne 0) { Write-Host "STEP FAILED: eas build" -ForegroundColor Red } else { Write-Host "BUILD DONE" -ForegroundColor Green }
Stop-Transcript | Out-Null
Read-Host "Press Enter to close"
