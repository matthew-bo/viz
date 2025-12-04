# Canton Health Check Script
# Validates Canton infrastructure is operational

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Canton Privacy Blockchain - Health Check" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$WarningCount = 0

# Check 1: Docker containers running
Write-Host "[1/7] Checking Docker containers..." -ForegroundColor Yellow
try {
    $containers = docker ps --filter "name=canton-" --format "{{.Names}}\t{{.Status}}" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Docker not running or not accessible" -ForegroundColor Red
        $ErrorCount++
    } else {
        $containerList = $containers | Where-Object { $_ -match "canton-" }
        $healthyCount = ($containerList | Where-Object { $_ -match "healthy" }).Count
        $totalCount = $containerList.Count
        
        if ($totalCount -eq 0) {
            Write-Host "  ✗ No Canton containers found" -ForegroundColor Red
            $ErrorCount++
        } elseif ($healthyCount -lt 4) {
            Write-Host "  ⚠ Only $healthyCount/4 containers healthy" -ForegroundColor Yellow
            $WarningCount++
        } else {
            Write-Host "  ✓ All 4 Canton containers healthy" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  ✗ Error checking Docker: $_" -ForegroundColor Red
    $ErrorCount++
}

# Check 2: Participant ports accessible
Write-Host "[2/7] Checking Canton participant ports..." -ForegroundColor Yellow
$ports = @(5011, 5012, 5021, 5022, 5031, 5032, 5018, 5019)
$accessiblePorts = 0

foreach ($port in $ports) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -ErrorAction Stop
        if ($connection.TcpTestSucceeded) {
            $accessiblePorts++
        }
    } catch {
        # Port not accessible
    }
}

if ($accessiblePorts -eq 8) {
    Write-Host "  ✓ All 8 Canton ports accessible" -ForegroundColor Green
} elseif ($accessiblePorts -ge 6) {
    Write-Host "  ⚠ Only $accessiblePorts/8 ports accessible" -ForegroundColor Yellow
    $WarningCount++
} else {
    Write-Host "  ✗ Only $accessiblePorts/8 ports accessible" -ForegroundColor Red
    $ErrorCount++
}

# Check 3: Backend health endpoint
Write-Host "[3/7] Checking backend health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    
    if ($response.status -eq "healthy") {
        Write-Host "  ✓ Backend healthy" -ForegroundColor Green
        Write-Host "    Version: $($response.version)" -ForegroundColor Gray
        Write-Host "    Canton: $($response.services.canton.message)" -ForegroundColor Gray
    } elseif ($response.status -eq "degraded") {
        Write-Host "  ⚠ Backend degraded: $($response.services.canton.message)" -ForegroundColor Yellow
        $WarningCount++
    } else {
        Write-Host "  ✗ Backend unhealthy" -ForegroundColor Red
        $ErrorCount++
    }
} catch {
    Write-Host "  ✗ Backend not responding" -ForegroundColor Red
    $ErrorCount++
}

# Check 4: Party IDs configured
Write-Host "[4/7] Checking party configuration..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/parties" -Method Get -TimeoutSec 5 -ErrorAction Stop
    
    if ($response.Count -eq 3) {
        Write-Host "  ✓ All 3 parties configured" -ForegroundColor Green
        foreach ($party in $response) {
            Write-Host "    - $($party.displayName): $($party.partyId.Substring(0, 30))..." -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✗ Expected 3 parties, found $($response.Count)" -ForegroundColor Red
        $ErrorCount++
    }
} catch {
    Write-Host "  ✗ Cannot retrieve parties" -ForegroundColor Red
    $ErrorCount++
}

# Check 5: Can query transactions
Write-Host "[5/7] Checking transaction query..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/contracts?limit=10" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ Transaction query successful ($($response.Count) transactions)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Transaction query failed" -ForegroundColor Red
    $ErrorCount++
}

# Check 6: SSE endpoint accessible
Write-Host "[6/7] Checking SSE endpoint..." -ForegroundColor Yellow
try {
    $request = [System.Net.WebRequest]::Create("http://localhost:3001/api/events")
    $request.Method = "GET"
    $request.Timeout = 5000
    $response = $request.GetResponse()
    
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ SSE endpoint accessible" -ForegroundColor Green
    }
    $response.Close()
} catch {
    Write-Host "  ✗ SSE endpoint not accessible" -ForegroundColor Red
    $ErrorCount++
}

# Check 7: Frontend accessible (if running)
Write-Host "[7/7] Checking frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 3 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Frontend accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠ Frontend not running (optional)" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Health Check Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "  ✓ ALL SYSTEMS OPERATIONAL" -ForegroundColor Green
    exit 0
} elseif ($ErrorCount -eq 0) {
    Write-Host "  ⚠ SYSTEM DEGRADED ($WarningCount warnings)" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "  ✗ SYSTEM UNHEALTHY ($ErrorCount errors, $WarningCount warnings)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Ensure Docker is running: docker ps" -ForegroundColor Gray
    Write-Host "  2. Start Canton: docker-compose up -d" -ForegroundColor Gray
    Write-Host "  3. Initialize Canton: .\infrastructure\init-canton-final.ps1" -ForegroundColor Gray
    Write-Host "  4. Start backend: cd backend && npm run dev" -ForegroundColor Gray
    exit 1
}





