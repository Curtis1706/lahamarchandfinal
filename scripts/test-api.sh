#!/bin/bash

# Script de test des endpoints critiques
# Usage: ./scripts/test-api.sh [URL]
# Exemple: ./scripts/test-api.sh https://votre-domaine.com

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL de base (localhost par défaut)
BASE_URL="${1:-http://localhost:3000}"

echo "================================================"
echo "🧪 Test des endpoints API - LAHA Marchand"
echo "================================================"
echo "URL: $BASE_URL"
echo ""

# Fonction pour tester un endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $response)"
        return 1
    fi
}

# Fonction pour tester avec corps de réponse
test_endpoint_with_body() {
    local name=$1
    local url=$2
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url")
    status=$?
    
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓ OK${NC}"
        echo "  Response: $(echo $response | jq -r '.status // .message // "OK"' 2>/dev/null || echo $response | head -c 100)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

# Compteurs
total=0
passed=0
failed=0

echo "📡 Public Endpoints"
echo "-------------------"

# Test 1: Health check
test_endpoint_with_body "Healthcheck" "$BASE_URL/api/health"
((total++))
[ $? -eq 0 ] && ((passed++)) || ((failed++))

# Test 2: Login page
test_endpoint "Login page" "$BASE_URL/auth/signin" "200"
((total++))
[ $? -eq 0 ] && ((passed++)) || ((failed++))

# Test 3: Home page
test_endpoint "Home page" "$BASE_URL/" "200"
((total++))
[ $? -eq 0 ] && ((passed++)) || ((failed++))

echo ""
echo "🔒 Protected Endpoints (should return 401)"
echo "-----------------------------------------"

# Test 4: Dashboard PDG (non authentifié)
test_endpoint "PDG Dashboard" "$BASE_URL/dashboard/pdg" "401"
((total++))
[ $? -eq 0 ] && ((passed++)) || ((failed++))

# Test 5: Orders API (non authentifié)
test_endpoint "Orders API" "$BASE_URL/api/orders" "401"
((total++))
[ $? -eq 0 ] && ((passed++)) || ((failed++))

# Test 6: Works API (non authentifié)
test_endpoint "Works API" "$BASE_URL/api/pdg/stock/works" "401"
((total++))
[ $? -eq 0 ] && ((passed++)) || ((failed++))

echo ""
echo "================================================"
echo "📊 RÉSULTATS"
echo "================================================"
echo "Total tests:   $total"
echo -e "Passed:        ${GREEN}$passed${NC}"
echo -e "Failed:        ${RED}$failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    exit 1
fi

