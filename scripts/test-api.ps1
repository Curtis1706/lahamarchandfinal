# Script de test des endpoints critiques (Windows PowerShell)
# Usage: .\scripts\test-api.ps1 [URL]
# Exemple: .\scripts\test-api.ps1 https://votre-domaine.com

param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🧪 Test des endpoints API - LAHA Marchand" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "URL: $BaseUrl"
Write-Host ""

$total = 0
$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus
    )
    
    Write-Host "Testing $Name... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -ErrorAction SilentlyContinue -TimeoutSec 10
        $status = $response.StatusCode
        
        if ($status -eq $ExpectedStatus) {
            Write-Host "✓ OK" -ForegroundColor Green -NoNewline
            Write-Host " (HTTP $status)"
            return $true
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " (Expected $ExpectedStatus, got $status)"
            return $false
        }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq $ExpectedStatus) {
            Write-Host "✓ OK" -ForegroundColor Green -NoNewline
            Write-Host " (HTTP $status)"
            return $true
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " (Expected $ExpectedStatus, got $status)"
            return $false
        }
    }
}

function Test-EndpointWithBody {
    param(
        [string]$Name,
        [string]$Url
    )
    
    Write-Host "Testing $Name... " -NoNewline
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -ErrorAction Stop -TimeoutSec 10
        Write-Host "✓ OK" -ForegroundColor Green
        
        if ($response.status) {
            Write-Host "  Response: $($response.status)" -ForegroundColor Gray
        }
        return $true
    } catch {
        Write-Host "✗ FAIL" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Tests
Write-Host "📡 Public Endpoints" -ForegroundColor Yellow
Write-Host "-------------------"

# Test 1: Health check
$total++
if (Test-EndpointWithBody "Healthcheck" "$BaseUrl/api/health") { $passed++ } else { $failed++ }

# Test 2: Login page
$total++
if (Test-Endpoint "Login page" "$BaseUrl/auth/signin" 200) { $passed++ } else { $failed++ }

# Test 3: Home page
$total++
if (Test-Endpoint "Home page" "$BaseUrl/" 200) { $passed++ } else { $failed++ }

Write-Host ""
Write-Host "🔒 Protected Endpoints (should return 401)" -ForegroundColor Yellow
Write-Host "-----------------------------------------"

# Test 4: Dashboard PDG (non authentifié)
$total++
if (Test-Endpoint "PDG Dashboard" "$BaseUrl/api/pdg/dashboard" 401) { $passed++ } else { $failed++ }

# Test 5: Orders API (non authentifié)
$total++
if (Test-Endpoint "Orders API" "$BaseUrl/api/orders" 401) { $passed++ } else { $failed++ }

# Test 6: Works API (non authentifié)
$total++
if (Test-Endpoint "Works API" "$BaseUrl/api/pdg/stock/works" 403) { $passed++ } else { $failed++ }

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📊 RÉSULTATS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Total tests:   $total"
Write-Host "Passed:        " -NoNewline
Write-Host "$passed" -ForegroundColor Green
Write-Host "Failed:        " -NoNewline
Write-Host "$failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some tests failed" -ForegroundColor Yellow
    exit 1
}

