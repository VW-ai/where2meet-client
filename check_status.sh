#!/bin/bash

# Where2Meet - Check Services Status
# This script checks if all services are running

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Where2Meet - Services Status${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

ALL_OK=true

# Check Frontend (port 4000)
echo -e "${YELLOW}Frontend (port 4000):${NC}"
if curl -s http://localhost:4000 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Running${NC} - http://localhost:4000"
else
    echo -e "  ${RED}✗ Not running${NC}"
    ALL_OK=false
fi

# Check Backend (port 5001)
echo -e "\n${YELLOW}Backend API (port 5001):${NC}"
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:5001/health)
    echo -e "  ${GREEN}✓ Running${NC} - http://localhost:5001"
    echo -e "  Health: $HEALTH"
else
    echo -e "  ${RED}✗ Not running${NC}"
    ALL_OK=false
fi

# Check PostgreSQL
echo -e "\n${YELLOW}PostgreSQL (port 5432):${NC}"
if docker exec where2meet-postgres pg_isready -U where2meet > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Running${NC} - localhost:5432"
else
    echo -e "  ${RED}✗ Not running${NC}"
    ALL_OK=false
fi

# Check Redis
echo -e "\n${YELLOW}Redis (port 6379):${NC}"
if docker exec where2meet-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Running${NC} - localhost:6379"
else
    echo -e "  ${RED}✗ Not running${NC}"
    ALL_OK=false
fi

# Check Docker containers
echo -e "\n${YELLOW}Docker Containers:${NC}"
docker compose -f "$SCRIPT_DIR/server/server/docker-compose.yml" ps

# Check PIDs
echo -e "\n${YELLOW}Process IDs:${NC}"
if [ -f "$SCRIPT_DIR/logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/logs/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "  Frontend PID: ${GREEN}$FRONTEND_PID (running)${NC}"
    else
        echo -e "  Frontend PID: ${RED}$FRONTEND_PID (not running)${NC}"
    fi
else
    echo -e "  Frontend PID: ${YELLOW}not found${NC}"
fi

if [ -f "$SCRIPT_DIR/logs/backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/logs/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "  Backend PID:  ${GREEN}$BACKEND_PID (running)${NC}"
    else
        echo -e "  Backend PID:  ${RED}$BACKEND_PID (not running)${NC}"
    fi
else
    echo -e "  Backend PID:  ${YELLOW}not found${NC}"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✅ All services are running!${NC}"
else
    echo -e "${RED}⚠️  Some services are not running${NC}"
    echo -e "${YELLOW}Run ./start_all.sh to start services${NC}"
fi
echo -e "${BLUE}========================================${NC}\n"
