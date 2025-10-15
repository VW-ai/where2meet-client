#!/bin/bash

# Where2Meet - Stop All Services
# This script stops frontend, backend, and Docker containers

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Where2Meet - Stopping All Services${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Stop Frontend
echo -e "${YELLOW}[1/3] Stopping Next.js frontend...${NC}"
if [ -f "$SCRIPT_DIR/logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/logs/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Frontend stopped (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠ Frontend not running${NC}"
    fi
    rm "$SCRIPT_DIR/logs/frontend.pid"
else
    # Try to kill by port
    if lsof -ti:4000 > /dev/null 2>&1; then
        lsof -ti:4000 | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✓ Frontend process on port 4000 stopped${NC}"
    else
        echo -e "${YELLOW}⚠ Frontend not running${NC}"
    fi
fi

# 2. Stop Backend
echo -e "\n${YELLOW}[2/3] Stopping FastAPI backend...${NC}"
if [ -f "$SCRIPT_DIR/logs/backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/logs/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Backend stopped (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠ Backend not running${NC}"
    fi
    rm "$SCRIPT_DIR/logs/backend.pid"
else
    # Try to kill by port
    if lsof -ti:5001 > /dev/null 2>&1; then
        lsof -ti:5001 | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✓ Backend process on port 5001 stopped${NC}"
    else
        echo -e "${YELLOW}⚠ Backend not running${NC}"
    fi
fi

# 3. Stop Docker containers
echo -e "\n${YELLOW}[3/3] Stopping Docker containers...${NC}"
cd "$SCRIPT_DIR/server/server"
if docker compose ps | grep -q "Up"; then
    docker compose down
    echo -e "${GREEN}✓ Docker containers stopped${NC}"
else
    echo -e "${YELLOW}⚠ Docker containers not running${NC}"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ All services stopped!${NC}"
echo -e "${BLUE}========================================${NC}\n"
