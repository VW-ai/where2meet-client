#!/bin/bash

# Comprehensive Health Check Script
# Checks status of all services and their dependencies

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Where2Meet Health Check${NC}"
echo -e "${BLUE}========================================${NC}\n"

ERRORS=0

# Function to check service
check_service() {
    local name="$1"
    local check_cmd="$2"

    if eval "$check_cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
        return 0
    else
        echo -e "${RED}✗${NC} $name"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

echo -e "${YELLOW}Infrastructure:${NC}"
check_service "Docker daemon" "docker ps"
check_service "PostgreSQL container" "docker ps | grep -q where2meet-postgres"
check_service "Redis container" "docker ps | grep -q where2meet-redis"

echo -e "\n${YELLOW}Databases:${NC}"
check_service "PostgreSQL responsive" "docker exec where2meet-postgres pg_isready -U where2meet"
check_service "Redis responsive" "docker exec where2meet-redis redis-cli ping | grep -q PONG"

echo -e "\n${YELLOW}Application Services:${NC}"
check_service "Backend API (port 5001)" "curl -s http://localhost:5001/health"
check_service "Frontend (port 4000)" "curl -s http://localhost:4000"

echo -e "\n${YELLOW}Database Connectivity:${NC}"
if docker exec where2meet-postgres psql -U where2meet -d where2meet -c "SELECT 1" > /dev/null 2>&1; then
    # Count records
    EVENTS=$(docker exec where2meet-postgres psql -U where2meet -d where2meet -t -c "SELECT COUNT(*) FROM feed_events" 2>/dev/null | tr -d ' ' || echo "0")
    USERS=$(docker exec where2meet-postgres psql -U where2meet -d where2meet -t -c "SELECT COUNT(*) FROM users" 2>/dev/null | tr -d ' ' || echo "0")

    echo -e "${GREEN}✓${NC} Database connected"
    echo -e "  • Events: ${EVENTS}"
    echo -e "  • Users: ${USERS}"
else
    echo -e "${RED}✗${NC} Database connection failed"
    ERRORS=$((ERRORS + 1))
fi

echo -e "\n${YELLOW}Disk Usage:${NC}"
POSTGRES_SIZE=$(docker exec where2meet-postgres du -sh /var/lib/postgresql/data 2>/dev/null | cut -f1 || echo "N/A")
echo -e "  • PostgreSQL data: ${POSTGRES_SIZE}"

# Process info
echo -e "\n${YELLOW}Running Processes:${NC}"
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend (PID: $BACKEND_PID)"
    else
        echo -e "${RED}✗${NC} Backend (stale PID file)"
    fi
else
    echo -e "${YELLOW}?${NC} Backend (no PID file)"
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Frontend (PID: $FRONTEND_PID)"
    else
        echo -e "${RED}✗${NC} Frontend (stale PID file)"
    fi
else
    echo -e "${YELLOW}?${NC} Frontend (no PID file)"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All systems operational${NC}"
    exit 0
else
    echo -e "${RED}⚠️  ${ERRORS} issue(s) detected${NC}"
    exit 1
fi
