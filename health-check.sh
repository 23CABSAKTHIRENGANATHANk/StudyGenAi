#!/bin/bash
# Health Check - StudyGen AI
# Verifies that all services are properly configured

echo "=========================================="
echo "StudyGen AI - Health Check"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_service() {
    local name=$1
    local url=$2
    local port=$3
    
    echo -n "Checking $name on $url... "
    
    if timeout 3 curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED (Is it running on port $port?)${NC}"
        return 1
    fi
}

check_file() {
    local file=$1
    echo -n "Checking $file... "
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ Found${NC}"
        return 0
    else
        echo -e "${RED}✗ Missing${NC}"
        return 1
    fi
}

echo -e "${YELLOW}Configuration Files:${NC}"
check_file ".env.development"
check_file "backend/.env"
check_file "package.json"
check_file "backend/requirements.txt"

echo ""
echo -e "${YELLOW}Services:${NC}"
check_service "Frontend" "http://localhost:5173" "5173"
check_service "Backend" "http://localhost:8000" "8000"
check_service "Supabase" "http://localhost:54321" "54321"

echo ""
echo -e "${YELLOW}Database:${NC}"
if [ -n "$DATABASE_URL" ]; then
    echo -e "DATABASE_URL is set: ${GREEN}✓${NC}"
else
    echo -e "DATABASE_URL is not set: ${YELLOW}⚠${NC}"
fi

echo ""
echo -e "${YELLOW}Environment Variables:${NC}"
if [ -f "backend/.env" ]; then
    echo "Loading backend/.env..."
    set -a
    source backend/.env
    set +a
    
    if [ -n "$SUPABASE_URL" ]; then
        echo -e "  SUPABASE_URL: ${GREEN}✓${NC}"
    else
        echo -e "  SUPABASE_URL: ${RED}✗ Not set${NC}"
    fi
    
    if [ -n "$DATABASE_URL" ]; then
        echo -e "  DATABASE_URL: ${GREEN}✓${NC}"
    else
        echo -e "  DATABASE_URL: ${RED}✗ Not set${NC}"
    fi
else
    echo -e "${RED}✗ backend/.env not found${NC}"
fi

echo ""
echo "=========================================="
echo -e "${YELLOW}Quick Start:${NC}"
echo "  Terminal 1: ./start-backend.sh"
echo "  Terminal 2: ./start-frontend.sh"
echo "  Browser:    http://localhost:5173"
echo "=========================================="
