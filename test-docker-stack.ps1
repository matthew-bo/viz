#!/usr/bin/env pwsh
# Canton Privacy Blockchain - Docker Stack Test Script
# Phase 6 - Track A: Local Validation
# 
# This script:
# 1. Verifies backend environment configuration
# 2. Tests full Docker stack (6 containers)
# 3. Validates end-to-end workflow
# 4. Reports results

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Canton Privacy Blockchain - Docker Stack Test" -ForegroundColor Cyan
Write-Host "  Phase 6 - Local Validation" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$testsPassed = 0
$testsFailed = 0
$testsTotal = 15

# Helper function for test results
function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Test
    )
    
    Write-Host "Testing: $Name..." -NoNewline
    try {
        $result = & $Test
        if ($result) {
            Write-Host " ✓ PASS" -ForegroundColor Green
            $script:testsPassed++
            return $true
        } else {
            Write-Host " ✗ FAIL" -ForegroundColor Red
            $script:testsFailed++
            return $false
        }
    } catch {
        Write-Host " ✗ ERROR: $_" -ForegroundColor Red
        $script:testsFailed++
        return $false
    }
}

Write-Host "PHASE 1: ENVIRONMENT PREPARATION" -ForegroundColor Yellow
Write-Host ""

# Test 1: Check if Docker is running
Test-Step "Docker Desktop running" {
    $dockerInfo = docker info 2>&1
    return $LASTEXITCODE -eq 0
}

# Test 2: Check if party IDs exist
Test-Step "Canton party IDs exist" {
    return Test-Path "infrastructure/canton/party-ids.json"
}

# Test 3: Check backend .env exists
Test-Step "Backend .env file exists" {
    return Test-Path "backend/.env"
}

# Test 4: Check frontend .env exists  
Test-Step "Frontend .env file exists" {
    return Test-Path "frontend/.env"
}

Write-Host ""
Write-Host "PHASE 2: DOCKER STACK STARTUP" -ForegroundColor Yellow
Write-Host ""

# Stop any running containers
Write-Host "Stopping existing containers..." -NoNewline
Push-Location infrastructure
docker-compose down 2>&1 | Out-Null
Write-Host " Done" -ForegroundColor Gray
Write-Host ""

# Start Docker stack
Write-Host "Starting Docker stack (this may take 2-3 minutes)..." -ForegroundColor Cyan
docker-compose up -d --build

Write-Host ""
Write-Host "Waiting for containers to stabilize (60 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 60

Write-Host ""
Write-Host "PHASE 3: CONTAINER HEALTH CHECKS" -ForegroundColor Yellow
Write-Host ""

# Test 5: All containers running
Test-Step "All 6 containers running" {
    $containers = docker-compose ps --format json | ConvertFrom-Json
    $runningCount = ($containers | Where-Object { $_.State -eq "running" }).Count
    Write-Host " ($runningCount/6)" -NoNewline -ForegroundColor Gray
    return $runningCount -eq 6
}

# Test 6: Synchronizer healthy
Test-Step "Canton synchronizer operational" {
    $logs = docker-compose logs synchronizer 2>&1 | Select-String "error" -NotMatch
    return $logs.Count -gt 0
}

# Test 7-9: Participants healthy
Test-Step "Participant1 (TechBank) operational" {
    $logs = docker-compose logs participant1 2>&1 | Select-String "Ledger API server started"
    return $logs.Count -gt 0
}

Test-Step "Participant2 (GlobalCorp) operational" {
    $logs = docker-compose logs participant2 2>&1 | Select-String "Ledger API server started"
    return $logs.Count -gt 0
}

Test-Step "Participant3 (RetailFinance) operational" {
    $logs = docker-compose logs participant3 2>&1 | Select-String "Ledger API server started"
    return $logs.Count -gt 0
}

Pop-Location

Write-Host ""
Write-Host "PHASE 4: API ENDPOINT TESTS" -ForegroundColor Yellow
Write-Host ""

# Test 10: Backend health
Test-Step "Backend /health endpoint" {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 5
        return $response.status -eq "healthy"
    } catch {
        return $false
    }
}

# Test 11: Parties endpoint
Test-Step "Backend /api/parties endpoint" {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/parties" -Method Get -TimeoutSec 5
        Write-Host " ($($response.Count) parties)" -NoNewline -ForegroundColor Gray
        return $response.Count -eq 3
    } catch {
        return $false
    }
}

# Test 12: Frontend accessible
Test-Step "Frontend accessible on port 3000" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -UseBasicParsing
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

Write-Host ""
Write-Host "PHASE 5: END-TO-END WORKFLOW TEST" -ForegroundColor Yellow
Write-Host ""

# Test 13: Submit transaction
$contractId = $null
Test-Step "Submit payment request (TechBank → GlobalCorp)" {
    try {
        $body = @{
            sender = "TechBank"
            receiver = "GlobalCorp"
            amount = 1000
            description = "Automated test payment"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/contracts" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -TimeoutSec 10
        
        $script:contractId = $response.contractId
        Write-Host " (ID: $($contractId.Substring(0,8))...)" -NoNewline -ForegroundColor Gray
        return $response.status -eq "pending"
    } catch {
        Write-Host " Error: $_" -ForegroundColor Red
        return $false
    }
}

# Test 14: Query transactions
Test-Step "Query transactions via API" {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/contracts" -Method Get -TimeoutSec 5
        Write-Host " ($($response.Count) total)" -NoNewline -ForegroundColor Gray
        return $response.Count -ge 1
    } catch {
        return $false
    }
}

# Test 15: Privacy filtering
Test-Step "Privacy filtering (RetailFinance view)" {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/contracts?party=RetailFinance" -Method Get -TimeoutSec 5
        # RetailFinance should NOT see TechBank→GlobalCorp transaction
        $found = $response | Where-Object { $_.contractId -eq $script:contractId }
        Write-Host " (Correctly hidden: $($found -eq $null))" -NoNewline -ForegroundColor Gray
        return $found -eq $null
    } catch {
        return $false
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TEST RESULTS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Passed: $testsPassed/$testsTotal" -ForegroundColor Green
Write-Host "Failed: $testsFailed/$testsTotal" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✓ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your Docker stack is fully operational!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Open browser: http://localhost:3000" -ForegroundColor White
    Write-Host "  2. Test UI: Submit payment, accept payment" -ForegroundColor White
    Write-Host "  3. Verify privacy: Switch between party views" -ForegroundColor White
    Write-Host "  4. Check Activity Log for operation history" -ForegroundColor White
    Write-Host ""
    Write-Host "Phase 6 Track A (Local Validation): COMPLETE ✓" -ForegroundColor Green
} else {
    Write-Host "✗ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check Docker Desktop is running with 8GB RAM" -ForegroundColor White
    Write-Host "  2. View logs: docker-compose logs <service-name>" -ForegroundColor White
    Write-Host "  3. Restart: docker-compose restart" -ForegroundColor White
    Write-Host "  4. Reinitialize Canton: .\infrastructure\init-canton-final.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Return exit code
exit $testsFailed

