# Install dependencies for all generated Daml types
Write-Host "Installing Daml type dependencies..." -ForegroundColor Cyan

Set-Location backend\src\daml-types

# Get all package directories (those with package.json)
$packages = Get-ChildItem -Directory | Where-Object { Test-Path "$_\package.json" }

Write-Host "Found $($packages.Count) type packages to install" -ForegroundColor Cyan

foreach ($pkg in $packages) {
    Write-Host "Installing $($pkg.Name)..." -ForegroundColor Yellow
    Set-Location $pkg.Name
    npm install --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: $($pkg.Name) installed" -ForegroundColor Green
    } else {
        Write-Host "  FAILED: $($pkg.Name)" -ForegroundColor Red
    }
    Set-Location ..
}

Set-Location ..\..\..

Write-Host ""
Write-Host "Done! All Daml type packages installed." -ForegroundColor Green

