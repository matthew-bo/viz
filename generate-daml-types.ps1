# Generate TypeScript types from Daml contracts
Write-Host "Generating TypeScript types from Daml..." -ForegroundColor Cyan

Set-Location daml

# Generate types
daml codegen js -o ..\backend\src\daml-types .daml\dist\payment-demo-0.0.1.dar

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! TypeScript types generated in backend/src/daml-types/" -ForegroundColor Green
    Write-Host ""
    Write-Host "Generated files:" -ForegroundColor Cyan
    Get-ChildItem ..\backend\src\daml-types -Recurse -File | Select-Object FullName
} else {
    Write-Host ""
    Write-Host "FAILED! Error code: $LASTEXITCODE" -ForegroundColor Red
}

Set-Location ..

