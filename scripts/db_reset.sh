#!/bin/bash

# Database Reset Script
# Drops all tables and re-runs migrations (preserves container/volume)

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/../server/server"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Database Reset${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Confirm reset
echo -e "${RED}⚠️  WARNING: This will DELETE ALL DATA in the database!${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Reset cancelled${NC}"
    exit 0
fi

# 1. Create backup first
echo -e "\n${YELLOW}[1/4] Creating safety backup...${NC}"
"$SCRIPT_DIR/db_backup.sh"

# 2. Downgrade all migrations
echo -e "\n${YELLOW}[2/4] Rolling back all migrations...${NC}"
cd "$SERVER_DIR"
source venv/bin/activate
alembic downgrade base
echo -e "${GREEN}✓ Migrations rolled back${NC}"

# 3. Re-run all migrations
echo -e "\n${YELLOW}[3/4] Re-running migrations...${NC}"
alembic upgrade head
echo -e "${GREEN}✓ Migrations applied${NC}"

# 4. Seed database (if seed script exists)
if [ -f "$SCRIPT_DIR/db_seed.sh" ]; then
    echo -e "\n${YELLOW}[4/4] Seeding database...${NC}"
    "$SCRIPT_DIR/db_seed.sh"
else
    echo -e "\n${YELLOW}[4/4] Skipping seed (no seed script found)${NC}"
fi

echo -e "\n${GREEN}✅ Database reset complete!${NC}"
echo -e "${BLUE}Database is now fresh with all migrations applied${NC}\n"
