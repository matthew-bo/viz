# Test 5.1.1: Canton Container Health
# Verifies all 4 Canton containers are running and healthy

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test 5.1.1: Canton Container Health Check" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

# Expected containers
$expectedContainers = @(
    "canton-synchronizer",
    "canton-participant1",
    "canton-participant2",
    "canton-participant3"
)

Write-Host "Checking for 4 Canton containers..." -ForegroundColor Yellow

# Get all Canton containers
$containers = docker ps --filter "name=canton-" --format "{{.Names}}" | Out-String -Stream | Where-Object { $_ }

if ($containers.Count -eq 4) {
    Write-Host "[PASS] Found 4 Canton containers" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "[FAIL] Expected 4 containers, found $($containers.Count)" -ForegroundColor Red
    $testsFailed++
}

# Check each expected container
Write-Host ""
Write-Host "Checking individual containers:" -ForegroundColor Yellow

foreach ($containerName in $expectedContainers) {
    $exists = docker ps --filter "name=$containerName" --format "{{.Names}}" | Out-String -Stream | Where-Object { $_ }
    
    if ($exists) {
        # Get uptime
        $uptime = docker ps --filter "name=$containerName" --format "{{.Status}}"
        Write-Host "[PASS] $containerName - Status: $uptime" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] $containerName - NOT FOUND" -ForegroundColor Red
        $testsFailed++
    }
}

# Check ports are exposed
Write-Host ""
Write-Host "Checking port mappings:" -ForegroundColor Yellow

$expectedPorts = @{
    "canton-synchronizer" = @(5018, 5019)
    "canton-participant1" = @(5011, 5012, 7011)
    "canton-participant2" = @(5021, 5022, 7021)
    "canton-participant3" = @(5031, 5032, 7031)
}

foreach ($container in $expectedPorts.Keys) {
    $ports = docker port $container 2>$null
    
    if ($ports) {
        $portCount = ($expectedPorts[$container]).Count
        Write-Host "[PASS] $container - $portCount ports mapped" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] $container - No ports mapped" -ForegroundColor Red
        $testsFailed++
    }
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Results" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor Red
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "[PASS] All container health checks PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] Some container health checks FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check if Docker is running: docker ps"
    Write-Host "2. Start containers: cd infrastructure; docker-compose up -d"
    Write-Host "3. Check logs: docker logs canton-synchronizer"
    exit 1
}

