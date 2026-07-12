#!/bin/bash
# Start All Services - StudyGen AI
# This script starts the complete development environment

echo "=========================================="
echo "Starting StudyGen AI Complete Stack"
echo "=========================================="
echo ""
echo "This will start:"
echo "  1. Frontend (Vite) on http://localhost:5173"
echo "  2. Backend (FastAPI) on http://localhost:8000"
echo "  3. Supabase Local Stack on http://localhost:54321"
echo ""
echo "Requirements:"
echo "  - Supabase CLI: npm install -g supabase"
echo "  - Docker: For local Supabase stack"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Start Supabase (if available)
if command -v supabase &> /dev/null; then
    echo -e "${BLUE}Starting Supabase local stack...${NC}"
    supabase start &
    SUPABASE_PID=$!
    sleep 5
    echo -e "${GREEN}✓ Supabase started${NC}"
else
    echo -e "${BLUE}⚠ Supabase CLI not found. Skipping local Supabase stack.${NC}"
    echo "  Install with: npm install -g supabase"
fi

# Start Backend
echo ""
echo -e "${BLUE}Starting Backend...${NC}"
gnome-terminal -- bash -c "./start-backend.sh" &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend starting (PID: $BACKEND_PID)${NC}"
sleep 2

# Start Frontend
echo ""
echo -e "${BLUE}Starting Frontend...${NC}"
gnome-terminal -- bash -c "./start-frontend.sh" &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend starting (PID: $FRONTEND_PID)${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}All services started!${NC}"
echo "=========================================="
echo ""
echo "Frontend:  http://localhost:5173"
echo "Backend:   http://localhost:8000"
echo "Supabase:  http://localhost:54321"
echo ""
echo "To stop all services, press Ctrl+C"
echo ""

# Wait for any process to exit
wait -n
