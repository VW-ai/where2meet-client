#!/bin/bash

# Where2Meet - Start All Services
# This script starts Docker containers, backend API, and frontend dev server

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Where2Meet - Starting All Services${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Start Docker containers (PostgreSQL & Redis)
echo -e "${YELLOW}[1/3] Starting Docker containers...${NC}"
cd "$SCRIPT_DIR/server/server"
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Docker containers already running${NC}"
else
    docker compose up -d
    echo -e "${GREEN}✓ Docker containers started${NC}"
fi

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 3
until docker exec where2meet-postgres pg_isready -U where2meet > /dev/null 2>&1; do
    echo -e "${YELLOW}  Waiting for PostgreSQL...${NC}"
    sleep 2
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# 2. Start FastAPI Backend (port 5001)
echo -e "\n${YELLOW}[2/3] Starting FastAPI backend on port 5001...${NC}"
cd "$SCRIPT_DIR/server/server"

# Check if backend is already running
if lsof -ti:5001 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port 5001 already in use, killing existing process...${NC}"
    lsof -ti:5001 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Start backend in background
source venv/bin/activate
mkdir -p "$SCRIPT_DIR/logs"
nohup uvicorn app.main:app --reload --port 5001 > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$SCRIPT_DIR/logs/backend.pid"

# Wait for backend to start
sleep 3
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API running on http://localhost:5001 (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Backend failed to start. Check logs/backend.log${NC}"
    exit 1
fi

# 3. Start Next.js Frontend (port 4000)
echo -e "\n${YELLOW}[3/3] Starting Next.js frontend on port 4000...${NC}"
cd "$SCRIPT_DIR"

# Create logs directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/logs"

# Check if frontend is already running
if lsof -ti:4000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port 4000 already in use, killing existing process...${NC}"
    lsof -ti:4000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Start frontend in background
nohup pnpm dev > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$SCRIPT_DIR/logs/frontend.pid"

# Wait for frontend to start
sleep 5
if curl -s http://localhost:4000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend running on http://localhost:4000 (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}✗ Frontend failed to start. Check logs/frontend.log${NC}"
    exit 1
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${GREEN}Services:${NC}"
echo -e "  📱 Frontend:   ${BLUE}http://localhost:4000${NC}"
echo -e "  🔌 Backend:    ${BLUE}http://localhost:5001${NC}"
echo -e "  🗄️  PostgreSQL: ${BLUE}localhost:5432${NC}"
echo -e "  🔴 Redis:      ${BLUE}localhost:6379${NC}"

echo -e "\n${GREEN}Logs:${NC}"
echo -e "  📄 Backend:  ${YELLOW}tail -f logs/backend.log${NC}"
echo -e "  📄 Frontend: ${YELLOW}tail -f logs/frontend.log${NC}"

echo -e "\n${GREEN}To stop all services:${NC}"
echo -e "  ${YELLOW}./stop_all.sh${NC}"

echo -e "\n${GREEN}PIDs saved to:${NC}"
echo -e "  Backend:  logs/backend.pid ($BACKEND_PID)"
echo -e "  Frontend: logs/frontend.pid ($FRONTEND_PID)"
echo ""
