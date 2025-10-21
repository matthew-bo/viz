# Fix Windows Junctions in daml-types for Docker Build
# Converts junction symlinks to actual directory copies

Write-Host "Fixing daml-types junctions for Docker build..." -ForegroundColor Cyan

$damlTypesPath = "src/daml-types"

# Find all junctions in daml-types
$junctions = Get-ChildItem $damlTypesPath -Recurse -Force | Where-Object {$_.LinkType -eq "Junction"}

Write-Host "Found $($junctions.Count) junctions to fix"

foreach ($junction in $junctions) {
    $junctionPath = $junction.FullName
    $targetPath = $junction.Target[0]
    
    Write-Host "  Fixing: $($junction.Name)"
    Write-Host "    From: $junctionPath"
    Write-Host "    To: $targetPath"
    
    # Remove the junction
    $junction.Delete()
    
    # Copy the actual directory content
    Copy-Item -Path $targetPath -Destination $junctionPath -Recurse -Force
    
    Write-Host "    [OK] Converted to real directory"
}

Write-Host ""
Write-Host "All junctions converted to real directories!" -ForegroundColor Green
Write-Host "You can now run: docker-compose build backend" -ForegroundColor Yellow
Write-Host ""

